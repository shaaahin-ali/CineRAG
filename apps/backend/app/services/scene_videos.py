"""
Scene Video Generation — Veo 3.1 Fast (Vertex AI), Mollywood style.

Pipeline per scene:
  1. Pre-flight DB cache check — skip if a completed Veo video already exists.
  2. Complexity check — if scene has heavy dialogue / long content, run a free
     Groq LLM call to distill it into a single vivid 8-second visual peak moment.
  3. Build a Mollywood-specific cinematic prompt from scene metadata + summary.
  4. Call Vertex AI Veo 3.1 Fast via the official google-genai SDK.
  5. Poll until the operation completes (typically 60-180s).
  6. Upload raw MP4 to Supabase Storage → scene-videos/{project_id}/{scene}.mp4
  7. Update scene_video_jobs → status: completed, scene_summary stored.

Model: publishers/google/models/veo-3.1-fast-generate-001
Auth:  GOOGLE_APPLICATION_CREDENTIALS → gcp-key.json (service account)
Cap:   MAX_SCENES = 4 per project (hard budget guardrail)
Clip:  8 seconds, 16:9, 4K cinematic Mollywood aesthetic
"""

from __future__ import annotations

import asyncio
import hashlib
import json
import logging
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

# ── Constants ─────────────────────────────────────────────────────────────────

MAX_SCENES = 4           # Hard cap: exactly 4 Veo videos per project
VEO_MODEL = "publishers/google/models/veo-3.1-fast-generate-001"
VEO_DURATION_SEC = 8     # Veo supports [4, 6, 8] — use max for full scene coverage
VEO_ASPECT_RATIO = "16:9"

# ── Helpers ───────────────────────────────────────────────────────────────────

def _scene_hash(scene: Dict[str, Any]) -> str:
    raw = json.dumps(
        {"content": scene.get("content", ""), "heading": scene.get("heading", "")},
        sort_keys=True,
    )
    return hashlib.sha256(raw.encode()).hexdigest()


def select_top_scenes(scenes: List[Dict[str, Any]], n: int = MAX_SCENES) -> List[Dict[str, Any]]:
    """Select the first N scenes in screenplay order (1, 2, 3, 4…)."""
    ordered = sorted(scenes, key=lambda s: s.get("scene_number", 0))
    return ordered[:n]


# ── Mollywood visual vocabulary ───────────────────────────────────────────────
# Maps detected mood to Kerala-specific cinematic environment + lens language.

_MOLLYWOOD_MOOD_VISUALS: Dict[str, tuple] = {
    "romance": (
        "Kerala backwaters at golden hour, shikara boat gliding on still water, "
        "coconut palms reflected in the canal, soft warm light through banana leaves",
        "shallow depth of field, bokeh of water ripples, slow tracking shot, "
        "warm amber colour grade, Priyadarshan-era soft focus",
    ),
    "sadness": (
        "Kerala monsoon rain on terracotta rooftops, old tharavad ancestral home, "
        "rain-drenched nalukettu courtyard, melancholic dusk light",
        "wide-angle locked shot, cool blue-grey grade, rain streaks on lens, "
        "Lal Jose dramatic stillness",
    ),
    "suspense": (
        "dense rubber plantation at night, single lantern casting long shadows, "
        "mist rising from paddy fields, silhouetted figure on a narrow mud path",
        "tight 50mm shot, low-key chiaroscuro lighting, handheld slight shake, "
        "Jeethu Joseph tension framing",
    ),
    "action": (
        "Thrissur city streets at rush hour, vibrant market chaos, "
        "temple festival ground with dense crowds, fast kinetic energy",
        "dynamic tracking shot, desaturated punchy grade, "
        "whip-pan camera motion, Amal Neerad urban grit aesthetic",
    ),
    "joy": (
        "Onam celebration in a traditional Kerala home, pookalam floral carpet, "
        "golden sunlight through carved wooden windows, children in kasavu",
        "wide establishing shot, saturated warm palette, slow-motion petals falling, "
        "Rosshan Andrrews festive bright cinematography",
    ),
    "anger": (
        "stormy Arabian Sea coast near Kozhikode, crashing waves on black rocks, "
        "dark thunderclouds gathering, lone figure facing the storm",
        "extreme wide low-angle, high contrast tones, dramatic sky, "
        "Shyamaprasad raw intensity",
    ),
    "fear": (
        "abandoned colonial-era bungalow in Munnar hills, thick night fog, "
        "overgrown banyan roots, flickering antique oil lamp",
        "extreme close-up on eyes, deep shadows, Lijo Jose Pellissery surreal framing, "
        "cold desaturated grade",
    ),
    "dramatic": (
        "Padmanabhaswamy temple gopuram at dawn, golden light on granite pillars, "
        "devotees in white against epic architecture",
        "wide-angle tilt-up reveal shot, warm golden-hour grade, "
        "Santosh Sivan masterful cinematography",
    ),
    "default": (
        "Kerala village at blue hour, paddy fields stretching to the horizon, "
        "toddy palms silhouetted, a lone bullock cart on the bund road",
        "cinematic dolly shot, rich green-to-amber colour palette, "
        "M. J. Radhakrishnan poetic composition",
    ),
}


