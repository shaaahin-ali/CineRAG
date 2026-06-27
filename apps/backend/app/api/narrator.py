"""
Cinematic Narrator API — Groq-powered scene narration.

Route:
  POST /api/v1/projects/{id}/narrator/generate
    Body: { scene_numbers: int[] | null, force_refresh: bool }
    Returns: [{ scene_number, narration }]

Uses Groq (30 req/min, 14,400 req/day — FREE) as primary LLM.
All scenes narrated in a SINGLE batch call.
Results cached in-memory per project.
"""

from __future__ import annotations

import asyncio
import json
import logging
import re
from typing import Any, Dict, List, Optional
from uuid import UUID

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from app.core.security import extract_token
from app.services.storage import SupabaseClient

logger = logging.getLogger(__name__)
router = APIRouter()

# ── In-memory cache: {project_id: {scene_number: narration}} ────────────────
_narration_cache: Dict[str, Dict[int, str]] = {}


class NarrationRequest(BaseModel):
    scene_numbers: Optional[List[int]] = None
    force_refresh: bool = False
    language: str = "english"


class SceneNarration(BaseModel):
    scene_number: int
    narration: str


# ── LLM call ─────────────────────────────────────────────────────────────────

async def _call_llm(prompt: str, max_tokens: int = 6000) -> str:
    """
    Call LLM: Groq first (generous free tier), then cascade.
    """
    from app.core.config import settings
    from openai import AsyncOpenAI

    # ── 1. Groq (primary — 30 req/min free) ──────────────────────────────────
    if settings.GROQ_API_KEY:
        client = AsyncOpenAI(
            api_key=settings.GROQ_API_KEY,
            base_url="https://api.groq.com/openai/v1",
        )
        for model in [settings.GROQ_QUALITY_MODEL, settings.GROQ_CHAT_MODEL]:
            try:
                resp = await client.chat.completions.create(
                    model=model,
                    max_tokens=max_tokens,
                    temperature=0.78,
                    messages=[{"role": "user", "content": prompt}],
                )
                text = (resp.choices[0].message.content or "").strip()
                if text:
                    logger.info(f"[narrator] ✓ Groq/{model} — {len(text)} chars")
                    return text
            except Exception as e:
                err = str(e)
                if "429" in err:
                    logger.warning(f"[narrator] Groq/{model} rate-limited, next model")
                    await asyncio.sleep(3)
                else:
                    logger.warning(f"[narrator] Groq/{model}: {e}")

    # ── 2. OpenRouter fallback ────────────────────────────────────────────────
    if settings.OPENROUTER_API_KEY:
        client = AsyncOpenAI(
            api_key=settings.OPENROUTER_API_KEY,
            base_url="https://openrouter.ai/api/v1",
        )
        or_models = list(dict.fromkeys(
            [settings.OPENROUTER_CHAT_MODEL, *settings.OPENROUTER_FALLBACK_MODELS]
        ))
        for model in or_models:
            try:
                resp = await client.chat.completions.create(
                    model=model,
                    max_tokens=max_tokens,
                    temperature=0.78,
                    messages=[{"role": "user", "content": prompt}],
                )
                text = (resp.choices[0].message.content or "").strip()
                if text:
                    logger.info(f"[narrator] ✓ OpenRouter/{model}")
                    return text
            except Exception as e:
                err = str(e)
                if "404" in err:
                    continue
                if "429" in err:
                    await asyncio.sleep(15)
                logger.warning(f"[narrator] OpenRouter/{model}: {e}")

    # ── 3. Gemini fallback ────────────────────────────────────────────────────
    if settings.GEMINI_API_KEY:
        client = AsyncOpenAI(
            api_key=settings.GEMINI_API_KEY,
            base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
        )
        for gmodel in ["gemini-1.5-flash-8b", settings.GEMINI_CHAT_MODEL]:
            try:
                resp = await client.chat.completions.create(
                    model=gmodel,
                    max_tokens=max_tokens,
                    temperature=0.78,
                    messages=[{"role": "user", "content": prompt}],
                )
                text = (resp.choices[0].message.content or "").strip()
                if text:
                    logger.info(f"[narrator] ✓ Gemini/{gmodel}")
                    return text
            except Exception as e:
                logger.warning(f"[narrator] Gemini/{gmodel}: {e}")

    # ── 4. Anthropic last resort ──────────────────────────────────────────────
    if settings.ANTHROPIC_API_KEY:
        import anthropic as _ant
        try:
            ac = _ant.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
            resp = await ac.messages.create(
                model=settings.ANTHROPIC_MODEL,
                max_tokens=max_tokens,
                messages=[{"role": "user", "content": prompt}],
            )
            text = resp.content[0].text.strip()   # type: ignore[union-attr]
            if text:
                logger.info("[narrator] ✓ Anthropic")
                return text
        except Exception as e:
            logger.warning(f"[narrator] Anthropic: {e}")

    return ""


