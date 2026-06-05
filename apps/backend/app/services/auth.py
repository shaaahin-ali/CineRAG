"""
Auth service — Supabase JWT verification and project access checks.
"""

import logging
from uuid import UUID

from fastapi import HTTPException, status

from app.core.security import verify_token
from app.services.storage import SupabaseClient

logger = logging.getLogger(__name__)


def verify_jwt(token: str) -> dict:
    """Verify Supabase JWT and return payload."""
    return verify_token(token)


async def verify_project_access(project_id: UUID, user_id: str) -> bool:
    """
    Check if a user has access to a project (owner or member).
    Returns True if access granted, raises HTTPException otherwise.
    """
    db = SupabaseClient()

    # Check ownership
    owner_result = db.table("projects").select("id").eq(
        "id", str(project_id)
    ).eq("owner_id", user_id).execute()

    if owner_result.data:
        return True

    # Check membership
    member_result = db.table("project_members").select("id").eq(
        "project_id", str(project_id)
    ).eq("user_id", user_id).execute()

    if member_result.data:
        return True

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You do not have access to this project",
    )


async def get_user_role(project_id: UUID, user_id: str) -> str:
    """Get the user's role in a project (returns 'producer' if owner)."""
    db = SupabaseClient()

    owner_result = db.table("projects").select("owner_id").eq(
        "id", str(project_id)
    ).single().execute()

    if owner_result.data and owner_result.data["owner_id"] == user_id:
        return "producer"

    member_result = db.table("project_members").select("role").eq(
        "project_id", str(project_id)
    ).eq("user_id", user_id).single().execute()

    if member_result.data:
        return member_result.data["role"]

    return "viewer"