# ── Scene complexity detection ────────────────────────────────────────────────

def _is_complex_scene(scene: Dict[str, Any]) -> bool:
    """
    Returns True when a scene is too complex for a naive raw-content prompt:
    - Content is longer than 500 chars (multi-beat scenes)
    - OR contains 3+ dialogue blocks (CHARACTER NAME followed by dialogue)
    Veo clips are 8 seconds — complex scenes need distillation to avoid
    rendering a truncated mid-dialogue freeze-frame.
    """
    content = (scene.get("content") or "")
    if len(content) > 500:
        return True
    # Rough dialogue count: uppercase word-only lines are character cues in screenplays
    import re
    dialogue_cues = re.findall(r"^[A-Z][A-Z ]{2,}$", content, re.MULTILINE)
    return len(dialogue_cues) >= 3


async def _summarize_scene_for_video(scene: Dict[str, Any]) -> str:
    """
    Distill a complex screenplay scene into ONE vivid, dialogue-free,
    8-second cinematic visual moment for Veo.

    Uses Groq llama-3.3-70b-versatile as primary (free, best quality),
    falls back through the same cascade as the narrator.

    Returns a 60-100 word visual description ready to embed in a Veo prompt.
    """
    from app.core.config import settings
    from openai import AsyncOpenAI
    import asyncio as _asyncio

    content = (scene.get("content") or "")[:1200]  # generous window for analysis
    heading = (scene.get("heading") or "").strip()
    location = (scene.get("location") or "").strip()
    characters = scene.get("characters") or []
    char_str = ", ".join(characters[:4]) if characters else "unnamed characters"
    emotions = scene.get("detected_emotions") or []
    mood = emotions[0] if emotions else "dramatic"

    prompt = f"""You are a master cinematographer and visual storyteller. Your job is to distil a screenplay scene into ONE single 8-second visual moment for an AI video generator.

READ the scene carefully. UNDERSTAND what is emotionally happening — who wants what, what conflict or feeling is at its peak.

Then write a SINGLE cinematic shot description (60-100 words, NO dialogue, NO text, pure visual action) that:
- Shows the PEAK emotional moment of the scene through body language, environment, and expression
- Is visually specific: describe light, movement, facial expression, physical action
- Is written in present tense as a camera direction
- Avoids any words that sound like dialogue or narration
- Works as a standalone 8-second clip that CLEARLY communicates what is happening in the scene

Scene:
  Heading: {heading}
  Location: {location}
  Mood: {mood}
  Characters: {char_str}
  Content:
{content}

Output ONLY the shot description. Nothing else. No preamble, no explanation."""

    text = ""

    # Primary: Groq llama-3.3-70b-versatile (best free quality)
    if settings.GROQ_API_KEY:
        try:
            client = AsyncOpenAI(
                api_key=settings.GROQ_API_KEY,
                base_url="https://api.groq.com/openai/v1",
            )
            resp = await client.chat.completions.create(
                model=settings.GROQ_QUALITY_MODEL,
                max_tokens=200,
                temperature=0.65,
                messages=[{"role": "user", "content": prompt}],
            )
            text = (resp.choices[0].message.content or "").strip()
            if text:
                logger.info(f"[scene_summary] Groq summary: {len(text)} chars")
                return text
        except Exception as e:
            logger.warning(f"[scene_summary] Groq failed: {e}")

    # Fallback: Anthropic claude (best creative writing model)
    if settings.ANTHROPIC_API_KEY:
        try:
            import anthropic as _ant
            ac = _ant.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
            resp = await ac.messages.create(
                model=settings.ANTHROPIC_MODEL,
                max_tokens=200,
                messages=[{"role": "user", "content": prompt}],
            )
            text = resp.content[0].text.strip()  # type: ignore[union-attr]
            if text:
                logger.info(f"[scene_summary] Anthropic summary: {len(text)} chars")
                return text
        except Exception as e:
            logger.warning(f"[scene_summary] Anthropic failed: {e}")

    # Last resort: Gemini
    if settings.GEMINI_API_KEY:
        try:
            client = AsyncOpenAI(
                api_key=settings.GEMINI_API_KEY,
                base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
            )
            resp = await client.chat.completions.create(
                model="gemini-2.0-flash",
                max_tokens=200,
                temperature=0.65,
                messages=[{"role": "user", "content": prompt}],
            )
            text = (resp.choices[0].message.content or "").strip()
            if text:
                logger.info(f"[scene_summary] Gemini summary: {len(text)} chars")
                return text
        except Exception as e:
            logger.warning(f"[scene_summary] Gemini failed: {e}")

    # No summary available — caller will use raw content
    return ""


