"""
Video Generation API — scene video preview (demo mode).

Routes:
  POST /api/v1/projects/{id}/video/generate    Trigger / re-trigger generation (+ optional extra_prompt)
  GET  /api/v1/projects/{id}/video/jobs        Poll job statuses for frontend
  POST /api/v1/projects/{id}/video/retry/{n}   Retry a single failed scene
"""

from __future__ import annotations

import asyncio
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
    Trigger demo video generation for up to 5 top scenes.
    Accepts an optional global `extra_prompt` for creative style overrides.
    Runs asynchronously — poll /video/jobs to track progress.
    """
    _require_auth(request)
    pid = str(project_id)
    scenes = _get_scenes(pid)

    if not scenes:
        raise HTTPException(status_code=404, detail="No scenes found. Upload a screenplay first.")

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
        f"{len(top)} scenes, extra_prompt={bool(body.extra_prompt)}"
    )

    return {
        "status": "queued",
        "message": f"Video generation started for {len(top)} scenes (demo mode).",
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
    Retry a single failed video job by scene number.
    Re-uses the existing extra_prompt stored on the job.
    """
    _require_auth(request)
    pid = str(project_id)
    db = SupabaseClient()

    # Fetch the existing job to get its extra_prompt
    job_result = (
        db.table("scene_video_jobs")
        .select("extra_prompt")
        .eq("project_id", pid)
        .eq("scene_number", scene_number)
        .execute()
    )
    extra_prompt = ""
    if job_result.data:
        extra_prompt = job_result.data[0].get("extra_prompt") or ""

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

    asyncio.create_task(
        generate_videos_for_project(
            project_id=pid,
            scenes=[scene],
            extra_prompt=extra_prompt,
        )
    )

    return {"status": "queued", "message": f"Scene {scene_number} video retry queued."}
