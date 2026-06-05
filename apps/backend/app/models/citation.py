"""Pydantic models for Citation."""

from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel


class Citation(BaseModel):
    """A screenplay citation returned with each RAG response."""

    scene_number: int
    page_start: int
    page_end: int
    heading: str
    location: str
    characters: List[str]
    excerpt: str  # Short relevant excerpt from the scene
    relevance_score: Optional[float] = None

    # Malayalam-specific
    detected_emotions: Optional[List[str]] = None
    cultural_context: Optional[str] = None