def _build_veo_prompt(scene: Dict[str, Any], extra_prompt: str, scene_summary: str = "") -> str:
    """
    Build a scene-faithful Veo prompt.
    If a pre-computed scene_summary is provided (from _summarize_scene_for_video),
    it takes precedence over raw content — this prevents dialogue cut-offs and
    ensures the 8-second clip shows the emotional peak of the scene.
    """
    emotions = scene.get("detected_emotions", [])
    mood = emotions[0].lower() if emotions else "default"
    characters = scene.get("characters", [])
    location_raw = (scene.get("location") or "").strip()
    heading = (scene.get("heading") or "").strip()

    # Get mood-specific visuals
    env_hint, lens_hint = _MOLLYWOOD_MOOD_VISUALS.get(mood, _MOLLYWOOD_MOOD_VISUALS["default"])

    parts = []

    # 1. Scene heading & environment anchor (from mood vocabulary)
    if heading or location_raw:
        loc_str = heading if heading else location_raw
        parts.append(f"Scene: {loc_str}.")
    parts.append(f"Environment: {env_hint}.")

    # 2. Characters
    if characters:
        char_names = ", ".join(characters[:3])
        parts.append(f"Characters: {char_names} in traditional South Indian cinematic attire.")

    # 3. Core action — prefer AI summary over raw content
    if scene_summary:
        # AI-distilled peak moment — dialogue-free, visually specific
        parts.append(f"Core Visual Action: {scene_summary}")
        parts.append(
            "Render this single decisive moment with expressive acting, "
            "precise body language, and emotional authenticity. "
            "No dialogue, no text on screen — pure cinematic action."
        )
    else:
        # Fallback: raw content (short/simple scenes)
        content = (scene.get("content") or "")[:350].replace("\n", " ").strip()
        if content:
            parts.append(f"Core Action: {content}")
            parts.append(
                "Show the characters visually acting out this action with "
                "expressive body language and authentic emotion."
            )

    # 4. Mood-appropriate camera work
    parts.append(f"Mood: {mood}. Camera: {lens_hint}.")

    # 5. Technical requirements
    parts.append(
        "Cinematic Indian film style, photorealistic, 4K, "
        "no text overlay, no subtitles, no watermark, 16:9."
    )

    # 6. User override
    if extra_prompt:
        parts.append(extra_prompt.strip())

    return " ".join(parts)


# ── Veo 3.1 Fast via google-genai SDK (Vertex AI) ────────────────────────────

