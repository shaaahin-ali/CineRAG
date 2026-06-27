"""
Scene Video Generation — Ken Burns Effect (free, no GPU, no API).

Pipeline per scene:
  1. Fetch the scene's storyboard image URL from scene_images table
  2. Download the image bytes (Supabase CDN — resolves fine from India)
  3. Apply Ken Burns animation (smooth zoom-in + directional pan, 24fps, 4 sec)
  4. Encode as MP4 via imageio-ffmpeg (H.264, browser-compatible)
  5. Upload to Supabase Storage → scene-videos/{project_id}/{scene}.mp4
  6. Update scene_video_jobs → status: completed

Ken Burns effect: slow cinematic zoom (1.0x → 1.12x) + gentle pan in a
direction derived from scene mood (e.g. sad = pan right→left, action = pan
left→right).  100% local CPU, ~1–3 seconds per clip.  Zero cost.
"""

from __future__ import annotations

import asyncio
import hashlib
import io
import json
import logging
import math
import random
from typing import Any, Dict, List, Optional, Tuple

import httpx

logger = logging.getLogger(__name__)

# ── Output spec ───────────────────────────────────────────────────────────────

OUTPUT_W = 576
OUTPUT_H = 320
FPS = 24
DURATION_SEC = 4
N_FRAMES = FPS * DURATION_SEC          # 96
ZOOM_START = 1.0
ZOOM_END = 1.12

# ── Mood → pan direction (start_x, start_y) → (end_x, end_y) ────────────────
# Values are fractions of the excess canvas after zoom.
# (0,0) = top-left anchor, (1,1) = bottom-right anchor.

_MOOD_PAN: Dict[str, Tuple[float, float, float, float]] = {
    "suspense":  (0.5, 0.5, 0.3, 0.3),   # centre → upper-left (closing in)
    "romance":   (0.2, 0.8, 0.8, 0.2),   # lower-left → upper-right (sweeping)
    "action":    (0.0, 0.5, 1.0, 0.5),   # left → right (fast sweep)
    "sadness":   (1.0, 0.5, 0.0, 0.5),   # right → left (retreating)
    "joy":       (0.5, 1.0, 0.5, 0.0),   # bottom → top (rising)
    "anger":     (0.0, 0.0, 1.0, 1.0),   # top-left → bottom-right (aggressive)
    "fear":      (0.5, 0.0, 0.5, 1.0),   # top → bottom (descending)
    "default":   (0.2, 0.3, 0.8, 0.7),   # gentle diagonal
}

MAX_SCENES = 5

# ── Helpers ───────────────────────────────────────────────────────────────────

def _scene_hash(scene: Dict[str, Any]) -> str:
    raw = json.dumps(
        {"content": scene.get("content", ""), "heading": scene.get("heading", "")},
        sort_keys=True,
    )
    return hashlib.sha256(raw.encode()).hexdigest()


def _mood_pan(scene: Dict[str, Any]) -> Tuple[float, float, float, float]:
    emotions = scene.get("detected_emotions", [])
    for e in emotions:
        key = e.lower()
        if key in _MOOD_PAN:
            return _MOOD_PAN[key]
    return _MOOD_PAN["default"]


def select_top_scenes(scenes: List[Dict[str, Any]], n: int = MAX_SCENES) -> List[Dict[str, Any]]:
    def score(s: Dict[str, Any]) -> float:
        sc = 0.0
        if s.get("detected_emotions"):
            sc += 2.0
        sc += min(len(s.get("characters", [])), 3) * 1.0
        sc += min(len(s.get("content", "")), 2000) / 2000.0
        return sc
    return sorted(scenes, key=score, reverse=True)[:n]


# ── Ken Burns rendering (pure CPU, Pillow + imageio) ─────────────────────────

