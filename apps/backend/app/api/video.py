"""
Video Generation API — Veo 3.1 Fast + Ken Burns fallback.

Routes:
  POST /api/v1/projects/{id}/video/generate    Trigger generation (button-press only)
  GET  /api/v1/projects/{id}/video/jobs        Poll / load job statuses from DB
  POST /api/v1/projects/{id}/video/retry/{n}   Retry a single failed scene (Ken Burns only)
"""

from __future__ import annotations

import asyncio
import hashlib
import json
import logging
from typing import Any, Dict, List
from uuid import UUID

from fastapi import APIRouter, HTTPException, Request, status
from pydantic import BaseModel

from app.core.security import extract_token
from app.services.scene_videos import generate_videos_for_project, select_top_scenes
from app.services.storage import SupabaseClient

logger = logging.getLogger(__name__)
router = APIRouter()


def _scene_hash_from_scene(scene: Dict[str, Any]) -> str:
    """Compute the same scene_hash as scene_videos._scene_hash."""
    raw = json.dumps(
        {"content": scene.get("content", ""), "heading": scene.get("heading", "")},
        sort_keys=True,
    )
    return hashlib.sha256(raw.encode()).hexdigest()



# ── Request / Response models ────────────────────────────────────────────────

class GenerateVideoRequest(BaseModel):
    extra_prompt: str = ""


class VideoJobOut(BaseModel):
    id: str
    scene_number: int
    status: str
    output_url: str | None
    error_message: str | None
    prompt_json: Dict[str, Any] | None
    extra_prompt: str | None
    scene_summary: str | None  # AI-distilled visual moment description (for theater overlay)
    created_at: str | None
    updated_at: str | None


# ── Helper ───────────────────────────────────────────────────────────────────

def _require_auth(request: Request) -> None:
    token = extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")


def _get_scenes(project_id: str) -> List[Dict[str, Any]]:
    db = SupabaseClient()
    result = (
        db.table("scenes")
        .select("scene_number,heading,location,content,characters,detected_emotions")
        .eq("project_id", project_id)
        .order("scene_number")
        .execute()
    )
    return result.data or []


# ── Routes ───────────────────────────────────────────────────────────────────

@router.post(
    "/projects/{project_id}/video/generate",
    status_code=status.HTTP_202_ACCEPTED,
)
async def trigger_video_generation(
    request: Request,
    project_id: UUID,
    body: GenerateVideoRequest = GenerateVideoRequest(),
) -> Dict[str, Any]:
    """
    Trigger Veo 3.1 Fast video generation for up to 4 top scenes.
    - If all 4 videos are already completed in DB, returns status='already_complete'
      without making any API calls (pure DB read).
    - Otherwise queues only the missing videos (partial resume).
    - Runs asynchronously — poll /video/jobs to track progress.
    """
    _require_auth(request)
    pid = str(project_id)
    db = SupabaseClient()

    scenes = _get_scenes(pid)
    if not scenes:
        raise HTTPException(status_code=404, detail="No scenes found. Upload a screenplay first.")

    # ── DB-first check: skip generation if all Veo videos already exist ────────────
    try:
        existing = (
            db.table("scene_video_jobs")
            .select("id, status, prompt_json")
            .eq("project_id", pid)
            .eq("status", "completed")
            .execute()
        )
        all_completed = existing.data or []
        from app.core.config import settings as _s
        # Only count completed Veo jobs (not old Ken Burns jobs)
        veo_done = []
        for row in all_completed:
            pj = row.get("prompt_json") or {}
            if isinstance(pj, str):
                try:
                    import json as _json
                    pj = _json.loads(pj)
                except Exception:
                    pj = {}
            if pj.get("method") == "veo_3.1_fast":
                veo_done.append(row)
        if len(veo_done) >= _s.VEO_MAX_SCENES and not body.extra_prompt:
            logger.info(f"[video] Project {pid}: all {_s.VEO_MAX_SCENES} Veo videos in DB — serving from database.")
            return {
                "status": "already_complete",
                "message": f"All {_s.VEO_MAX_SCENES} Veo videos already generated. Loading from database.",
                "scene_count": len(veo_done),
                "extra_prompt": None,
            }
    except Exception:
        pass  # If DB check fails, proceed with generation

    top = select_top_scenes(scenes)

    # Fire-and-forget background task
    asyncio.create_task(
        generate_videos_for_project(
            project_id=pid,
            scenes=scenes,
            extra_prompt=body.extra_prompt,
        )
    )

    logger.info(
        f"[video] Generation triggered for project {pid} — "
        f"{len(top)} scenes queued, extra_prompt={bool(body.extra_prompt)}"
    )

    return {
        "status": "queued",
        "message": f"Generating Veo 3.1 Fast videos for up to {len(top)} scenes. Poll /video/jobs for progress.",
        "scene_count": len(top),
        "extra_prompt": body.extra_prompt or None,
    }