# ── Batch narration prompt ────────────────────────────────────────────────────

def _build_batch_prompt(scenes: List[Dict[str, Any]], language: str) -> str:
    """
    Build a prompt that makes the LLM UNDERSTAND and NARRATE —
    NOT recite or paraphrase the screenplay.
    """
    scene_blocks: List[str] = []
    for s in scenes:
        content = (s.get("content") or "").strip()
        heading = s.get("heading", "").strip()
        location = s.get("location", "").strip()
        int_ext = (s.get("int_ext") or "").strip()
        time_of_day = (s.get("time_of_day") or "").strip()
        chars = s.get("characters") or []
        char_str = ", ".join(chars[:6]) if chars else "no specific characters named"
        emotions = (s.get("detected_emotions") or [])[:3]
        emotion_str = ", ".join(emotions) if emotions else ""

        block = (
            f"=== SCENE {s['scene_number']} ===\n"
            f"Location: {int_ext} {location}" + (f" | Time: {time_of_day}" if time_of_day else "") + "\n"
            f"Scene heading: {heading}\n"
            f"Characters present: {char_str}\n"
            + (f"Detected mood/emotions: {emotion_str}\n" if emotion_str else "")
            + f"Raw screenplay content:\n{content[:600] if content else '[no content provided]'}"
        )
        scene_blocks.append(block)

    scenes_text = "\n\n".join(scene_blocks)

    return f"""You are a legendary film narrator — your voice is the one audiences hear in trailers, documentaries, and prestige cinema. You narrate with authority, poetry, and cinematic precision.

Your task: Read the raw screenplay content for each scene below. UNDERSTAND what is actually happening — the events, the emotions, the subtext. Then write a 4-sentence CINEMATIC VOICEOVER for each scene.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL RULES — VIOLATING THESE = FAILURE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. DO NOT copy, quote, or directly rephrase the screenplay text. The audience has NOT read it.
2. UNDERSTAND what happens, then write as a narrator who WITNESSED the scene.
3. NEVER say: "the scene shows", "we see", "the screenplay", "the script", "in this scene".
4. You MUST write the final narration in FLUENT {language.upper()}.
5. Each narration must be EXACTLY 4 sentences:
   - Sentence 1: Set the atmosphere (place, time, light, sound — be specific and sensory)
   - Sentence 2: What is at stake — who is here and what are they doing/feeling
   - Sentence 3: The emotional core or dramatic tension — what hangs in the air
   - Sentence 4: A closing line that carries the story forward, leaves the audience wanting more
6. Use the language of cinema: shadows, silence, weight, breath, dust, echoes.
7. Never be generic. Every sentence must feel specific to THIS scene.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT — STRICT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Return ONLY a valid JSON array. No markdown. No explanation. No code fences.
Each element must be: {{"scene_number": <integer>, "narration": "<4-sentence string>"}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCENES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{scenes_text}"""


# ── Parse LLM response ────────────────────────────────────────────────────────

def _parse_narration_json(raw: str, expected_count: int) -> Dict[int, str]:
    """Extract JSON array from LLM response, handling markdown fences and extra text."""
    raw = raw.strip()

    # Strip markdown fences
    raw = re.sub(r"^```[a-z]*\n?", "", raw)
    raw = re.sub(r"\n?```$", "", raw).strip()

    # Find the JSON array even if there's preamble text
    json_match = re.search(r"\[\s*\{.*\}\s*\]", raw, re.DOTALL)
    if json_match:
        raw = json_match.group(0)

    try:
        items: List[Dict[str, Any]] = json.loads(raw)
        result: Dict[int, str] = {}
        for item in items:
            num = item.get("scene_number")
            narr = (item.get("narration") or "").strip()
            if num is not None and narr:
                result[int(num)] = narr
        logger.info(f"[narrator] Parsed {len(result)}/{expected_count} narrations from JSON")
        return result
    except (json.JSONDecodeError, TypeError, ValueError) as e:
        logger.warning(f"[narrator] JSON parse failed: {e} — raw snippet: {raw[:200]}")
        return {}


# ── Main batch narration ──────────────────────────────────────────────────────

