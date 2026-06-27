"""
Character Graph API — returns React Flow-compatible graph data with
LLM-extracted relationship labels.

Routes:
  GET /api/v1/projects/{id}/character-graph   Character relationship graph
"""

import asyncio
import logging
import re
from typing import Any, Dict, List
from uuid import UUID

from fastapi import APIRouter, HTTPException, Request

from app.core.security import extract_token
from app.services.character_graph import build_character_graph
from app.services.graph_cache import get_cached_graph, set_cached_graph
from app.services.scene_images import generate_images_for_project
from app.services.storage import SupabaseClient

logger = logging.getLogger(__name__)
router = APIRouter()

# ── Character name patterns ───────────────────────────────────────────────────

# English ALL-CAPS character cue (e.g. "HARI") — NO dots allowed
CHARACTER_RE = re.compile(r"^([A-Z][A-Z\s'\-]{0,28})$")

# Malayalam character cue — a short standalone Malayalam-script line
# that acts as a speaker name before dialogue
MALAYALAM_CHAR_RE = re.compile(r"^[\u0D00-\u0D7F\s'\-]{2,30}$")

# Strip trailing parentheticals: "HARI (V.O.)" → "HARI"
PARENTHETICAL_RE = re.compile(r"\s*\([^)]*\)\s*$")

# Keywords that should NEVER be treated as character names (English)
IGNORE_NAMES = {
    "INT", "EXT", "INT/EXT",
    "FADE IN", "FADE OUT", "CUT TO", "DISSOLVE TO", "SMASH CUT",
    "MATCH CUT", "CONTINUED", "MORE", "THE END", "TITLE CARD",
    "BACK TO", "INTERCUT WITH", "OVER", "SCENE", "ACT", "END OF",
    "ANGLE ON", "CLOSE ON", "POV", "SUPER", "TITLE",
}

# Prefixes that indicate scene headings / directions
IGNORE_PREFIXES = (
    "INT.", "INT ", "EXT.", "EXT ", "INT/EXT",
    "FADE", "CUT ", "DISSOLVE", "SMASH", "MATCH",
    "TITLE", "SUPER", "ANGLE", "CLOSE", "BACK TO",
)

# English words found in scene headings / locations
LOCATION_WORDS = {
    "DAY", "NIGHT", "DUSK", "DAWN", "MORNING", "EVENING", "AFTERNOON",
    "CONTINUOUS", "LATER", "MOMENTS", "SAME", "FLASHBACK",
    "INTERIOR", "EXTERIOR", "WORKSHOP", "HOUSE", "ROOM", "OFFICE",
    "STREET", "ROAD", "GARDEN", "BEACH", "SCHOOL", "HOSPITAL",
    "CHURCH", "TEMPLE", "MOSQUE", "MARKET", "SHOP", "RESTAURANT",
    "HOTEL", "PLACE", "BUILDING", "FLOOR", "HALLWAY", "CORRIDOR",
    "KITCHEN", "BEDROOM", "BATHROOM", "BALCONY", "TERRACE", "ROOF",
    "PARKING", "COURTYARD", "VERANDA", "PORCH", "GATE",
}

# Malayalam scene-heading / direction words to ignore
MALAYALAM_IGNORE_WORDS = {
    "ഉൾ", "പുറ", "ഉൾ/പുറ",                    # INT/EXT equivalents
    "രാവിലെ", "രാത്രി", "ദുപ്പഹരം",            # Time of day
    "സന്ധ്യാകാലം", "പ്രഭാതം", "വൈകുന്നേരം",   # More time of day
    "തുടരുന്നു", "അടുത്ത", "അവസാനം",            # Directions
}


def _is_english_character(clean: str) -> bool:
    """Check if a cleaned line is a valid English ALL-CAPS character cue."""
    if "." in clean:
        return False
    if any(clean.startswith(prefix) for prefix in IGNORE_PREFIXES):
        return False
    if not CHARACTER_RE.match(clean):
        return False
    if clean in IGNORE_NAMES:
        return False
    words = set(clean.split())
    if words & LOCATION_WORDS:
        return False
    if " - " in clean:
        return False
    return True