def _apply_ken_burns(
    image_bytes: bytes,
    pan: Tuple[float, float, float, float],
    scene_number: int = 0,
    extra_prompt: str = "",
) -> bytes:
    """
    Render a Ken Burns MP4 from image_bytes.
    Returns raw MP4 bytes.
    """
    from PIL import Image, ImageDraw, ImageFont
    import imageio
    import numpy as np

    # Load + convert to RGB
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    # Scale so shortest side is >= output size × max_zoom
    min_dim = max(OUTPUT_W, OUTPUT_H) * (ZOOM_END + 0.05)
    scale = max(min_dim / img.width, min_dim / img.height)
    src_w = int(img.width * scale)
    src_h = int(img.height * scale)
    img = img.resize((src_w, src_h), Image.LANCZOS)

    ax0, ay0, ax1, ay1 = pan   # anchor fractions start → end

    frames = []
    for i in range(N_FRAMES):
        t = i / (N_FRAMES - 1)                          # 0.0 → 1.0
        # Ease in-out cubic
        t_ease = t * t * (3 - 2 * t)

        zoom = ZOOM_START + (ZOOM_END - ZOOM_START) * t_ease
        crop_w = int(OUTPUT_W / zoom)
        crop_h = int(OUTPUT_H / zoom)

        # Max offsets for panning within zoomed canvas
        max_x = src_w - crop_w
        max_y = src_h - crop_h

        ax = ax0 + (ax1 - ax0) * t_ease
        ay = ay0 + (ay1 - ay0) * t_ease
        x0 = int(ax * max_x)
        y0 = int(ay * max_y)
        x0 = max(0, min(x0, max_x))
        y0 = max(0, min(y0, max_y))

        cropped = img.crop((x0, y0, x0 + crop_w, y0 + crop_h))
        frame = cropped.resize((OUTPUT_W, OUTPUT_H), Image.LANCZOS)

        # Subtle vignette overlay
        arr = np.array(frame, dtype=np.float32)
        # Vignette mask
        cx, cy = OUTPUT_W / 2, OUTPUT_H / 2
        ys, xs = np.ogrid[:OUTPUT_H, :OUTPUT_W]
        dist = np.sqrt(((xs - cx) / cx) ** 2 + ((ys - cy) / cy) ** 2)
        vignette = np.clip(1 - 0.45 * (dist ** 2), 0.55, 1.0)[..., np.newaxis]
        arr = np.clip(arr * vignette, 0, 255).astype(np.uint8)

        # Fade in first 8 frames, fade out last 8 frames
        if i < 8:
            alpha = i / 8.0
            arr = (arr * alpha).astype(np.uint8)
        elif i > N_FRAMES - 9:
            alpha = (N_FRAMES - 1 - i) / 8.0
            arr = (arr * alpha).astype(np.uint8)

        frames.append(arr)

    # Encode to MP4 in memory
    buf = io.BytesIO()
    writer = imageio.get_writer(
        buf,
        format="mp4",
        fps=FPS,
        codec="libx264",
        output_params=["-pix_fmt", "yuv420p", "-preset", "ultrafast", "-crf", "28"],
    )
    for f in frames:
        writer.append_data(f)
    writer.close()
    return buf.getvalue()


# ── Fetch the storyboard image for a scene ───────────────────────────────────

async def _fetch_storyboard_image(
    project_id: str,
    scene_number: int,
    client: httpx.AsyncClient,
) -> Optional[bytes]:
    """Fetch the existing storyboard image from Supabase scene_images table."""
    from app.services.storage import SupabaseClient
    db = SupabaseClient()

    try:
        result = (
            db.table("scene_images")
            .select("image_url")
            .eq("project_id", project_id)
            .eq("scene_number", scene_number)
            .limit(1)
            .execute()
        )
        if result.data:
            url = result.data[0]["image_url"]
            resp = await client.get(url, timeout=httpx.Timeout(30), follow_redirects=True)
            if resp.status_code == 200:
                return resp.content
    except Exception as e:
        logger.warning(f"[video] Could not fetch storyboard image for scene {scene_number}: {e}")
    return None


async def _generate_placeholder_image(
    scene: Dict[str, Any],
    client: httpx.AsyncClient,
) -> Optional[bytes]:
    """
    Generate a fresh Pollinations image as fallback if no storyboard exists.
    Re-uses the same service the storyboard pipeline uses.
    """
    from app.core.config import settings
    scene_number = scene.get("scene_number", 0)
    location = scene.get("location") or "cinematic scene"
    emotions = scene.get("detected_emotions", [])
    mood = emotions[0] if emotions else "dramatic"
    prompt = f"cinematic film still, {location}, {mood} mood, professional cinematography, 16:9"

    token = settings.POLLINATIONS_TOKEN
    base = "https://image.pollinations.ai/prompt"
    encoded = prompt.replace(" ", "%20").replace(",", "%2C")
    url = f"{base}/{encoded}?width=576&height=320&seed={scene_number}&nologo=true"
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    try:
        resp = await client.get(url, headers=headers, timeout=httpx.Timeout(45), follow_redirects=True)
        if resp.status_code == 200:
            return resp.content
    except Exception as e:
        logger.warning(f"[video] Pollinations fallback failed for scene {scene_number}: {e}")
    return None


