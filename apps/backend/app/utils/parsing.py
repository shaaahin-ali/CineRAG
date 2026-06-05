"""
Screenplay text parser — converts raw extracted text into structured scenes.
Handles standard screenplay format (INT./EXT. headings) with Malayalam support.
"""

from __future__ import annotations

import logging
import re
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

# ── Scene heading regex ────────────────────────────────────────────────────────
# Matches: INT. LOCATION - DAY / EXT. LOCATION - NIGHT / INT/EXT.
SCENE_HEADING_RE = re.compile(
    r"^(?:(\d+)\s*[.)\-]\s*)?"                  # Optional scene number
    r"(INT\.|EXT\.|INT/EXT\.)\s+"               # INT./EXT.
    r"(.+?)"                                    # Location
    r"\s*[-–]\s*"                               # Separator
    r"(DAY|NIGHT|DUSK|DAWN|CONTINUOUS|MOMENTS LATER|LATER|MORNING|EVENING|AFTERNOON)?",
    re.IGNORECASE | re.MULTILINE,
)

# Character name: ALL CAPS line (4-30 chars)
CHARACTER_RE = re.compile(r"^([A-Z][A-Z\s'\-.]{2,28})$")

# Page marker patterns
PAGE_MARKER_RE = re.compile(r"(?:^\s*\d+\.\s*$|page\s+\d+)", re.IGNORECASE | re.MULTILINE)


def detect_page_numbers(text: str) -> Dict[int, int]:
    """
    Estimate page numbers by scanning for page markers.
    Returns {char_offset: page_number}.
    """
    pages: Dict[int, int] = {0: 1}
    current_page = 1
    for match in PAGE_MARKER_RE.finditer(text):
        current_page += 1
        pages[match.start()] = current_page
    return pages


def char_to_page(offset: int, page_map: Dict[int, int]) -> int:
    """Map a character offset to an estimated page number."""
    pages = sorted(page_map.keys())
    page_num = 1
    for pos in pages:
        if offset >= pos:
            page_num = page_map[pos]
        else:
            break
    return page_num


def extract_characters_from_block(text: str) -> List[str]:
    """Extract ALL CAPS character names from a scene block."""
    chars = set()
    for line in text.split("\n"):
        line = line.strip()
        m = CHARACTER_RE.match(line)
        if m and len(line) > 2:
            # Filter screenplay keywords
            if line not in {
                "INT", "EXT", "FADE IN", "FADE OUT", "CUT TO",
                "DISSOLVE TO", "SMASH CUT", "CONTINUED", "MORE",
                "THE END", "TITLE CARD",
            }:
                chars.add(line)
    return sorted(chars)


def parse_screenplay_text(
    text: str,
    ml_parser: Any = None,  # Optional MalayalamScreenplayParser
) -> List[Dict[str, Any]]:
    """
    Parse screenplay text into a list of scene dicts.

    Each scene dict:
    {
        scene_number: int,
        page_start: int,
        page_end: int,
        heading: str,
        location: str,
        time_of_day: str | None,
        int_ext: "INT" | "EXT" | "INT/EXT",
        characters: [str],
        content: str,
        estimated_duration_seconds: int,
    }
    """
    # Normalize line endings
    text = text.replace("\r\n", "\n").replace("\r", "\n")

    # Build page map
    page_map = detect_page_numbers(text)

    scenes: List[Dict[str, Any]] = []
    scene_number_counter = 0

    # Split into lines and scan for scene headings
    lines = text.split("\n")
    i = 0
    scene_start_line = None
    scene_start_offset = 0
    current_heading_info: Optional[Dict[str, Any]] = None
    scene_content_lines: List[str] = []

    def flush_scene(end_offset: int) -> None:
        nonlocal scene_content_lines, current_heading_info, scene_number_counter

        if current_heading_info is None:
            return

        content = "\n".join(scene_content_lines).strip()
        if not content:
            return

        page_start = char_to_page(scene_start_offset, page_map)
        page_end = char_to_page(end_offset, page_map)

        characters = extract_characters_from_block(content)

        # Malayalam metadata enrichment
        ml_meta: Dict[str, Any] = {}
        if ml_parser:
            ml_meta = ml_parser.extract_ml_metadata(content)

        # Estimate duration (~1 page = 1 minute = 60 seconds)
        page_span = max(1, page_end - page_start)
        estimated_duration = page_span * 60

        scenes.append({
            **current_heading_info,
            "page_start": page_start,
            "page_end": page_end,
            "characters": characters + ml_meta.get("characters_ml", []),
            "content": current_heading_info["heading"] + "\n\n" + content,
            "estimated_duration_seconds": estimated_duration,
            **ml_meta,
        })
        scene_content_lines = []

    offset = 0
    for line in lines:
        line_offset = offset
        offset += len(line) + 1  # +1 for newline

        m = SCENE_HEADING_RE.match(line.strip())
        if m:
            # Flush previous scene
            flush_scene(line_offset)

            scene_number_counter += 1
            explicit_num = m.group(1)
            scene_num = int(explicit_num) if explicit_num else scene_number_counter

            int_ext_raw = m.group(2).upper().rstrip(".")
            int_ext = "INT/EXT" if "/" in int_ext_raw else int_ext_raw

            location = m.group(3).strip() if m.group(3) else "UNKNOWN"
            time_of_day = m.group(4).upper() if m.group(4) else None

            current_heading_info = {
                "scene_number": scene_num,
                "heading": line.strip(),
                "location": location,
                "time_of_day": time_of_day,
                "int_ext": int_ext,
            }
            scene_start_offset = line_offset
            continue

        if current_heading_info is not None:
            scene_content_lines.append(line)

    # Flush last scene
    flush_scene(offset)

    # If no scenes found via INT/EXT, try Malayalam headings
    if not scenes and ml_parser:
        logger.info("No English scene headings found — trying Malayalam patterns")
        for line in text.split("\n"):
            result = ml_parser.parse_ml_scene_heading(line)
            if result:
                scenes.append({
                    **result,
                    "page_start": 1,
                    "page_end": 1,
                    "characters": [],
                    "content": line,
                    "estimated_duration_seconds": 60,
                })

    logger.info(f"Parsed {len(scenes)} scenes from screenplay")
    return scenes