@router.get(
    "/projects/{project_id}/video/jobs",
    response_model=List[VideoJobOut],
)
async def list_video_jobs(
    request: Request,
    project_id: UUID,
) -> List[VideoJobOut]:
    """
    Return current status of all video generation jobs for this project.
    Poll every 5 seconds while any job is queued or generating.
    """
    _require_auth(request)
    db = SupabaseClient()

    result = (
        db.table("scene_video_jobs")
        .select("*")
        .eq("project_id", str(project_id))
        .order("scene_number")
        .execute()
    )

    jobs = result.data or []

    def _parse_prompt(raw) -> dict | None:
        if raw is None:
            return None
        if isinstance(raw, dict):
            return raw
        try:
            import json as _json
            return _json.loads(raw)
        except Exception:
            return None

    return [
        VideoJobOut(
            id=j["id"],
            scene_number=j["scene_number"],
            status=j["status"],
            output_url=j.get("output_url"),
            error_message=j.get("error_message"),
            prompt_json=_parse_prompt(j.get("prompt_json")),
            extra_prompt=j.get("extra_prompt"),
            scene_summary=(
                (_parse_prompt(j.get("prompt_json")) or {}).get("scene_summary")
            ),
            created_at=str(j.get("created_at") or ""),
            updated_at=str(j.get("updated_at") or ""),
        )
        for j in jobs
    ]


@router.post(
    "/projects/{project_id}/video/retry/{scene_number}",
    status_code=status.HTTP_202_ACCEPTED,
)
async def retry_video_job(
    request: Request,
    project_id: UUID,
    scene_number: int,
) -> Dict[str, Any]:
    """
    Retry a single failed video job by scene number using Veo 3.1 Fast.
    Skips immediately if the scene already has a completed Veo video.
    """
    _require_auth(request)
    pid = str(project_id)
    db = SupabaseClient()

    # Fetch the existing job
    job_result = (
        db.table("scene_video_jobs")
        .select("extra_prompt, status, prompt_json")
        .eq("project_id", pid)
        .eq("scene_number", scene_number)
        .execute()
    )

    if job_result.data:
        job_row = job_result.data[0]
        if job_row.get("status") == "completed":
            pj = job_row.get("prompt_json") or {}
            if isinstance(pj, str):
                try:
                    pj = json.loads(pj)
                except Exception:
                    pj = {}
            if pj.get("method") == "veo_3.1_fast":
                return {"status": "already_complete", "message": f"Scene {scene_number} already has a Veo video."}
        extra_prompt = job_row.get("extra_prompt") or ""
    else:
        extra_prompt = ""

    # Fetch the specific scene
    scene_result = (
        db.table("scenes")
        .select("scene_number,heading,location,content,characters,detected_emotions")
        .eq("project_id", pid)
        .eq("scene_number", scene_number)
        .execute()
    )
    if not scene_result.data:
        raise HTTPException(status_code=404, detail=f"Scene {scene_number} not found")

    scene = scene_result.data[0]
    scene_hash = _scene_hash_from_scene(scene)

    # Fetch or create the job row
    job_q = (
        db.table("scene_video_jobs")
        .select("id")
        .eq("project_id", pid)
        .eq("scene_number", scene_number)
        .execute()
    )
    if job_q.data:
        job_id = job_q.data[0]["id"]
        db.table("scene_video_jobs").update({
            "status": "queued",
            "scene_hash": scene_hash,
            "output_url": None,
            "error_message": None,
        }).eq("id", job_id).execute()
    else:
        ins = db.table("scene_video_jobs").insert({
            "project_id": pid,
            "scene_number": scene_number,
            "scene_hash": scene_hash,
            "status": "queued",
            "extra_prompt": extra_prompt,
        }).execute()
        job_id = ins.data[0]["id"]

    # Re-run with Veo
    from app.services.scene_videos import generate_video_for_scene
    asyncio.create_task(
        generate_video_for_scene(
            project_id=pid,
            scene=scene,
            job_id=job_id,
            extra_prompt=extra_prompt,
            use_veo=True,
        )
    )

    return {"status": "queued", "message": f"Scene {scene_number} retrying with Veo 3.1 Fast."}
