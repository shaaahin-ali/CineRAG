"""
Scene Image Generation Service — Pollinations.ai (free, no API key required).

Pipeline per scene:
  1. LLM → English cinematic image prompt (Malayalam → English if needed)
     • Optimisation: batch ALL scene prompts in ONE LLM call when possible.
     • Falls back gracefully to per-scene generation if batch parsing fails.
     • Per-scene results are LRU-cached to avoid duplicate API calls on re-upload.
  2. Pollinations.ai /prompt/{encoded} → image bytes (1024×576, flux model)
  3. Supabase Storage → scene-images/{project_id}/{scene_number}.jpg
  4. scene_images table → record URL

Rate limits (Pollinations.ai):
  Anonymous tier  : 1 req / 15s  (watermark added)
  Seed tier (free): 1 req / 5s   (no watermark) — register at auth.pollinations.ai
  We sleep 6s between requests when Seed token available, 16s otherwise.

Capped at MAX_SCENES_TO_GENERATE per project to respect free tier.
"""

from __future__ import annotations

import asyncio
import json
import logging
import re
import urllib.parse
from functools import lru_cache
from typing import Any, Dict, List, Optional

import aiohttp

from app.core.config import settings
from app.services.storage import SupabaseClient

logger = logging.getLogger(__name__)

MAX_SCENES_TO_GENERATE = 30  # Cap for free tier — covers most short/medium films fully
POLLINATIONS_BASE = "https://image.pollinations.ai/prompt"
IMAGE_WIDTH = 1024
IMAGE_HEIGHT = 576  # 16:9 cinematic


# ── Helpers ───────────────────────────────────────────────────────────────────

def _contains_malayalam(text: str) -> bool:
    """Return True if text contains Malayalam Unicode script."""
    return bool(re.search(r"[\u0D00-\u0D7F]", text))


def _sleep_duration() -> float:
    """Return correct inter-request sleep based on Pollinations tier."""
    return 6.0 if settings.POLLINATIONS_TOKEN else 16.0


# ── Step 1: LLM → image prompt ────────────────────────────────────────────────

async def _llm_complete(prompt: str, max_tokens: int = 200) -> str:
    """
    Call LLM cascade for a single completion.

    Cascade order:
      1. OpenRouter primary model (settings.OPENROUTER_CHAT_MODEL)
      2. OpenRouter fallback models (settings.OPENROUTER_FALLBACK_MODELS)
      3. Gemini (direct)
      4. Anthropic (direct)
    """
    from openai import AsyncOpenAI

    if settings.OPENROUTER_API_KEY:
        client = AsyncOpenAI(
            api_key=settings.OPENROUTER_API_KEY,
            base_url="https://openrouter.ai/api/v1",
        )
        # Primary + fallbacks all sourced from config — no hard-coded model names here.
        cascade = [settings.OPENROUTER_CHAT_MODEL, *settings.OPENROUTER_FALLBACK_MODELS]
        for model in cascade:
            try:
                resp = await client.chat.completions.create(
                    model=model,
                    max_tokens=max_tokens,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.3,
                )
                return resp.choices[0].message.content or ""
            except Exception as e:
                logger.warning(f"[scene_images] OpenRouter {model} failed: {e}")
                continue

    if settings.GEMINI_API_KEY:
        client = AsyncOpenAI(
            api_key=settings.GEMINI_API_KEY,
            base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
        )
        try:
            resp = await client.chat.completions.create(
                model=settings.GEMINI_CHAT_MODEL,
                max_tokens=max_tokens,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
            )
            return resp.choices[0].message.content or ""
        except Exception as e:
            logger.warning(f"[scene_images] Gemini failed: {e}")

    if settings.ANTHROPIC_API_KEY:
        import anthropic as _anthropic
        client = _anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
        try:
            resp = await client.messages.create(
                model=settings.ANTHROPIC_MODEL,
                max_tokens=max_tokens,
                messages=[{"role": "user", "content": prompt}],
            )
            return resp.content[0].text  # type: ignore[union-attr]
        except Exception as e:
            logger.warning(f"[scene_images] Anthropic failed: {e}")

    return ""


# ── LRU-cached per-scene fallback ────────────────────────────────────────────
# Key: (scene_text_snippet, scene_number) — keeps up to 100 prompts in memory.
# Prevents duplicate LLM calls when the same screenplay is re-uploaded.

