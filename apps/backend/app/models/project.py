"""Pydantic models for Project and ProjectMember."""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class ProjectStatus(str, Enum):
    uploading = "uploading"
    indexing = "indexing"
    ready = "ready"
    error = "error"


class CrewRole(str, Enum):
    producer = "producer"
    director = "director"
    actor = "actor"
    cinematographer = "cinematographer"
    editor = "editor"
    music = "music"
    viewer = "viewer"


# ── Request Models ─────────────────────────────────────────────────────────────

class ProjectCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)


class InviteMemberRequest(BaseModel):
    email: str
    role: CrewRole


# ── Response Models ────────────────────────────────────────────────────────────

class ProjectMemberOut(BaseModel):
    id: UUID
    user_id: UUID
    role: CrewRole
    invited_at: datetime

    class Config:
        from_attributes = True


class ProjectOut(BaseModel):
    id: UUID
    title: str
    description: Optional[str] = None
    owner_id: UUID
    status: ProjectStatus
    file_url: Optional[str] = None
    page_count: Optional[int] = None
    scene_count: Optional[int] = None
    character_count: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProjectStatusOut(BaseModel):
    project_id: UUID
    status: ProjectStatus
    progress_message: Optional[str] = None
    scene_count: Optional[int] = None
    page_count: Optional[int] = None