async def _generate_veo_video(
    scene: Dict[str, Any],
    extra_prompt: str = "",
    summary: str = "",
) -> Optional[bytes]:
    """
    Call Vertex AI Veo 3.1 Fast.
    Returns raw MP4 bytes on success, raises on quota exhaustion.
    """
    from app.core.config import settings
    import os

    project = settings.GOOGLE_CLOUD_PROJECT
    region = settings.GOOGLE_CLOUD_REGION
    creds_path = settings.GOOGLE_APPLICATION_CREDENTIALS

    if not project or not creds_path:
        logger.error("[veo] GOOGLE_CLOUD_PROJECT or GOOGLE_APPLICATION_CREDENTIALS not set")
        raise RuntimeError("Veo credentials not configured")

    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = creds_path

    try:
        from google import genai
        from google.genai import types as genai_types
    except ImportError:
        raise RuntimeError("google-genai SDK not installed. Run: pip install google-genai")

    client = genai.Client(vertexai=True, project=project, location=region)

    prompt_text = _build_veo_prompt(scene, extra_prompt, scene_summary=summary)
    scene_number = scene.get("scene_number", 0)
    logger.info(f"[veo] Scene {scene_number}: submitting to Veo 3.1 Fast")
    logger.info(f"[veo] Prompt ({len(prompt_text)} chars): {prompt_text[:200]}…")

    operation = await asyncio.get_event_loop().run_in_executor(
        None,
        lambda: client.models.generate_videos(
            model=VEO_MODEL,
            prompt=prompt_text,
            config=genai_types.GenerateVideosConfig(
                aspect_ratio=VEO_ASPECT_RATIO,
                duration_seconds=VEO_DURATION_SEC,
                number_of_videos=1,
            ),
        ),
    )

    logger.info(f"[veo] Scene {scene_number}: operation submitted, polling…")
    max_wait_sec = 300   # 5-minute max wait
    poll_interval = 10
    elapsed = 0

    while not operation.done and elapsed < max_wait_sec:
        await asyncio.sleep(poll_interval)
        elapsed += poll_interval
        operation = await asyncio.get_event_loop().run_in_executor(
            None,
            lambda: client.operations.get(operation),
        )
        logger.info(f"[veo] Scene {scene_number}: {elapsed}s elapsed…")

    if not operation.done:
        raise TimeoutError(f"Veo operation timed out after {max_wait_sec}s")

    result = operation.result
    if result and result.generated_videos:
        video_bytes = result.generated_videos[0].video.video_bytes
        logger.info(f"[veo] ✅ Scene {scene_number}: {len(video_bytes):,} bytes received")
        return video_bytes

    raise RuntimeError(f"Veo returned empty result for scene {scene_number}")


# ── Per-scene generation ──────────────────────────────────────────────────────

async def generate_video_for_scene(
    project_id: str,
    scene: Dict[str, Any],
    job_id: str,
    extra_prompt: str = "",
    use_veo: bool = True,  # Always True now — Ken Burns removed
    scene_summary: str = "",
) -> None:
    """
    Generate a Veo video for a single scene and upload to Supabase.
    If Veo fails, the job is marked failed (no silent fallback).
    """
    from app.services.storage import SupabaseClient
    db = SupabaseClient()

    scene_number = scene.get("scene_number", 0)

    def _update_job(status: str, **kwargs: Any) -> None:
        data: Dict[str, Any] = {"status": status}
        data.update(kwargs)
        try:
            db.table("scene_video_jobs").update(data).eq("id", job_id).execute()
        except Exception as e:
            logger.warning(f"[video] Job update failed: {e}")

    prompt_data: Dict[str, Any] = {
        "scene_id": f"scene_{scene_number:03d}",
        "mood": (scene.get("detected_emotions") or ["default"])[0],
        "location": scene.get("location", ""),
        "characters": scene.get("characters", []),
        "method": "veo_3.1_fast",
        "visual_style": "Veo 3.1 Fast AI video — Mollywood cinematic",
        "scene_summary": scene_summary or None,
    }

    try:
        _update_job("generating")
        logger.info(f"[video] Scene {scene_number}: starting Veo generation")

        # ── Smart scene summarization ──────────────────────────────────────────
        # If no pre-computed summary AND scene is complex (long/dialogue-heavy),
        # distill it into a single visual peak moment to prevent dialogue cut-offs.
        active_summary = scene_summary
        if not active_summary and _is_complex_scene(scene):
            logger.info(f"[video] Scene {scene_number}: complex scene — running summarizer")
            active_summary = await _summarize_scene_for_video(scene)
            if active_summary:
                logger.info(f"[video] Scene {scene_number}: summary ready — '{active_summary[:80]}…'")
                prompt_data["scene_summary"] = active_summary
                # Update job with the summary so the frontend can display it
                try:
                    from app.services.storage import SupabaseClient as _SC
                    _SC().table("scene_video_jobs").update(
                        {"prompt_json": json.dumps(prompt_data)}
                    ).eq("id", job_id).execute()
                except Exception:
                    pass  # non-fatal

        mp4_bytes = await _generate_veo_video(scene, extra_prompt, summary=active_summary)

        if not mp4_bytes:
            _update_job("failed", error_message="Veo returned empty bytes")
            return

        logger.info(f"[video] Scene {scene_number}: {len(mp4_bytes):,} bytes, uploading…")

        # ── Upload to Supabase Storage ─────────────────────────────────────────
        storage_path = f"{project_id}/{scene_number}.mp4"
        try:
            db.storage.from_("scene-videos").upload(
                path=storage_path,
                file=mp4_bytes,
                file_options={"content-type": "video/mp4", "upsert": "true"},
            )
        except Exception:
            # Try update if upload fails (file already exists)
            try:
                db.storage.from_("scene-videos").update(
                    path=storage_path,
                    file=mp4_bytes,
                    file_options={"content-type": "video/mp4"},
                )
            except Exception as e2:
                _update_job("failed", error_message=f"Storage upload failed: {e2}")
                return

        output_url = db.storage.from_("scene-videos").get_public_url(storage_path)

        _update_job(
            "completed",
            output_url=output_url,
            prompt_json=json.dumps(prompt_data),
            error_message=None,
        )
        logger.info(f"[video] ✅ Scene {scene_number} complete → {output_url}")

    except Exception as e:
        logger.error(f"[video] Scene {scene_number} FAILED: {e}", exc_info=True)
        _update_job("failed", error_message=str(e)[:500])