@lru_cache(maxsize=100)
def _cached_fallback_prompt(scene_key: str, scene_number: int, int_ext: str, heading: str, char_str: str) -> str:
    """Build a metadata-only fallback prompt (no LLM). Pure function — safe to cache."""
    return (
        f"{int_ext or 'Interior'} scene, {heading}, "
        f"cinematic movie shot, dramatic lighting, film grain, "
        f"characters: {char_str}"
    )


async def batch_extract_image_prompts(scenes: List[Dict[str, Any]]) -> Dict[int, str]:
    """
    Generate cinematic image prompts for ALL scenes in ONE LLM call.

    Reduces LLM calls from N → 1 (up to 50 scenes per batch).
    Returns a mapping of {scene_number: prompt_string}.
    Returns an empty dict if parsing fails — caller should fall back to per-scene.
    """
    if not scenes:
        return {}

    # Build a compact scene listing for the LLM
    scene_lines: List[str] = []
    for s in scenes[:50]:  # Token-safe cap: ~50 scenes × 300 chars ≈ 15K input tokens
        content_snippet = (s.get("content") or "")[:300]
        scene_lines.append(f"SCENE {s['scene_number']}:\n{content_snippet}")
    batch_text = "\n---\n".join(scene_lines)

    has_malayalam = any(_contains_malayalam(s.get("content") or "") for s in scenes[:50])
    lang_note = (
        "Some scenes are in Malayalam — translate each to English before writing the prompt.\n"
        if has_malayalam else ""
    )

    request = (
        f"{lang_note}"
        "Generate a short cinematic AI image prompt (40-80 words) for EACH scene below.\n"
        "Return ONLY a valid JSON array. Each element must have exactly two keys: "
        '"scene_number" (integer) and "prompt" (string).\n'
        "No markdown, no explanation, no trailing commas — pure JSON only.\n\n"
        f"{batch_text}"
    )

    # Token budget: ~50 tokens per scene for the response
    max_tokens = min(50 * len(scenes[:50]), 4000)

    try:
        raw = await _llm_complete(request, max_tokens=max_tokens)
        raw = raw.strip()

        # Strip markdown code fences if the model wrapped the JSON
        if raw.startswith("```"):
            raw = re.sub(r"^```[a-z]*\n?", "", raw)
            raw = re.sub(r"\n?```$", "", raw)

        prompts_list: List[Dict[str, Any]] = json.loads(raw)
        result = {
            int(p["scene_number"]): str(p["prompt"])
            for p in prompts_list
            if "scene_number" in p and "prompt" in p
        }
        logger.info(
            f"[scene_images] Batch prompt extraction: {len(result)}/{len(scenes[:50])} scenes in 1 LLM call"
        )
        return result
    except (json.JSONDecodeError, KeyError, ValueError, TypeError) as e:
        logger.warning(f"[scene_images] Batch prompt parse failed ({e}), falling back to per-scene")
        return {}


async def extract_image_prompt(scene: Dict[str, Any]) -> str:
    """
    Convert a single screenplay scene dict into a cinematic English image prompt.
    Used as a fallback when batch_extract_image_prompts() fails or is skipped.
    Results are NOT LRU-cached here (the batch path handles caching at the
    orchestrator level). The metadata-only fallback IS cached via _cached_fallback_prompt.
    """
    heading = scene.get("heading", "")
    content = (scene.get("content") or "")[:400]
    characters = scene.get("characters", [])
    time_of_day = scene.get("time_of_day", "")
    int_ext = scene.get("int_ext", "")

    is_malayalam = _contains_malayalam(content)

    lang_instruction = (
        "The content below is in Malayalam. First translate it to English, "
        "then use that translation to write the visual description.\n\n"
        if is_malayalam
        else ""
    )

    char_str = ", ".join(characters[:5]) if characters else "no named characters"

    system_prompt = (
        f"{lang_instruction}"
        f"Convert this screenplay scene into a detailed visual description for AI image generation.\n\n"
        f"Scene heading: {heading}\n"
        f"Setting: {int_ext} | Time: {time_of_day or 'unspecified'}\n"
        f"Characters present: {char_str}\n"
        f"Scene content:\n{content}\n\n"
        f"Write ONE concise paragraph (60-100 words) in English describing:\n"
        f"1. Setting/location (indoor/outdoor, time of day, atmosphere)\n"
        f"2. Character positions and main action\n"
        f"3. Key visual elements (lighting, mood, objects)\n"
        f"4. Suggested camera angle (wide shot, close-up, medium shot)\n\n"
        f"Style: cinematic, photorealistic, film production quality.\n"
        f"Return ONLY the description paragraph — no preamble, no labels."
    )

    try:
        description = await _llm_complete(system_prompt, max_tokens=180)
        description = description.strip()
        if description:
            return description
    except Exception as e:
        logger.warning(
            f"[scene_images] Prompt extraction failed for scene {scene.get('scene_number')}: {e}"
        )

    # Metadata-only fallback (LRU-cached — avoids LLM entirely for repeated content)
    scene_key = content[:80]  # Short fingerprint of scene text
    return _cached_fallback_prompt(scene_key, scene.get("scene_number", 0), int_ext, heading, char_str)