async def _batch_narrate(scenes: List[Dict[str, Any]], language: str) -> Dict[int, str]:
    prompt = _build_batch_prompt(scenes, language)
    # ~120 tokens per 4-sentence narration + JSON overhead
    max_tokens = min(130 * len(scenes) + 400, 8000)

    logger.info(
        f"[narrator] Batch call: {len(scenes)} scenes, "
        f"prompt={len(prompt)} chars, max_tokens={max_tokens}"
    )

    raw = await _call_llm(prompt, max_tokens=max_tokens)
    if not raw:
        logger.error("[narrator] All LLMs failed — returning empty narrations")
        return {}

    result = _parse_narration_json(raw, len(scenes))

    if not result:
        # Last-ditch: sometimes Groq wraps in extra text, try harder
        # Try to find any JSON-like structures
        chunks = re.findall(
            r'\{\s*"scene_number"\s*:\s*(\d+)\s*,\s*"narration"\s*:\s*"((?:[^"\\]|\\.)*)"\s*\}',
            raw,
            re.DOTALL
        )
        if chunks:
            result = {int(num): narr.replace("\\n", " ").strip() for num, narr in chunks}
            logger.info(f"[narrator] Regex fallback extracted {len(result)} narrations")

    return result


# ── Per-scene fallback (if batch completely fails) ────────────────────────────

async def _narrate_one_scene(scene: Dict[str, Any], language: str) -> str:
    """Fallback: generate narration for a single scene."""
    content = (scene.get("content") or "")[:500]
    prompt = (
        f"You are a cinematic film narrator. Read this screenplay scene and write a 4-sentence "
        f"voiceover narration. DO NOT copy the text — understand what happens and narrate it "
        f"cinematically. Narrate in fluent {language.upper()}.\n\n"
        f"Scene {scene['scene_number']} — {scene.get('heading', '')}\n"
        f"Location: {scene.get('int_ext','')} {scene.get('location','')}\n"
        f"Characters: {', '.join((scene.get('characters') or [])[:5]) or 'unknown'}\n"
        f"Content:\n{content}\n\n"
        "Return ONLY the 4-sentence narration, nothing else."
    )
    text = await _call_llm(prompt, max_tokens=200)
    return text or f"Scene {scene['scene_number']} unfolds at {scene.get('location', 'an unknown location')}."


# ── Route ─────────────────────────────────────────────────────────────────────

@router.post(
    "/projects/{project_id}/narrator/generate",
    response_model=List[SceneNarration],
)
async def generate_narrations(
    request: Request,
    project_id: UUID,
    body: NarrationRequest = NarrationRequest(),
) -> List[SceneNarration]:
    """
    Generate cinematic voiceover narrations for all (or specified) scenes.
    Uses Groq for fast, high-quality free-tier narration.
    All scenes in 1 batch LLM call. Results cached per project.
    """
    token = extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    pid = str(project_id)
    db = SupabaseClient()

    # Fetch scenes
    query = (
        db.table("scenes")
        .select("scene_number,heading,location,int_ext,time_of_day,characters,content,detected_emotions")
        .eq("project_id", pid)
        .order("scene_number")
    )
    if body.scene_numbers:
        query = query.in_("scene_number", body.scene_numbers)

    result = query.execute()
    scenes: List[Dict[str, Any]] = result.data or []
    if not scenes:
        raise HTTPException(status_code=404, detail="No scenes found for this project.")

    # Cache check
    cache_key = f"{pid}_{body.language}"
    cache = _narration_cache.setdefault(cache_key, {})
    if body.force_refresh:
        for s in scenes:
            cache.pop(s["scene_number"], None)

    missing = [s for s in scenes if s["scene_number"] not in cache]

    if missing:
        logger.info(f"[narrator] Generating narrations for {len(missing)} scenes in {body.language} (Groq batch)")

        # Batch all scenes in 1 LLM call
        batch_result = await _batch_narrate(missing, body.language)
        cache.update(batch_result)

        # Per-scene fallback for anything the batch missed
        still_missing = [s for s in missing if s["scene_number"] not in cache]
        if still_missing:
            logger.warning(f"[narrator] Per-scene fallback for {len(still_missing)} scenes")
            for i, scene in enumerate(still_missing):
                narr = await _narrate_one_scene(scene, body.language)
                cache[scene["scene_number"]] = narr
                if i < len(still_missing) - 1:
                    await asyncio.sleep(1)

        logger.info(f"[narrator] ✅ {len(scenes)} scenes narrated for project {pid}")

    return [
        SceneNarration(
            scene_number=s["scene_number"],
            narration=cache.get(s["scene_number"], ""),
        )
        for s in scenes
    ]