def _is_malayalam_character(line: str, upcoming_lines: List[str]) -> bool:
    """
    Check if a line is a Malayalam character cue.
    
    Malayalam screenplays follow the pattern:
        നിതിൻ                    ← character name (short, standalone)
                                  ← possibly empty lines
        എനിക്ക് ഒരു കാര്യം...    ← dialogue (longer line follows)
    
    Rules:
    - Must be 4-30 chars (filters out 2-3 char PDF fragments)
    - Must be a single word (character names are typically one word)
    - Must contain Malayalam script
    - Must NOT be a scene heading, direction word, or sentence fragment
    """
    if not line or len(line) > 30 or len(line) < 4:
        return False

    # Must contain Malayalam characters
    if not re.search(r"[\u0D00-\u0D7F]", line):
        return False

    # Remove parenthetical suffixes
    clean = re.sub(r"\s*\([^)]*\)\s*$", "", line).strip()
    if not clean or len(clean) < 4:
        return False

    # Skip if starts with English scene-heading prefixes
    if any(clean.upper().startswith(prefix) for prefix in IGNORE_PREFIXES):
        return False

    # Skip if contains English scene heading pattern (INT./EXT.)
    if re.match(r"^(?:INT|EXT)", clean, re.IGNORECASE):
        return False

    # Skip Malayalam direction/heading words
    for ignore_word in MALAYALAM_IGNORE_WORDS:
        if clean == ignore_word:
            return False

    # Must be short: max 2 words (character names are usually 1 word)
    word_count = len(clean.split())
    if word_count > 2:
        return False

    # Skip if it ends with a period or comma (likely a sentence fragment)
    if clean.endswith(".") or clean.endswith(",") or clean.endswith("?") or clean.endswith("!"):
        return False

    # Skip if contains non-breaking spaces (\xa0) — usually broken text
    if "\xa0" in clean:
        return False

    # Skip if contains digits
    if re.search(r"\d", clean):
        return False

    # Look ahead past empty lines to find dialogue
    for next_line in upcoming_lines:
        next_stripped = next_line.strip()
        if not next_stripped:
            continue  # skip empty lines
        # Next non-empty line should be longer (dialogue) or a parenthetical
        if len(next_stripped) > len(clean):
            return True
        if next_stripped.startswith("("):
            return True
        break

    return False


def _extract_malayalam_inline_names(line: str) -> List[str]:
    """
    Extract character names from inline patterns like:
        അനിരുദ്ധൻ (distracted) Yes...
        കാമിനി (ചിരിച്ചുകൊണ്ട്)
    
    Returns list of extracted names.
    """
    # Pattern: Malayalam word(s) followed by parenthetical
    m = re.match(r"^([\u0D00-\u0D7F]{4,20})\s*\(", line)
    if m:
        name = m.group(1).strip()
        if name and len(name) >= 4:
            return [name]
    return []


def extract_characters_from_content(content: str) -> List[str]:
    """
    Extract character names from screenplay content.
    
    Supports:
    - English ALL-CAPS character cues: HARI, MAYA, JAMES
    - Malayalam script character cues: നിതിൻ, ശരിത, അമ്മ
    - Inline parenthetical patterns: അനിരുദ്ധൻ (distracted) → അനിരുദ്ധൻ
    - Parenthetical suffixes: HARI (V.O.) → HARI
    
    Rejects:
    - Scene headings (INT./EXT.), locations, direction keywords
    - Short fragments from bad PDF parsing
    """
    english_chars: set[str] = set()
    malayalam_candidates: dict[str, int] = {}  # name → count
    lines = content.split("\n")

    for i, raw_line in enumerate(lines):
        line = raw_line.strip()
        if not line or len(line) < 2:
            continue

        # Remove trailing parenthetical
        clean = PARENTHETICAL_RE.sub("", line).strip()
        if not clean or len(clean) < 2:
            continue

        # Try English character name first
        if _is_english_character(clean):
            english_chars.add(clean)
            continue

        # Try Malayalam character name (pass upcoming lines for lookahead)
        upcoming = [lines[j] for j in range(i + 1, min(i + 5, len(lines)))]
        if _is_malayalam_character(clean, upcoming):
            malayalam_candidates[clean] = malayalam_candidates.get(clean, 0) + 1
            continue

        # Try inline Malayalam name extraction
        inline_names = _extract_malayalam_inline_names(line)
        for name in inline_names:
            malayalam_candidates[name] = malayalam_candidates.get(name, 0) + 1

    # For Malayalam names, only keep those that appear 2+ times
    # (real character names are used repeatedly as speaker cues)
    # Exception: if very few candidates, keep all
    if len(malayalam_candidates) <= 5:
        ml_chars = set(malayalam_candidates.keys())
    else:
        ml_chars = {name for name, count in malayalam_candidates.items() if count >= 2}

    return sorted(english_chars | ml_chars)

