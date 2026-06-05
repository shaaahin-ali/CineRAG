"""Pydantic models for Query (request/response)."""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.citation import Citation


class QueryRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=2000)
    language: Optional[str] = Field(
        None,
        description="'ml' for Malayalam, 'en' for English. Auto-detected if not provided.",
    )
    user_role: Optional[str] = Field(
        None,
        description="Crew role for role-specific context (actor, director, cinematographer, etc.)",
    )


class TranslateRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000)
    source_lang: str = Field("ml", description="Source language code")
    target_lang: str = Field("en", description="Target language code")


class QueryOut(BaseModel):
    id: UUID
    project_id: UUID
    user_id: UUID
    query_text: str
    response_text: Optional[str] = None
    citations: Optional[List[Citation]] = None
    detected_language: Optional[str] = None
    latency_ms: Optional[int] = None
    tokens_used: Optional[int] = None
    bookmarked: bool = False
    created_at: datetime

    class Config:
        from_attributes = True


class BookmarkResponse(BaseModel):
    query_id: UUID
    bookmarked: bool
