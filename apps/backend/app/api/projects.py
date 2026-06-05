"""
Projects API — CRUD for screenplay projects + team management.

Routes:
  POST   /api/v1/projects                          Create project
  GET    /api/v1/projects                          List user's projects
  GET    /api/v1/projects/{id}                     Get project details
  DELETE /api/v1/projects/{id}                     Delete project
  GET    /api/v1/projects/{id}/status              Get ingestion status
  POST   /api/v1/projects/{id}/invite              Invite crew member
  GET    /api/v1/projects/{id}/members             List project members
  DELETE /api/v1/projects/{id}/members/{user_id}   Remove member
"""

import logging
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.security import extract_token, get_current_user_id
from app.models.project import (
    CrewRole,
    InviteMemberRequest,
    ProjectCreate,
    ProjectMemberOut,
    ProjectOut,
    ProjectStatus,
    ProjectStatusOut,
)
from app.services.auth import verify_project_access
from app.services.storage import SupabaseClient

logger = logging.getLogger(__name__)
router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

# ── Helpers ────────────────────────────────────────────────────────────────────

def get_user_id(request: Request) -> str:
    token = extract_token(request)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    return get_current_user_id(token)


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/projects", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
async def create_project(
    request: Request,
    body: ProjectCreate,
) -> ProjectOut:
    """Create a new screenplay project."""
    user_id = get_user_id(request)
    db = SupabaseClient()

    result = db.table("projects").insert({
        "title": body.title,
        "description": body.description,
        "owner_id": user_id,
        "status": ProjectStatus.uploading,
    }).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create project")

    logger.info(f"Project created: {result.data[0]['id']} by user {user_id}")
    return ProjectOut(**result.data[0])


@router.get("/projects", response_model=List[ProjectOut])
async def list_projects(request: Request) -> List[ProjectOut]:
    """List all projects accessible to the current user."""
    user_id = get_user_id(request)
    db = SupabaseClient()

    # RLS handles filtering — only projects user owns or is member of
    result = db.table("projects").select("*").order("created_at", desc=True).execute()
    return [ProjectOut(**p) for p in (result.data or [])]


@router.get("/projects/{project_id}", response_model=ProjectOut)
async def get_project(request: Request, project_id: UUID) -> ProjectOut:
    """Get a single project by ID."""
    user_id = get_user_id(request)
    db = SupabaseClient()

    result = db.table("projects").select("*").eq("id", str(project_id)).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Project not found")
    return ProjectOut(**result.data)


@router.delete("/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(request: Request, project_id: UUID) -> None:
    """Delete a project (owner only). Also removes Pinecone vectors."""
    user_id = get_user_id(request)
    db = SupabaseClient()

    # Verify ownership
    result = db.table("projects").select("owner_id").eq("id", str(project_id)).single().execute()
    if not result.data or result.data["owner_id"] != user_id:
        raise HTTPException(status_code=403, detail="Only the project owner can delete it")

    db.table("projects").delete().eq("id", str(project_id)).execute()
    logger.info(f"Project {project_id} deleted by {user_id}")


@router.get("/projects/{project_id}/status", response_model=ProjectStatusOut)
async def get_project_status(request: Request, project_id: UUID) -> ProjectStatusOut:
    """Poll ingestion status."""
    user_id = get_user_id(request)
    db = SupabaseClient()

    result = db.table("projects").select(
        "id,status,scene_count,page_count"
    ).eq("id", str(project_id)).single().execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Project not found")

    d = result.data
    messages = {
        "uploading": "Uploading screenplay...",
        "indexing": "Parsing and indexing scenes into Pinecone...",
        "ready": "Ready — start querying!",
        "error": "An error occurred during ingestion.",
    }

    return ProjectStatusOut(
        project_id=d["id"],
        status=d["status"],
        progress_message=messages.get(d["status"], ""),
        scene_count=d.get("scene_count"),
        page_count=d.get("page_count"),
    )


# ── Team Management ────────────────────────────────────────────────────────────

@router.post("/projects/{project_id}/invite", status_code=status.HTTP_201_CREATED)
async def invite_member(
    request: Request,
    project_id: UUID,
    body: InviteMemberRequest,
) -> dict:
    """Invite a crew member by email and assign a role."""
    user_id = get_user_id(request)
    db = SupabaseClient()

    # Must be project owner to invite
    proj = db.table("projects").select("owner_id").eq("id", str(project_id)).single().execute()
    if not proj.data or proj.data["owner_id"] != user_id:
        raise HTTPException(status_code=403, detail="Only the owner can invite members")

    # Look up user by email via Supabase auth (service role required)
    user_result = db.auth.admin.list_users()
    target_user = next(
        (u for u in user_result if u.email == body.email), None
    )
    if not target_user:
        raise HTTPException(status_code=404, detail=f"No user found with email {body.email}")

    db.table("project_members").upsert({
        "project_id": str(project_id),
        "user_id": str(target_user.id),
        "role": body.role.value,
    }).execute()

    return {"message": f"{body.email} invited as {body.role.value}"}


@router.get("/projects/{project_id}/members", response_model=List[ProjectMemberOut])
async def list_members(request: Request, project_id: UUID) -> List[ProjectMemberOut]:
    """List all members of a project."""
    user_id = get_user_id(request)
    db = SupabaseClient()

    result = db.table("project_members").select("*").eq("project_id", str(project_id)).execute()
    return [ProjectMemberOut(**m) for m in (result.data or [])]


@router.delete("/projects/{project_id}/members/{member_user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_member(
    request: Request,
    project_id: UUID,
    member_user_id: UUID,
) -> None:
    """Remove a crew member from a project."""
    user_id = get_user_id(request)
    db = SupabaseClient()

    proj = db.table("projects").select("owner_id").eq("id", str(project_id)).single().execute()
    if not proj.data or proj.data["owner_id"] != user_id:
        raise HTTPException(status_code=403, detail="Only the owner can remove members")

    db.table("project_members").delete().eq(
        "project_id", str(project_id)
    ).eq("user_id", str(member_user_id)).execute()
