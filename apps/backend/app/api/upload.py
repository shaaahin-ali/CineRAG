"""
Upload API — handles screenplay file upload and triggers ingestion pipeline.

Routes:
  POST /api/v1/projects/{id}/upload   Upload PDF/DOCX/TXT screenplay
"""

import logging
import os
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, File, HTTPException, Request, UploadFile, status
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


class UploadResponse(BaseModel):
    project_id: UUID
    file_url: str
    status: str
    message: str


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

    # ── Upload to Supabase Storage ─────────────────────────────────────────────
    db = SupabaseClient()
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

    # ── Update project status → indexing ──────────────────────────────────────
    db.table("projects").update({
        "status": ProjectStatus.indexing,
        "file_url": file_url,
    }).eq("id", str(project_id)).execute()

    # ── Kick off background ingestion ─────────────────────────────────────────
    background_tasks.add_task(
        run_ingestion_pipeline,
        project_id=str(project_id),
        file_content=content,
        file_name=file.filename or "screenplay",
        file_ext=ext,
    )

    logger.info(f"Upload accepted for project {project_id}, ingestion queued")
    return UploadResponse(
        project_id=project_id,
        file_url=file_url,
        status="indexing",
        message="Screenplay uploaded. Ingestion pipeline started in background.",
    )