# ── Per-scene generation ──────────────────────────────────────────────────────

async def generate_video_for_scene(
    project_id: str,
    scene: Dict[str, Any],
    job_id: str,
    extra_prompt: str = "",
) -> None:
    """Apply Ken Burns effect to the scene's storyboard image and save as MP4."""
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

    try:
        _update_job("generating")
        logger.info(f"[video] Ken Burns rendering scene {scene_number}")

        emotions = scene.get("detected_emotions", [])
        mood = emotions[0] if emotions else "default"
        pan = _mood_pan(scene)

        prompt_data = {
            "scene_id": f"scene_{scene_number:03d}",
            "mood": mood,
            "location": scene.get("location", ""),
            "characters": scene.get("characters", []),
            "visual_style": "Ken Burns cinematic animation",
            "method": "ken_burns_local",
        }

        async with httpx.AsyncClient() as client:
            # 1. Try to get existing storyboard image
            image_bytes = await _fetch_storyboard_image(project_id, scene_number, client)

            # 2. Fallback: generate fresh from Pollinations
            if not image_bytes:
                logger.info(f"[video] No storyboard for scene {scene_number}, generating via Pollinations")
                image_bytes = await _generate_placeholder_image(scene, client)

            if not image_bytes:
                _update_job("failed", error_message="Could not obtain source image")
                return

            # 3. Render Ken Burns MP4 (blocking CPU task — run in executor)
            loop = asyncio.get_event_loop()
            mp4_bytes = await loop.run_in_executor(
                None,
                _apply_ken_burns,
                image_bytes,
                pan,
                scene_number,
                extra_prompt,
            )

        if not mp4_bytes:
            _update_job("failed", error_message="MP4 encoding produced empty output")
            return

        logger.info(f"[video] Scene {scene_number} MP4: {len(mp4_bytes):,} bytes")

        # 4. Upload to Supabase Storage
        storage_path = f"{project_id}/{scene_number}.mp4"
        try:
            db.storage.from_("scene-videos").upload(
                path=storage_path,
                file=mp4_bytes,
                file_options={"content-type": "video/mp4", "upsert": "true"},
            )
        except Exception:
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
        logger.info(f"[video] ✅ Scene {scene_number} Ken Burns complete → {output_url}")

    except Exception as e:
        logger.error(f"[video] Scene {scene_number} failed: {e}", exc_info=True)
        _update_job("failed", error_message=str(e)[:500])


# ── Project-level orchestrator ────────────────────────────────────────────────

async def generate_videos_for_project(
    project_id: str,
    scenes: List[Dict[str, Any]],
    extra_prompt: str = "",
) -> None:
    """Select top 5 scenes, render Ken Burns videos, store in Supabase."""
    from app.services.storage import SupabaseClient
    db = SupabaseClient()
    top_scenes = select_top_scenes(scenes, MAX_SCENES)
    logger.info(
        f"[video] Starting Ken Burns generation for {len(top_scenes)} scenes "
        f"in project {project_id}"
    )

    for scene in top_scenes:
        scene_number = scene.get("scene_number", 0)
        scene_hash = _scene_hash(scene)

        # Check cache — skip if already completed with same hash
        try:
            cached = (
                db.table("scene_video_jobs")
                .select("id, status")
                .eq("project_id", project_id)
                .eq("scene_hash", scene_hash)
                .eq("status", "completed")
                .execute()
            )
            if cached.data:
                logger.info(f"[video] Scene {scene_number} cache hit — skipping")
                continue
        except Exception:
            pass

        # Upsert job row
        try:
            emotions = scene.get("detected_emotions", [])
            mood = emotions[0] if emotions else "default"
            prompt_data = {
                "scene_id": f"scene_{scene_number:03d}",
                "mood": mood,
                "location": scene.get("location", ""),
                "characters": scene.get("characters", []),
                "visual_style": "Ken Burns cinematic animation",
                "method": "ken_burns_local",
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

        await generate_video_for_scene(project_id, scene, job_id, extra_prompt)
        # Small pause between scenes so uvicorn stays responsive
        await asyncio.sleep(0.5)

    logger.info(f"[video] ✅ All video jobs complete for project {project_id}")