# ── Step 2: Generate image via Pollinations.ai ────────────────────────────────

async def generate_scene_image(
    image_prompt: str,
    scene_number: int,
    session: aiohttp.ClientSession,
) -> Optional[bytes]:
    """
    Fetch a generated image from Pollinations.ai.
    Returns raw image bytes, or None on failure.
    """
    cinematic_prompt = (
        f"cinematic movie scene, {image_prompt}, "
        f"photorealistic, 85mm anamorphic lens, cinematic lighting, "
        f"film grain, high production value, director's cut, 4K quality"
    )

    encoded = urllib.parse.quote(cinematic_prompt, safe="")
    url = f"{POLLINATIONS_BASE}/{encoded}"

    params: Dict[str, str] = {
        "width": str(IMAGE_WIDTH),
        "height": str(IMAGE_HEIGHT),
        "seed": str(scene_number),
        "model": "flux",
        "nologo": "true",   # removes Pollinations watermark logo overlay
        "enhance": "true",  # enables prompt enhancement
    }

    if settings.POLLINATIONS_TOKEN:
        # Seed tier — higher rate limit + cleaner outputs
        params["referrer"] = settings.POLLINATIONS_TOKEN

    try:
        async with session.get(url, params=params, timeout=aiohttp.ClientTimeout(total=60)) as resp:
            if resp.status == 200:
                data = await resp.read()
                logger.info(
                    f"[scene_images] ✅ Scene {scene_number}: {len(data):,} bytes"
                )
                return data
            else:
                logger.warning(
                    f"[scene_images] Pollinations HTTP {resp.status} for scene {scene_number}"
                )
                return None
    except asyncio.TimeoutError:
        logger.warning(f"[scene_images] Timeout on scene {scene_number}")
        return None
    except Exception as e:
        logger.warning(f"[scene_images] Request error on scene {scene_number}: {e}")
        return None


# ── Step 3: Store image in Supabase Storage + record in DB ───────────────────

async def store_scene_image(
    project_id: str,
    scene_number: int,
    image_bytes: bytes,
    image_prompt: str,
) -> Optional[str]:
    """
    Upload image to Supabase Storage bucket 'scene-images'.
    Insert/update record in scene_images table.
    Returns public URL, or None on failure.
    """
    db = SupabaseClient()
    storage_path = f"{project_id}/{scene_number}.jpg"

    try:
        # Upload to Supabase Storage (upsert to handle re-generation)
        db.storage.from_("scene-images").upload(
            path=storage_path,
            file=image_bytes,
            file_options={
                "content-type": "image/jpeg",
                "upsert": "true",
            },
        )
        public_url = db.storage.from_("scene-images").get_public_url(storage_path)

        # Record in scene_images table (upsert on unique constraint)
        db.table("scene_images").upsert(
            {
                "project_id": project_id,
                "scene_number": scene_number,
                "image_url": public_url,
                "image_prompt": image_prompt,
            },
            on_conflict="project_id,scene_number",
        ).execute()

        return public_url

    except Exception as e:
        logger.error(f"[scene_images] Storage/DB error for scene {scene_number}: {e}")
        return None


# ── Orchestrator: one scene ───────────────────────────────────────────────────