@router.get("/projects/{project_id}/character-graph")
async def get_character_graph(
    request: Request,
    project_id: UUID,
    include_scenes: bool = False,
    include_locations: bool = False,
) -> Dict[str, Any]:
    """
    Build and return the character co-occurrence graph for a project.
    Uses hybrid extraction (heuristics + LLM) for relationship labels.

    Query params:
      include_scenes    — add scene nodes + appears_in edges
      include_locations — add location nodes + set_in edges

    Returns { nodes, edges, summary } in React Flow format.
    """
    token = extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    db = SupabaseClient()

    # ── Cache check (must be BEFORE any heavy work) ────────────────────────────
    cached = get_cached_graph(str(project_id))
    if cached:
        logger.info(f"[graph] Returning cached graph for project={project_id}")
        return cached

    # Fetch all scenes for this project (include content for LLM analysis)
    result = (
        db.table("scenes")
        .select("scene_number,characters,heading,location,content")
        .eq("project_id", str(project_id))
        .order("scene_number")
        .execute()
    )

    scenes = result.data or []
    if not scenes:
        return {"nodes": [], "edges": [], "summary": []}

    total_scenes = len(scenes)
    reextracted = 0

    # ALWAYS re-extract characters from content to ensure clean data.
    # The DB may have stale/broken characters (scene headings, locations, etc.)
    # from an earlier extraction pass.
    for scene in scenes:
        if scene.get("content"):
            fresh_chars = extract_characters_from_content(scene["content"])
            if fresh_chars:
                scene["characters"] = fresh_chars
                reextracted += 1
            elif not scene.get("characters"):
                scene["characters"] = []

    logger.info(
        f"[graph] Re-extracted characters for {reextracted}/{total_scenes} scenes"
    )

    # Build graph with hybrid relationship extraction (async)
    graph_data = await build_character_graph(
        scenes,
        use_llm=True,
        include_scenes=include_scenes,
        include_locations=include_locations,
    )
    logger.info(
        f"[graph] project={project_id} → "
        f"{len(graph_data['nodes'])} nodes, {len(graph_data['edges'])} edges"
    )

    # Save to cache
    set_cached_graph(str(project_id), graph_data)

    return graph_data


@router.post("/projects/{project_id}/regenerate-images")
async def regenerate_images(
    request: Request,
    project_id: UUID,
) -> Dict[str, Any]:
    """
    Re-trigger Pollinations.ai image generation for an already-indexed project.

    Useful when a project was previously ingested with a lower MAX_SCENES cap
    and is now missing images for some scenes.

    Returns immediately with a 202-style body; generation runs in the background.
    """
    token = extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    db = SupabaseClient()

    # Fetch scenes ordered by scene_number
    result = (
        db.table("scenes")
        .select("scene_number,heading,location,content,characters,int_ext,time_of_day")
        .eq("project_id", str(project_id))
        .order("scene_number")
        .execute()
    )
    scenes = result.data or []
    if not scenes:
        raise HTTPException(status_code=404, detail="No scenes found for this project")

    # Fire image generation as a background task (non-blocking)
    asyncio.create_task(
        generate_images_for_project(
            project_id=str(project_id),
            scenes=scenes,
        )
    )

    logger.info(
        f"[graph] Regenerating images for {len(scenes)} scenes, project={project_id}"
    )
    return {
        "project_id": str(project_id),
        "scenes_queued": len(scenes),
        "status": "generating",
        "message": f"Image generation started for {len(scenes)} scenes. "
                   "Check the Storyboard panel for progress.",
    }
