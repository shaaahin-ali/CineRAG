"""
Screenplay text parser — converts raw extracted text into structured scenes.
Handles standard screenplay format (INT./EXT. headings) with Malayalam support.
"""

from __future__ import annotations

import logging
import re
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

# ── Scene heading regexes (tried in order, most → least strict) ───────────────

# Strategy 1: INT./EXT. + location + dash + optional time-of-day
# Handles: "INT. KITCHEN - DAY", "EXT. STREET - NIGHT", "INT/EXT. CAR - CONTINUOUS"
SCENE_HEADING_STRICT_RE = re.compile(
    r"^(?:(\d+)\s*[.)\-]\s*)?"                  # Optional scene number
    r"(INT\.|EXT\.|INT/EXT\.|INTERIOR|EXTERIOR)\s+"  # INT./EXT. or full word
    r"(.+?)"                                     # Location
    r"(?:\s*[-–]\s*"                             # Optional: separator + time-of-day
    r"(DAY|NIGHT|DUSK|DAWN|CONTINUOUS|MOMENTS LATER|LATER|MORNING|EVENING|AFTERNOON))?$",
    re.IGNORECASE,
)

# Strategy 2: INT./EXT. without any dash separator (common in informal scripts)
# Handles: "INT. ANIRUDHAN'S WORKSHOP"  "EXT MARKET PLACE"
SCENE_HEADING_LOOSE_RE = re.compile(
    r"^(?:(\d+)\s*[.)\-]\s*)?"
    r"(INT\.?|EXT\.?|INT/EXT\.?|INTERIOR|EXTERIOR)\s+"
    r"(.{3,80})$",
    re.IGNORECASE,
)

# Strategy 3: Numbered scene lines — "1. LOCATION" or "SCENE 1" style
# Common in Indian regional scripts
SCENE_NUMBERED_RE = re.compile(
    r"^(\d{1,3})\s*[.)]\s+"            # "1. " or "1) "
    r"([A-ZА-ЯА-яa-z\u0D00-\u0D7F].{2,80})$",  # Heading text (any script)
)

# Strategy 4: Malayalam scene headings — "1. ഉൾ. LOCATION" or "1. പുറ. LOCATION"
MALAYALAM_HEADING_RE = re.compile(
    r"^(\d+)\s*[.)]\s+(ഉൾ\.?|പുറ\.?|ഉൾ/പുറ\.?)\s*(.+)",
    re.UNICODE,
)

# Character name: ALL CAPS line (3-30 chars, no Malayalam)
CHARACTER_RE = re.compile(r"^([A-Z][A-Z\s'\-.]{2,28})$")

# Page marker patterns
PAGE_MARKER_RE = re.compile(r"(?:^\s*\d+\.\s*$|page\s+\d+)", re.IGNORECASE | re.MULTILINE)

# Time-of-day words used for heading classification
TIME_WORDS = {
    "DAY", "NIGHT", "DUSK", "DAWN", "CONTINUOUS", "LATER",
    "MORNING", "EVENING", "AFTERNOON", "MOMENTS LATER",
}


# ── Page-mapping helpers ──────────────────────────────────────────────────────

def detect_page_numbers(text: str) -> Dict[int, int]:
    """Estimate page numbers by scanning for page markers."""
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


# ── Character name extraction ────────────────────────────────────────────────

def extract_characters_from_block(text: str) -> List[str]:
    """Extract ALL CAPS character names from a scene block."""
    chars = set()

    ignore_exact = {
        "INT", "EXT", "INT/EXT", "INTERIOR", "EXTERIOR",
        "FADE IN", "FADE OUT", "CUT TO", "DISSOLVE TO", "SMASH CUT",
        "MATCH CUT", "CONTINUED", "MORE", "THE END", "TITLE CARD",
        "BACK TO", "INTERCUT WITH", "OVER", "SCENE", "ACT", "END OF",
        "ANGLE ON", "CLOSE ON", "POV", "SUPER", "TITLE",
    }

    ignore_start = (
        "INT.", "INT ", "EXT.", "EXT ", "INT/EXT",
        "FADE", "CUT ", "DISSOLVE", "SMASH", "MATCH",
        "TITLE", "SUPER", "ANGLE", "CLOSE", "BACK TO",
        "INTERIOR", "EXTERIOR",
    )

    location_words = {
        "DAY", "NIGHT", "DUSK", "DAWN", "MORNING", "EVENING", "AFTERNOON",
        "CONTINUOUS", "LATER", "MOMENTS", "SAME", "FLASHBACK",
        "INTERIOR", "EXTERIOR", "WORKSHOP", "HOUSE", "ROOM", "OFFICE",
        "STREET", "ROAD", "GARDEN", "BEACH", "SCHOOL", "HOSPITAL",
        "CHURCH", "TEMPLE", "MOSQUE", "MARKET", "SHOP", "RESTAURANT",
        "HOTEL", "PLACE", "BUILDING", "FLOOR", "HALLWAY", "CORRIDOR",
        "KITCHEN", "BEDROOM", "BATHROOM", "BALCONY", "TERRACE", "ROOF",
        "PARKING", "COURTYARD", "VERANDA", "PORCH", "GATE",
    }

    for line in text.split("\n"):
        line = line.strip()
        if not line or len(line) < 2:
            continue

        clean = re.sub(r"\s*\([^)]*\)\s*$", "", line).strip()
        if not clean or len(clean) < 2:
            continue

        if "." in clean:
            continue

        if any(clean.startswith(prefix) for prefix in ignore_start):
            continue

        if not re.match(r"^[A-Z][A-Z\s'\-]{0,28}$", clean):
            continue

        if clean in ignore_exact:
            continue

        words = set(clean.split())
        if words & location_words:
            continue

        if " - " in clean:
            continue

        chars.add(clean)
    return sorted(chars)