async def generate_and_store_image(
    project_id: str,
    scene: Dict[str, Any],
    session: aiohttp.ClientSession,
    pre_generated_prompt: Optional[str] = None,
) -> bool:
    """
    Full pipeline for a single scene: prompt → image → store.

    Args:
        pre_generated_prompt: If provided (from batch extraction), skips the
                              per-scene LLM call entirely.
    Returns True on success.
    """
    scene_number = scene.get("scene_number", 0)
    logger.info(f"[scene_images] Processing scene {scene_number}")

    # Step 1: Use pre-generated batch prompt, or fall back to per-scene LLM call
    prompt = pre_generated_prompt or await extract_image_prompt(scene)
    if not prompt:
        logger.warning(f"[scene_images] Empty prompt for scene {scene_number}, skipping")
        return False

    # Step 2: Pollinations.ai → image bytes
    image_bytes = await generate_scene_image(prompt, scene_number, session)
    if not image_bytes:
        return False

    # Step 3: Store in Supabase
    url = await store_scene_image(project_id, scene_number, image_bytes, prompt)
    return url is not None


# ── Batch orchestrator: called from ingestion pipeline ───────────────────────

async def generate_images_for_project(
    project_id: str,
    scenes: List[Dict[str, Any]],
) -> None:
    """
    Generate images for the first MAX_SCENES_TO_GENERATE scenes of a project.

    Optimisation path:
      1. ONE batch LLM call → prompts for all scenes (30x fewer LLM API calls).
      2. If batch fails or returns partial results, falls back to per-scene LLM.
      3. Respects Pollinations rate limits via sleep between image requests.

    Called as an asyncio background task after ingestion completes.
    """
    # For small films (≤ MAX_SCENES_TO_GENERATE) generate ALL scenes.
    # For larger films, take the first MAX_SCENES_TO_GENERATE scenes.
    scenes_to_process = scenes[:MAX_SCENES_TO_GENERATE]
    total = len(scenes_to_process)
    sleep_secs = _sleep_duration()
    tier = "Seed" if settings.POLLINATIONS_TOKEN else "Anonymous"

    logger.info(
        f"[scene_images] Starting batch generation: "
        f"{total} scenes, {tier} tier ({sleep_secs}s delay), project={project_id}"
    )

    # ── Optimisation: generate ALL prompts in a single LLM call ──────────────
    logger.info("[scene_images] Batch-extracting image prompts (1 LLM call for all scenes)")
    prompt_map: Dict[int, str] = await batch_extract_image_prompts(scenes_to_process)

    if prompt_map:
        logger.info(
            f"[scene_images] Batch prompt success: {len(prompt_map)}/{total} prompts generated"
        )
    else:
        logger.info("[scene_images] Batch prompt failed — will use per-scene LLM fallback")

    # ── Image generation loop (rate-limited) ──────────────────────────────────
    success = 0
    async with aiohttp.ClientSession() as session:
        for i, scene in enumerate(scenes_to_process):
            scene_number = scene.get("scene_number", 0)
            # Use pre-generated prompt if available, else per-scene LLM fallback
            pre_prompt = prompt_map.get(scene_number)

            ok = await generate_and_store_image(
                project_id, scene, session, pre_generated_prompt=pre_prompt
            )
            if ok:
                success += 1

            # Rate-limit sleep between requests (skip after last scene)
            if i < total - 1:
                await asyncio.sleep(sleep_secs)

    logger.info(
        f"[scene_images] ✅ Batch complete: {success}/{total} images generated "
        f"for project={project_id}"
    )


# ── Progress query ────────────────────────────────────────────────────────────

def get_image_progress(project_id: str, total_scenes: int) -> Dict[str, Any]:
    """
    Return generation progress: how many scene_images records exist for this project.
    """
    db = SupabaseClient()
    try:
        result = (
            db.table("scene_images")
            .select("scene_number", count="exact")
            .eq("project_id", project_id)
            .execute()
        )
        generated = result.count or 0
        capped_total = min(total_scenes, MAX_SCENES_TO_GENERATE) if total_scenes > 0 else MAX_SCENES_TO_GENERATE

        if capped_total == 0:
            # Scenes not yet counted — treat as still initializing
            return {"generated": 0, "total": 0, "status": "generating"}

        return {
            "generated": generated,
            "total": capped_total,
            "status": "complete" if generated >= capped_total else "generating",
        }
    except Exception as e:
        logger.warning(f"[scene_images] Progress query failed: {e}")
        return {"generated": 0, "total": 0, "status": "error"}
