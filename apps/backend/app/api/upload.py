"""
Upload API — handles screenplay file upload and triggers ingestion pipeline.

Routes:
  POST /api/v1/projects/{id}/upload          Upload PDF/DOCX/TXT screenplay
  GET  /api/v1/projects/{id}/upload/progress SSE stream of ingestion progress
"""

import asyncio
import hashlib
import json
import logging
import os
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, File, HTTPException, Request, UploadFile, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.core.config import settings
from app.core.security import extract_token, get_current_user_id
from app.models.project import ProjectStatus
from app.services.ingestion import run_ingestion_pipeline
from app.services.storage import SupabaseClient

logger = logging.getLogger(__name__)
router = APIRouter()

ALLOWED_MIME_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
}
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt"}

# In-memory progress queues: project_id → asyncio.Queue of SSE event strings
# (lightweight; cleared when the SSE connection closes)
_progress_queues: dict[str, asyncio.Queue] = {}


class UploadResponse(BaseModel):
    project_id: UUID
    file_url: str
    status: str
    message: str


def _sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


@router.post(
    "/projects/{project_id}/upload",
    response_model=UploadResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def upload_screenplay(
    request: Request,
    project_id: UUID,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
) -> UploadResponse:
    """
    Upload a screenplay file (PDF, DOCX, TXT).
    The ingestion pipeline runs in the background:
    Parse → Chunk → Embed → Pinecone upsert → Supabase scenes insert

    If the same file content was previously processed for this project (same SHA-256),
    the cached result is returned immediately without re-processing.
    """
    token = extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user_id = get_current_user_id(token)

    # ── Validate file ──────────────────────────────────────────────────────────
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File type not allowed. Accepted: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    content = await file.read()
    if len(content) > settings.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Max size: {settings.MAX_FILE_SIZE // 1_048_576}MB",
        )

    # ── Content hash deduplication ─────────────────────────────────────────────
    file_hash = _sha256(content)
    db = SupabaseClient()

    try:
        cached = (
            db.table("projects")
            .select("id, status")
            .eq("id", str(project_id))
            .eq("file_hash", file_hash)
            .execute()
        )
        if cached.data and cached.data[0].get("status") == ProjectStatus.ready.value:
            file_url = db.storage.from_("screenplays").get_public_url(
                f"{project_id}/{file.filename}"
            )
            logger.info(f"[Upload] Cache hit for project {project_id} (hash {file_hash[:8]}…)")
            return UploadResponse(
                project_id=project_id,
                file_url=file_url,
                status="ready",
                message="Screenplay already indexed — loaded from cache.",
            )
    except Exception:
        pass  # Cache check failure is non-fatal; proceed with full ingestion

    # ── Upload to Supabase Storage ─────────────────────────────────────────────
    storage_path = f"{project_id}/{file.filename}"

    try:
        db.storage.from_("screenplays").upload(
            path=storage_path,
            file=content,
            file_options={"content-type": file.content_type or "application/octet-stream"},
        )
        file_url = db.storage.from_("screenplays").get_public_url(storage_path)
    except Exception as e:
        logger.error(f"Storage upload failed: {e}")
        raise HTTPException(status_code=500, detail="File upload failed")

    # ── Update project status → indexing (store hash for future cache hits) ───
    try:
        db.table("projects").update({
            "status": ProjectStatus.indexing.value,
            "file_hash": file_hash,
        }).eq("id", str(project_id)).execute()
    except Exception as e:
        logger.warning(f"Failed to update project status: {e}")

    # ── Set up SSE progress queue for this project ─────────────────────────────
    queue: asyncio.Queue = asyncio.Queue()
    _progress_queues[str(project_id)] = queue

    async def _progress_callback(step: str, detail: str) -> None:
        """Push a progress event into the SSE queue."""
        event = json.dumps({"step": step, "detail": detail})
        await queue.put(event)
        if step in ("ready", "error"):
            await queue.put(None)  # Sentinel: signal SSE stream to close

    # ── Kick off background ingestion ─────────────────────────────────────────
    background_tasks.add_task(
        run_ingestion_pipeline,
        project_id=str(project_id),
        file_content=content,
        file_name=file.filename or "screenplay",
        file_ext=ext,
        progress_callback=_progress_callback,
    )

    logger.info(f"Upload accepted for project {project_id}, ingestion queued")
    return UploadResponse(
        project_id=project_id,
        file_url=file_url,
        status="indexing",
        message="Screenplay uploaded. Ingestion pipeline started in background.",
    )


@router.get("/projects/{project_id}/upload/progress")
async def upload_progress(
    request: Request,
    project_id: UUID,
    token: str | None = None,  # query param fallback for EventSource (can't set headers)
) -> StreamingResponse:
    """
    SSE endpoint — streams live ingestion progress for a project.
    Connect immediately after calling POST /upload and listen for events.

    Event format (JSON):
        { "step": "parsing", "detail": "Identifying scenes" }

    Terminal steps: "ready" | "error"

    Auth: pass via Authorization header OR ?token=<jwt> query param
    (EventSource in browsers can't set custom headers).
    """
    # Accept token from query param OR Authorization header
    auth_token = token or extract_token(request)
    if not auth_token:
        raise HTTPException(status_code=401, detail="Not authenticated")


    pid = str(project_id)
    # Re-use existing queue or create a new one (handles reconnects)
    if pid not in _progress_queues:
        _progress_queues[pid] = asyncio.Queue()

    queue = _progress_queues[pid]

    async def _event_generator():
        try:
            while True:
                # Abort if client disconnects
                if await request.is_disconnected():
                    break
                try:
                    event = await asyncio.wait_for(queue.get(), timeout=30.0)
                except asyncio.TimeoutError:
                    # Send a keepalive comment so the connection stays alive
                    yield ": keepalive\n\n"
                    continue

                if event is None:
                    # Pipeline finished — close the stream
                    yield "event: done\ndata: {}\n\n"
                    break

                yield f"data: {event}\n\n"
        finally:
            _progress_queues.pop(pid, None)

    return StreamingResponse(
        _event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        },
    )