# ── Heading match → structured info ──────────────────────────────────────────

def _parse_heading_line(line: str, scene_counter: int) -> Optional[Dict[str, Any]]:
    """
    Try all heading strategies on a single line.
    Returns a heading_info dict on match, or None.
    """
    stripped = line.strip()
    if not stripped:
        return None

    # Strategy 1 & 2: INT./EXT. variants
    for pattern in (SCENE_HEADING_STRICT_RE, SCENE_HEADING_LOOSE_RE):
        m = pattern.match(stripped)
        if m:
            explicit_num = m.group(1)
            scene_num = int(explicit_num) if explicit_num else scene_counter

            raw_prefix = m.group(2).upper().rstrip(".")
            if "/" in raw_prefix or ("EXTERIOR" in raw_prefix and "INT" in raw_prefix):
                int_ext = "INT/EXT"
            elif raw_prefix.startswith("EXT"):
                int_ext = "EXT"
            else:
                int_ext = "INT"

            location = (m.group(3) or "UNKNOWN").strip().rstrip("-– ").strip()
            time_of_day_raw = m.lastindex >= 4 and m.group(4)
            time_of_day = time_of_day_raw.upper() if time_of_day_raw else None

            return {
                "scene_number": scene_num,
                "heading": stripped,
                "location": location,
                "time_of_day": time_of_day,
                "int_ext": int_ext,
            }

    # Strategy 3: Malayalam ഉൾ/പുറ headings
    m = MALAYALAM_HEADING_RE.match(stripped)
    if m:
        int_ext_map = {"ഉൾ": "INT", "പുറ": "EXT", "ഉൾ/പുറ": "INT/EXT"}
        prefix_clean = m.group(2).rstrip(".")
        return {
            "scene_number": int(m.group(1)),
            "heading": stripped,
            "location": m.group(3).strip(),
            "time_of_day": None,
            "int_ext": int_ext_map.get(prefix_clean, "INT"),
        }

    # Strategy 4: plain numbered lines  "1. SOME HEADING TEXT"
    m = SCENE_NUMBERED_RE.match(stripped)
    if m:
        return {
            "scene_number": int(m.group(1)),
            "heading": stripped,
            "location": m.group(2).strip(),
            "time_of_day": None,
            "int_ext": "INT",
        }

    return None


# ── Main parser ───────────────────────────────────────────────────────────────

def parse_screenplay_text(
    text: str,
    ml_parser: Any = None,
) -> List[Dict[str, Any]]:
    """
    Parse screenplay text into a list of scene dicts.

    Tries strategies in order:
      1. Multi-pattern line-by-line scan (INT./EXT., numbered, Malayalam)
      2. Paragraph-block fallback — every non-empty paragraph becomes a scene
         (guarantees ≥1 scene so ingestion never fails on unexpected formats)

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

    page_map = detect_page_numbers(text)
    scenes: List[Dict[str, Any]] = []
    scene_number_counter = 0

    lines = text.split("\n")
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

        ml_meta: Dict[str, Any] = {}
        if ml_parser:
            try:
                ml_meta = ml_parser.extract_ml_metadata(content)
            except Exception:
                pass

        page_span = max(1, page_end - page_start)
        scenes.append({
            **current_heading_info,
            "page_start": page_start,
            "page_end": page_end,
            "characters": characters + ml_meta.get("characters_ml", []),
            "content": current_heading_info["heading"] + "\n\n" + content,
            "estimated_duration_seconds": page_span * 60,
            **ml_meta,
        })
        scene_content_lines = []

    # ── Primary scan: line-by-line ───────────────────────────────────────────────
    offset = 0
    for line in lines:
        line_offset = offset
        offset += len(line) + 1

        scene_number_counter += 1
        heading_info = _parse_heading_line(line, scene_number_counter)

        if heading_info:
            flush_scene(line_offset)
            scene_number_counter = heading_info["scene_number"]
            current_heading_info = heading_info
            scene_start_offset = line_offset
        elif current_heading_info is not None:
            scene_content_lines.append(line)

    flush_scene(offset)

    if scenes:
        logger.info(f"Parsed {len(scenes)} scenes from screenplay")
        return scenes

    # ── Fallback: paragraph-block split ──────────────────────────────────
    logger.info("No structured scene headings found — using paragraph-block fallback")
    paragraphs = [p.strip() for p in re.split(r"\n{2,}", text) if p.strip()]
    for idx, para in enumerate(paragraphs, start=1):
        first_line = para.split("\n")[0][:80]
        scenes.append({
            "scene_number": idx,
            "heading": first_line,
            "location": first_line,
            "time_of_day": None,
            "int_ext": "INT",
            "page_start": char_to_page(text.find(para), page_map),
            "page_end": char_to_page(text.find(para) + len(para), page_map),
            "characters": extract_characters_from_block(para),
            "content": para,
            "estimated_duration_seconds": 60,
        })

    logger.info(f"Parsed {len(scenes)} paragraph-blocks as scenes (fallback mode)")
    return scenes
