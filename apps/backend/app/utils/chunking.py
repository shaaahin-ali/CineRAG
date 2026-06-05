"""
Scene-aware chunker — keeps each scene as one chunk for accurate citations.
Splits oversized scenes to stay within token limits.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List

logger = logging.getLogger(__name__)

# Target chunk size in characters (~750 chars ≈ ~200 tokens)
CHUNK_TARGET_CHARS = 3000
# Overlap between split chunks for context continuity
CHUNK_OVERLAP_CHARS = 200


def chunk_scenes(scenes: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Convert parsed scenes into embedding-ready chunks.
    Strategy:
    - Small scenes (< CHUNK_TARGET_CHARS) → one chunk each
    - Large scenes → split with overlap, each sub-chunk gets the same metadata
    """
    chunks: List[Dict[str, Any]] = []

    for scene in scenes:
        content = scene["content"]

        if len(content) <= CHUNK_TARGET_CHARS:
            # Single-chunk scene
            chunks.append(_make_chunk(scene, content))
        else:
            # Split large scene
            sub_chunks = _split_text(content, CHUNK_TARGET_CHARS, CHUNK_OVERLAP_CHARS)
            for idx, sub_content in enumerate(sub_chunks):
                chunk = _make_chunk(scene, sub_content)
                chunk["chunk_index"] = idx
                chunk["total_chunks"] = len(sub_chunks)
                chunks.append(chunk)

    logger.debug(f"Chunked {len(scenes)} scenes into {len(chunks)} chunks")
    return chunks


def _make_chunk(scene: Dict[str, Any], content: str) -> Dict[str, Any]:
    """Create a chunk dict from a scene and content slice."""
    return {
        "scene_number": scene["scene_number"],
        "page_start": scene["page_start"],
        "page_end": scene["page_end"],
        "heading": scene["heading"],
        "location": scene["location"],
        "time_of_day": scene.get("time_of_day"),
        "int_ext": scene.get("int_ext"),
        "characters": scene.get("characters", []),
        "content": content,
        "detected_emotions": scene.get("detected_emotions", []),
        "chunk_index": 0,
        "total_chunks": 1,
    }


def _split_text(text: str, max_chars: int, overlap: int) -> List[str]:
    """Split text into overlapping chunks, preferring paragraph boundaries."""
    chunks: List[str] = []
    start = 0

    while start < len(text):
        end = min(start + max_chars, len(text))

        # Try to break at paragraph boundary
        if end < len(text):
            newline_pos = text.rfind("\n\n", start, end)
            if newline_pos > start + max_chars // 2:
                end = newline_pos

        chunks.append(text[start:end].strip())
        start = end - overlap  # Overlap for context

    return [c for c in chunks if c]