# ── Project-level orchestrator ────────────────────────────────────────────────

async def generate_videos_for_project(
    project_id: str,
    scenes: List[Dict[str, Any]],
    extra_prompt: str = "",
) -> None:
    """
    Generate Veo 3.1 Fast videos for the top MAX_SCENES scenes.

    DB-first: if a scene already has a completed Veo video in the database,
    it is skipped — no API call, no cost.
    If Veo fails for a scene, that scene is marked 'failed'. No fallback.
    """
    from app.core.config import settings
    from app.services.storage import SupabaseClient
    db = SupabaseClient()

    veo_cap = getattr(settings, "VEO_MAX_SCENES", MAX_SCENES)
    top_scenes = select_top_scenes(scenes, veo_cap)

    logger.info(
        f"[video] Project {project_id}: generating Veo videos for "
        f"{len(top_scenes)} scenes (cap={veo_cap})"
    )

    for idx, scene in enumerate(top_scenes):
        scene_number = scene.get("scene_number", 0)
        scene_hash = _scene_hash(scene)

        # ── DB cache check: skip only if this scene already has a Veo video ───
        try:
            cached = (
                db.table("scene_video_jobs")
                .select("id, prompt_json")
                .eq("project_id", project_id)
                .eq("scene_hash", scene_hash)
                .eq("status", "completed")
                .execute()
            )
            if cached.data:
                pj = cached.data[0].get("prompt_json") or {}
                if isinstance(pj, str):
                    try:
                        pj = json.loads(pj)
                    except Exception:
                        pj = {}
                if pj.get("method") == "veo_3.1_fast":
                    logger.info(f"[video] Scene {scene_number}: Veo video in DB — skipping ✅")
                    continue
                logger.info(f"[video] Scene {scene_number}: old job found (method={pj.get('method')}) — regenerating with Veo")
        except Exception:
            pass

        logger.info(f"[video] Scene {scene_number}: Veo slot {idx + 1}/{veo_cap}")

        # ── Upsert job row ─────────────────────────────────────────────────────
        try:
            prompt_data = {
                "scene_id": f"scene_{scene_number:03d}",
                "mood": (scene.get("detected_emotions") or ["default"])[0],
                "location": scene.get("location", ""),
                "characters": scene.get("characters", []),
                "method": "veo_3.1_fast",
            }

            existing = (
                db.table("scene_video_jobs")
                .select("id")
                .eq("project_id", project_id)
                .eq("scene_number", scene_number)
                .execute()
            )

            if existing.data:
                job_id = existing.data[0]["id"]
                db.table("scene_video_jobs").update({
                    "status": "queued",
                    "scene_hash": scene_hash,
                    "prompt_json": json.dumps(prompt_data),
                    "extra_prompt": extra_prompt,
                    "output_url": None,
                    "error_message": None,
                }).eq("id", job_id).execute()
            else:
                result = db.table("scene_video_jobs").insert({
                    "project_id": project_id,
                    "scene_number": scene_number,
                    "scene_hash": scene_hash,
                    "status": "queued",
                    "prompt_json": json.dumps(prompt_data),
                    "extra_prompt": extra_prompt,
                }).execute()
                job_id = result.data[0]["id"]

        except Exception as e:
            logger.error(f"[video] Failed to create/update job for scene {scene_number}: {e}")
            continue

        await generate_video_for_scene(
            project_id, scene, job_id, extra_prompt, use_veo=True
        )

        # Small pause between scenes so the event loop stays responsive
        await asyncio.sleep(2.0)

    logger.info(f"[video] ✅ All {len(top_scenes)} Veo jobs complete for project {project_id}")
