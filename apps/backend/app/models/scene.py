"""Pydantic models for Scene."""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class IntExt(str, Enum):
    INT = "INT"
    EXT = "EXT"
    INT_EXT = "INT/EXT"


class SceneOut(BaseModel):
    id: UUID
    project_id: UUID
    scene_number: int
    page_start: int
    page_end: int
    heading: str
    location: str
    time_of_day: Optional[str] = None
    int_ext: Optional[IntExt] = None
    characters: List[str] = []
    content: str
    estimated_duration_seconds: Optional[int] = None

    # Malayalam-specific fields
    detected_emotions: Optional[List[str]] = None
    cultural_context: Optional[str] = None

    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CharacterOut(BaseModel):
    name: str
    scene_count: int
    scenes: List[int]  # scene numbers
