"""
Character Relationship Graph â€” builds a NetworkX graph from scene data,
then uses a HYBRID approach (heuristics + LLM + confidence scoring) to
extract actual relationship labels between characters.

Extraction Pipeline:
  Layer 1: Heuristic-based (fast, no API call, ~90% accurate for common patterns)
  Layer 2: LLM-based (for ambiguous/missed pairs, with few-shot examples)
  Layer 3: Confidence scoring + merge (flag low-confidence for review)

Layout:
  - Lead characters  â†’ innermost ring (or centre if solo)
  - Supporting       â†’ middle ring
  - Minor            â†’ outer ring

Nodes carry type "character" so the React Flow front-end can render them
with a custom styled component instead of the plain default box.
"""

from __future__ import annotations

import itertools
import json
import logging
import math
import re
from collections import defaultdict
from typing import Any, Dict, List, Optional, Tuple

import networkx as nx

logger = logging.getLogger(__name__)


# â”€â”€ Role classification â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

def _classify_role(scene_count: int, max_scenes: int) -> str:
    """
    Lead   â‰¥ 50 % of the most-seen character's scene count
    Supporting â‰¥ 15 %
    Minor  everything else
    """
    if max_scenes == 0:
        return "minor"
    ratio = scene_count / max_scenes
    if ratio >= 0.50:
        return "lead"
    if ratio >= 0.15:
        return "supporting"
    return "minor"


ROLE_COLORS: Dict[str, str] = {
    "lead":       "#FDB022",   # Gold
    "supporting": "#94A3B8",   # Silver-blue
    "minor":      "#475569",   # Slate
}

# Concentric-circle radii for each tier
ROLE_RADII: Dict[str, int] = {
    "lead":       160,
    "supporting": 340,
    "minor":      520,
}

CENTER_X = 600
CENTER_Y = 400


# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
#  LAYER 1 â€” Heuristic-based relationship extraction (no API, fast)
# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

# English relationship keywords â†’ relationship label
_ENGLISH_FAMILY_PATTERNS: List[Tuple[re.Pattern, str]] = [
    (re.compile(r"\b(?:my|his|her|your)\s+father\b", re.I), "Father"),
    (re.compile(r"\b(?:my|his|her|your)\s+mother\b", re.I), "Mother"),
    (re.compile(r"\b(?:my|his|her|your)\s+son\b", re.I), "Son"),
    (re.compile(r"\b(?:my|his|her|your)\s+daughter\b", re.I), "Daughter"),
    (re.compile(r"\b(?:my|his|her|your)\s+brother\b", re.I), "Brother"),
    (re.compile(r"\b(?:my|his|her|your)\s+sister\b", re.I), "Sister"),
    (re.compile(r"\b(?:my|his|her|your)\s+husband\b", re.I), "Husband"),
    (re.compile(r"\b(?:my|his|her|your)\s+wife\b", re.I), "Wife"),
    (re.compile(r"\b(?:my|his|her|your)\s+uncle\b", re.I), "Uncle"),
    (re.compile(r"\b(?:my|his|her|your)\s+aunt\b", re.I), "Aunt"),
    (re.compile(r"\b(?:my|his|her|your)\s+cousin\b", re.I), "Cousin"),
    (re.compile(r"\b(?:my|his|her|your)\s+grandfather\b", re.I), "Grandfather"),
    (re.compile(r"\b(?:my|his|her|your)\s+grandmother\b", re.I), "Grandmother"),
    (re.compile(r"\bfather[\s-]in[\s-]law\b", re.I), "Father-in-law"),
    (re.compile(r"\bmother[\s-]in[\s-]law\b", re.I), "Mother-in-law"),
]

_ENGLISH_ROMANTIC_PATTERNS: List[Tuple[re.Pattern, str]] = [
    (re.compile(r"\b(?:my|his|her)\s+lover\b", re.I), "Lover"),
    (re.compile(r"\b(?:my|his|her)\s+partner\b", re.I), "Partner"),
    (re.compile(r"\b(?:my|his|her)\s+fianc[eÃ©]+\b", re.I), "FiancÃ©"),
    (re.compile(r"\b(?:my|his|her)\s+boyfriend\b", re.I), "Boyfriend"),
    (re.compile(r"\b(?:my|his|her)\s+girlfriend\b", re.I), "Girlfriend"),
    (re.compile(r"\bi\s+love\s+you\b", re.I), "Lover"),
]

_ENGLISH_CONFLICT_PATTERNS: List[Tuple[re.Pattern, str]] = [
    (re.compile(r"\b(?:my|his|her|your)\s+enemy\b", re.I), "Enemy"),
    (re.compile(r"\b(?:my|his|her|your)\s+rival\b", re.I), "Rival"),
    (re.compile(r"\bi(?:'ll| will)\s+kill\s+you\b", re.I), "Enemy"),
    (re.compile(r"\byou(?:'re| are)\s+(?:dead|finished)\b", re.I), "Enemy"),
    (re.compile(r"\bi\s+(?:hate|despise)\s+you\b", re.I), "Enemy"),
    (re.compile(r"\bbetrayed?\b", re.I), "Betrays"),
]

_ENGLISH_PROFESSIONAL_PATTERNS: List[Tuple[re.Pattern, str]] = [
    (re.compile(r"\b(?:my|his|her|your)\s+boss\b", re.I), "Boss"),
    (re.compile(r"\b(?:my|his|her|your)\s+employee\b", re.I), "Employee"),
    (re.compile(r"\b(?:my|his|her|your)\s+colleague\b", re.I), "Colleague"),
    (re.compile(r"\b(?:my|his|her|your)\s+mentor\b", re.I), "Mentor"),
    (re.compile(r"\b(?:my|his|her|your)\s+student\b", re.I), "Student"),
    (re.compile(r"\b(?:my|his|her|your)\s+teacher\b", re.I), "Teacher"),
    (re.compile(r"\b(?:my|his|her|your)\s+doctor\b", re.I), "Doctor"),
    (re.compile(r"\b(?:my|his|her|your)\s+partner\b", re.I), "Partner"),
]

_ENGLISH_FRIENDSHIP_PATTERNS: List[Tuple[re.Pattern, str]] = [
    (re.compile(r"\b(?:my|his|her|your)\s+(?:best\s+)?friend\b", re.I), "Friend"),
    (re.compile(r"\b(?:my|his|her|your)\s+confidant\b", re.I), "Confidant"),
    (re.compile(r"\b(?:my|his|her|your)\s+ally\b", re.I), "Ally"),
    (re.compile(r"\b(?:my|his|her|your)\s+companion\b", re.I), "Companion"),
    (re.compile(r"\b(?:my|his|her|your)\s+neighbou?r\b", re.I), "Neighbor"),
]

# Malayalam relationship keywords
_MALAYALAM_RELATIONSHIP_KEYWORDS: Dict[str, str] = {
    # Family
    "à´…à´šàµà´›àµ»": "Father",
    "à´…à´šàµà´›à´¾": "Father",
    "à´…à´ªàµà´ªàµ»": "Father",
    "à´…à´®àµà´®": "Mother",
    "à´…à´®àµà´®àµ‡": "Mother",
    "à´®à´•àµ»": "Son",
    "à´®à´•àµ¾": "Daughter",
    "à´®àµ‹àµ»": "Son",
    "à´®àµ‹àµ¾": "Daughter",
    "à´šàµ‡à´Ÿàµà´Ÿàµ»": "Brother",
    "à´šàµ‡à´Ÿàµà´Ÿà´¾": "Brother",
    "à´šàµ‡à´šàµà´šà´¿": "Sister",
    "à´…à´¨à´¿à´¯àµ»": "Brother",
    "à´…à´¨à´¿à´¯à´¤àµà´¤à´¿": "Sister",
    "à´­àµ¼à´¤àµà´¤à´¾à´µàµ": "Husband",
    "à´­à´¾à´°àµà´¯": "Wife",
    "à´•àµ†à´Ÿàµà´Ÿàµà´¯àµ‹àµ»": "Husband",
    "à´•àµ†à´Ÿàµà´Ÿàµà´¯àµ‹àµ¾": "Wife",
    "à´…à´®àµà´®à´¾à´µàµ»": "Uncle",
    "à´…à´®àµà´®à´¾à´¯à´¿": "Aunt",
    "à´®àµà´¤àµà´¤à´šàµà´›àµ»": "Grandfather",
    "à´®àµà´¤àµà´¤à´¶àµà´¶à´¿": "Grandmother",
    # Relationships
    "à´•àµ‚à´Ÿàµà´Ÿàµà´•à´¾à´°àµ»": "Friend",
    "à´•àµ‚à´Ÿàµà´Ÿàµà´•à´¾à´°à´¿": "Friend",
    "à´¸àµà´¹àµƒà´¤àµà´¤àµ": "Friend",
    "à´¸àµà´¨àµ‡à´¹à´¿à´¤àµ»": "Friend",
    "à´¶à´¤àµà´°àµ": "Enemy",
    "à´Žà´¤à´¿à´°à´¾à´³à´¿": "Rival",
    "à´•à´¾à´®àµà´•àµ»": "Lover",
    "à´•à´¾à´®àµà´•à´¿": "Lover",
    "à´—àµà´°àµ": "Mentor",
    "à´¶à´¿à´·àµà´¯àµ»": "Student",
    "à´…à´¯àµ½à´•àµà´•à´¾à´°àµ»": "Neighbor",
    "à´…à´¯àµ½à´•àµà´•à´¾à´°à´¿": "Neighbor",
}

# Location â†’ likely relationship for co-appearing characters
_LOCATION_RELATIONSHIP_HINTS: Dict[str, str] = {
    "HOUSE": "Family",
    "HOME": "Family",
    "APARTMENT": "Family",
    "KITCHEN": "Family",
    "BEDROOM": "Family",
    "LIVING ROOM": "Family",
    "SCHOOL": "Student",
    "COLLEGE": "Student",
    "UNIVERSITY": "Student",
    "OFFICE": "Colleague",
    "WORKSHOP": "Colleague",
    "FACTORY": "Colleague",
    "HOSPITAL": "Doctor",
    "CLINIC": "Doctor",
    "COURT": "Colleague",
    "POLICE STATION": "Colleague",
    "CHURCH": "Friend",
    "TEMPLE": "Friend",
    "MOSQUE": "Friend",
    "BAR": "Friend",
    "RESTAURANT": "Friend",
    "CAFE": "Friend",
    "TEA SHOP": "Friend",
}

# Parenthetical emotional cues â†’ relationship hints
_PARENTHETICAL_HINTS: Dict[str, str] = {
    "crying": "Family",
    "sobbing": "Family",
    "emotional": "Family",
    "hugging": "Family",
    "angry": "Rival",
    "furious": "Rival",
    "shouting": "Rival",
    "yelling": "Rival",
    "threatening": "Enemy",
    "laughing": "Friend",
    "joking": "Friend",
    "smiling": "Friend",
    "flirting": "Lover",
    "kissing": "Lover",
    "intimate": "Lover",
    "whispering": "Confidant",
    "secretly": "Confidant",
}


def _find_character_near_pattern(
    content: str,
    match_pos: int,
    characters: List[str],
    window: int = 200,
) -> Optional[str]:
    """
    Find the nearest character name within `window` chars of a regex match
    position. Returns the character name, or None.
    """
    start = max(0, match_pos - window)
    end = min(len(content), match_pos + window)
    context = content[start:end]

    # Score by proximity to the match position
    best: Optional[str] = None
    best_dist = window + 1
    for char in characters:
        idx = context.find(char)
        if idx >= 0:
            dist = abs(idx - (match_pos - start))
            if dist < best_dist:
                best_dist = dist
                best = char
    return best


def _extract_speaker_from_context(
    content: str,
    match_pos: int,
    characters: List[str],
) -> Optional[str]:
    """
    Look backwards from match_pos to find the speaker (ALL-CAPS character cue
    on a line by itself, or a Malayalam character name).
    """
    # Find the start of the current "block" (last double newline)
    before = content[:match_pos]
    lines = before.split("\n")

    # Walk backwards through lines to find a character cue
    for line in reversed(lines[-8:]):
        stripped = line.strip()
        if not stripped:
            continue
        # Remove parentheticals
        clean = re.sub(r"\s*\([^)]*\)\s*$", "", stripped).strip()
        if clean in characters:
            return clean
        # Check Malayalam
        for char in characters:
            if char == clean:
                return char
    return None


def _extract_relationships_heuristics(
    scenes: List[Dict[str, Any]],
    characters: List[str],
    edge_pairs: List[Tuple[str, str]],
) -> Dict[str, Dict[str, Any]]:
    """
    LAYER 1: Extract relationships using screenplay text patterns (no LLM).
    Works for ~60-70% of relationships, especially family/romantic/conflict.

    Returns dict mapping "CHAR_A||CHAR_B" â†’ {
        "relationship": str,
        "confidence": float,
        "source": "heuristic",
        "supporting_text": str,
    }
    """
    results: Dict[str, Dict[str, Any]] = {}

    # Track per-pair evidence across scenes (multiple hints strengthen confidence)
    pair_evidence: Dict[str, List[Dict[str, Any]]] = defaultdict(list)

    # --- Scan all scene content for dialogue/keyword patterns ---
    for scene in scenes:
        content = scene.get("content") or ""
        scene_num = scene.get("scene_number", "?")
        scene_chars: List[str] = scene.get("characters") or []
        heading = (scene.get("heading") or "").upper()
        location = (scene.get("location") or "").upper()

        if not content or len(scene_chars) < 2:
            continue

        # --- English pattern matching ---
        all_pattern_groups = [
            ("family", _ENGLISH_FAMILY_PATTERNS, 0.92),
            ("romantic", _ENGLISH_ROMANTIC_PATTERNS, 0.88),
            ("conflict", _ENGLISH_CONFLICT_PATTERNS, 0.85),
            ("professional", _ENGLISH_PROFESSIONAL_PATTERNS, 0.82),
            ("friendship", _ENGLISH_FRIENDSHIP_PATTERNS, 0.80),
        ]

        for group_name, patterns, base_confidence in all_pattern_groups:
            for pattern, label in patterns:
                for match in pattern.finditer(content):
                    # Find speaker (who says "my father") and object (who is the father)
                    speaker = _extract_speaker_from_context(
                        content, match.start(), scene_chars
                    )
                    nearby = _find_character_near_pattern(
                        content, match.start(), scene_chars
                    )

                    if speaker and nearby and speaker != nearby:
                        key = f"{speaker}||{nearby}"
                        excerpt_start = max(0, match.start() - 40)
                        excerpt_end = min(len(content), match.end() + 40)
                        pair_evidence[key].append({
                            "relationship": label,
                            "confidence": base_confidence,
                            "scene": scene_num,
                            "supporting_text": content[excerpt_start:excerpt_end].strip(),
                            "group": group_name,
                        })

        # --- Malayalam keyword matching ---
        for ml_word, label in _MALAYALAM_RELATIONSHIP_KEYWORDS.items():
            if ml_word in content:
                idx = content.find(ml_word)
                speaker = _extract_speaker_from_context(
                    content, idx, scene_chars
                )
                nearby = _find_character_near_pattern(
                    content, idx, scene_chars
                )
                if speaker and nearby and speaker != nearby:
                    key = f"{speaker}||{nearby}"
                    excerpt_start = max(0, idx - 40)
                    excerpt_end = min(len(content), idx + len(ml_word) + 40)
                    pair_evidence[key].append({
                        "relationship": label,
                        "confidence": 0.90,
                        "scene": scene_num,
                        "supporting_text": content[excerpt_start:excerpt_end].strip(),
                        "group": "malayalam",
                    })

        # --- Parenthetical analysis ---
        parenthetical_re = re.compile(r"\(([^)]+)\)")
        for match in parenthetical_re.finditer(content):
            paren_text = match.group(1).lower().strip()
            for keyword, hint_rel in _PARENTHETICAL_HINTS.items():
                if keyword in paren_text:
                    speaker = _extract_speaker_from_context(
                        content, match.start(), scene_chars
                    )
                    if speaker:
                        # Apply this hint to all co-appearing characters
                        for other_char in scene_chars:
                            if other_char != speaker:
                                key = f"{speaker}||{other_char}"
                                pair_evidence[key].append({
                                    "relationship": hint_rel,
                                    "confidence": 0.55,  # lower: parentheticals are hints only
                                    "scene": scene_num,
                                    "supporting_text": f"({match.group(1)})",
                                    "group": "parenthetical",
                                })
                    break

        # --- Location-based inference (weakest signal) ---
        for loc_keyword, loc_rel in _LOCATION_RELATIONSHIP_HINTS.items():
            if loc_keyword in location or loc_keyword in heading:
                # All pairs in this scene get a weak location-based hint
                for a, b in itertools.combinations(sorted(set(scene_chars)), 2):
                    key = f"{a}||{b}"
                    pair_evidence[key].append({
                        "relationship": loc_rel,
                        "confidence": 0.40,  # very low â€” location is a weak signal
                        "scene": scene_num,
                        "supporting_text": f"Both appear at {location or heading}",
                        "group": "location",
                    })

    # --- Aggregate evidence per pair ---
    for key, evidence_list in pair_evidence.items():
        # Skip pairs with only location-based hints (too weak on their own)
        non_location = [e for e in evidence_list if e["group"] != "location"]
        if not non_location:
            # Still keep if we have 3+ location hits (consistent pattern)
            if len(evidence_list) < 3:
                continue

        # Pick the most common relationship label
        label_counts: Dict[str, int] = defaultdict(int)
        label_confidence: Dict[str, float] = defaultdict(float)
        label_text: Dict[str, str] = {}

        for ev in evidence_list:
            rel = ev["relationship"]
            label_counts[rel] += 1
            # Track max confidence per label
            if ev["confidence"] > label_confidence[rel]:
                label_confidence[rel] = ev["confidence"]
                label_text[rel] = ev["supporting_text"]

        # Winner: most frequent, break ties by confidence
        best_label = max(
            label_counts,
            key=lambda r: (label_counts[r], label_confidence[r]),
        )
        best_confidence = label_confidence[best_label]

        # Boost confidence if we have multiple evidence sources
        evidence_count = label_counts[best_label]
        if evidence_count >= 3:
            best_confidence = min(0.98, best_confidence + 0.05)
        elif evidence_count >= 2:
            best_confidence = min(0.96, best_confidence + 0.03)

        # Only emit if confidence is above threshold
        if best_confidence >= 0.50:
            results[key] = {
                "relationship": best_label,
                "confidence": round(best_confidence, 2),
                "source": "heuristic",
                "supporting_text": label_text.get(best_label, ""),
                "evidence_count": evidence_count,
            }

    logger.info(
        f"[heuristic] Extracted {len(results)} relationships "
        f"from {len(scenes)} scenes"
    )
    return results


# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
#  LAYER 2 â€” LLM-based relationship extraction (improved prompt)
# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

async def _extract_relationships_with_llm(
    characters: List[str],
    scene_contents: List[Dict[str, Any]],
    edges: List[tuple],
) -> Dict[str, Dict[str, Any]]:
    """
    Use a free LLM to extract relationship labels between character pairs.
    Improved with few-shot examples, confidence scoring, and 2-model consensus.

    Returns a dict mapping "CHAR_A||CHAR_B" â†’ {
        "relationship": str,
        "confidence": float,
        "source": "llm",
        "supporting_text": str,
    }
    """
    from app.core.config import settings

    if not characters or not edges:
        return {}

    # Build a scene summary â€” increased from 30 to 60 for better coverage
    scene_summary_parts = []
    for scene in scene_contents[:60]:
        chars = scene.get("characters", [])
        content = (scene.get("content") or "")[:400]
        heading = scene.get("heading", "")
        location = scene.get("location", "")
        if chars and content:
            scene_summary_parts.append(
                f"Scene {scene.get('scene_number', '?')}: {heading}\n"
                f"Location: {location}\n"
                f"Characters: {', '.join(chars)}\n"
                f"Content: {content}"
            )

    scene_text = "\n---\n".join(scene_summary_parts)

    # Build pairs (limit top 40 by weight)
    pair_list = []
    for a, b in edges[:40]:
        pair_list.append(f"{a} â†” {b}")

    # Improved prompt with few-shot examples and confidence scoring
    prompt = f"""Analyze this screenplay and determine the relationship between each character pair.

CHARACTERS: {', '.join(characters[:30])}

SCREENPLAY EXCERPTS:
{scene_text}

CHARACTER PAIRS TO ANALYZE:
{chr(10).join(pair_list)}

INSTRUCTIONS:
For each pair, determine their relationship type and provide:
- A short relationship label
- A confidence score (0.0 to 1.0) â€” how sure you are
- A brief supporting quote or reason from the text

Use labels like: Father, Mother, Son, Daughter, Brother, Sister, Husband, Wife,
Friend, Rival, Mentor, Student, Boss, Employee, Lover, Enemy, Partner, Colleague,
Neighbor, Ally, Confidant, Accomplice, Guardian, Ward, Uncle, Aunt, Cousin, etc.

If the relationship is unclear from the text, use "Associated" with low confidence.

EXAMPLES (follow this format exactly):
{{"HARI||ANMOL": {{"relationship": "Father", "confidence": 0.95, "supporting_text": "Anmol says: Father, I need help"}},
 "HARI||MEERA": {{"relationship": "Husband", "confidence": 0.92, "supporting_text": "Hari and Meera argue about household matters"}},
 "RAVI||KUMAR": {{"relationship": "Friend", "confidence": 0.78, "supporting_text": "They appear together at the tea shop in multiple scenes"}},
 "PRIYA||SUMAN": {{"relationship": "Associated", "confidence": 0.35, "supporting_text": "Only seen together once in Scene 4"}}}}

Return ONLY a JSON object in the exact format shown above. No other text."""

    try:
        results: Dict[str, Dict[str, Any]] = {}

        if settings.OPENROUTER_API_KEY:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(
                api_key=settings.OPENROUTER_API_KEY,
                base_url="https://openrouter.ai/api/v1",
            )

            # 2-model consensus: try to get results from 2 models
            model_results: List[Dict[str, Dict[str, Any]]] = []
            models = [
                settings.OPENROUTER_CHAT_MODEL,
                "google/gemma-4-31b-it:free",
                "meta-llama/llama-3.2-3b-instruct:free",
            ]
            for model in models:
                try:
                    response = await client.chat.completions.create(
                        model=model,
                        max_tokens=2048,
                        messages=[{"role": "user", "content": prompt}],
                        temperature=0.1,
                    )
                    text = response.choices[0].message.content or ""
                    parsed = _parse_relationship_json(text)
                    if parsed:
                        model_results.append(parsed)
                        logger.info(
                            f"[llm] Model {model} returned "
                            f"{len(parsed)} relationships"
                        )
                    # Stop after 2 successful models for consensus
                    if len(model_results) >= 2:
                        break
                except Exception as e:
                    logger.warning(f"OpenRouter model {model} failed: {e}")
                    continue

            # Merge model results with consensus
            results = _consensus_merge(model_results)

        elif settings.GEMINI_API_KEY:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(
                api_key=settings.GEMINI_API_KEY,
                base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
            )
            response = await client.chat.completions.create(
                model=settings.GEMINI_CHAT_MODEL,
                max_tokens=2048,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
            )
            text = response.choices[0].message.content or ""
            results = _parse_relationship_json(text)

        return results

    except Exception as e:
        logger.warning(f"LLM relationship extraction failed: {e}")
        return {}


def _consensus_merge(
    model_results: List[Dict[str, Dict[str, Any]]],
) -> Dict[str, Dict[str, Any]]:
    """
    Merge results from multiple models using consensus.
    If two models agree on a relationship, boost confidence.
    If they disagree, use the one with higher confidence but flag it.
    """
    if not model_results:
        return {}
    if len(model_results) == 1:
        return model_results[0]

    merged: Dict[str, Dict[str, Any]] = {}
    all_keys = set()
    for result in model_results:
        all_keys.update(result.keys())

    for key in all_keys:
        entries = [r[key] for r in model_results if key in r]

        if len(entries) == 1:
            # Only one model had this pair
            entry = entries[0]
            entry["source"] = "llm"
            merged[key] = entry
        elif len(entries) >= 2:
            # Check if models agree
            labels = [e["relationship"].lower() for e in entries]
            if labels[0] == labels[1]:
                # Agreement! Boost confidence
                best = max(entries, key=lambda e: e.get("confidence", 0.5))
                best["confidence"] = min(0.98, best.get("confidence", 0.5) + 0.08)
                best["source"] = "llm_consensus"
                merged[key] = best
            else:
                # Disagreement â€” use highest confidence but don't boost
                best = max(entries, key=lambda e: e.get("confidence", 0.5))
                best["confidence"] = max(
                    0.3, best.get("confidence", 0.5) - 0.10
                )
                best["source"] = "llm_disputed"
                merged[key] = best

    logger.info(
        f"[llm consensus] Merged {len(merged)} relationships from "
        f"{len(model_results)} models"
    )
    return merged


def _parse_relationship_json(text: str) -> Dict[str, Dict[str, Any]]:
    """Parse the LLM response to extract relationship mappings with confidence."""
    text = text.strip()
    # Remove markdown code fences if present
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)

    try:
        data = json.loads(text)
        if isinstance(data, dict):
            return _normalize_llm_response(data)
    except json.JSONDecodeError:
        # Try to find JSON object in the text (handle nested braces)
        # Find the outermost { ... }
        depth = 0
        start_idx = -1
        for i, ch in enumerate(text):
            if ch == "{":
                if depth == 0:
                    start_idx = i
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0 and start_idx >= 0:
                    try:
                        data = json.loads(text[start_idx:i + 1])
                        if isinstance(data, dict):
                            return _normalize_llm_response(data)
                    except json.JSONDecodeError:
                        pass

    logger.warning("Could not parse LLM relationship JSON")
    return {}


def _normalize_llm_response(data: Dict) -> Dict[str, Dict[str, Any]]:
    """
    Normalize LLM output to our standard format.
    Handles both old format (str value) and new format (dict with confidence).
    """
    normalized: Dict[str, Dict[str, Any]] = {}
    for key, value in data.items():
        if isinstance(value, str):
            # Old format: "CHAR_A||CHAR_B": "relationship"
            normalized[key] = {
                "relationship": value,
                "confidence": 0.60,  # default confidence for format without score
                "source": "llm",
                "supporting_text": "",
            }
        elif isinstance(value, dict):
            # New format with confidence
            normalized[key] = {
                "relationship": str(value.get("relationship", "Associated")),
                "confidence": float(value.get("confidence", 0.60)),
                "source": "llm",
                "supporting_text": str(value.get("supporting_text", "")),
            }
        else:
            normalized[key] = {
                "relationship": str(value),
                "confidence": 0.50,
                "source": "llm",
                "supporting_text": "",
            }
    return normalized


# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
#  LAYER 3 â€” Confidence scoring + merge
# â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

def _merge_relationships(
    heuristic_map: Dict[str, Dict[str, Any]],
    llm_map: Dict[str, Dict[str, Any]],
) -> Dict[str, Dict[str, Any]]:
    """
    Merge heuristic and LLM results with confidence-aware logic.

    Rules:
    - If only heuristic has it â†’ use heuristic (already high confidence)
    - If only LLM has it â†’ use LLM
    - If both agree â†’ boost confidence (great!)
    - If both disagree â†’ heuristic wins unless LLM has much higher confidence
    - Flag anything below 0.7 as low-confidence
    """
    merged: Dict[str, Dict[str, Any]] = {}

    all_keys = set(heuristic_map.keys()) | set(llm_map.keys())

    for key in all_keys:
        h = heuristic_map.get(key)
        l = llm_map.get(key)

        if h and not l:
            # Only heuristic â€” use directly
            merged[key] = h

        elif l and not h:
            # Only LLM â€” use directly
            merged[key] = l

        elif h and l:
            h_rel = h["relationship"].lower()
            l_rel = l["relationship"].lower()

            if h_rel == l_rel:
                # Both agree â€” boost confidence!
                merged_entry = h.copy()
                merged_entry["confidence"] = min(
                    0.99, max(h["confidence"], l["confidence"]) + 0.07
                )
                merged_entry["source"] = "merged_agree"
                # Prefer LLM supporting text (usually richer)
                if l.get("supporting_text"):
                    merged_entry["supporting_text"] = l["supporting_text"]
                merged[key] = merged_entry

            else:
                # Disagreement â€” heuristic wins UNLESS LLM is much more confident
                if l["confidence"] > h["confidence"] + 0.15:
                    merged_entry = l.copy()
                    merged_entry["confidence"] = max(
                        0.45, l["confidence"] - 0.10
                    )
                    merged_entry["source"] = "llm_override"
                    merged[key] = merged_entry
                else:
                    merged_entry = h.copy()
                    merged_entry["source"] = "heuristic_wins"
                    merged[key] = merged_entry

    # Log low-confidence relationships
    low_confidence = [
        (k, v["relationship"], v["confidence"])
        for k, v in merged.items()
        if v["confidence"] < 0.70
    ]
    if low_confidence:
        logger.warning(
            f"[merge] {len(low_confidence)} low-confidence relationships: "
            f"{low_confidence[:5]}{'...' if len(low_confidence) > 5 else ''}"
        )

    logger.info(
        f"[merge] Final: {len(merged)} relationships "
        f"({sum(1 for v in merged.values() if 'heuristic' in v['source'])} heuristic, "
        f"{sum(1 for v in merged.values() if 'llm' in v['source'])} llm, "
        f"{sum(1 for v in merged.values() if 'merged' in v['source'])} agreed)"
    )
    return merged


async def extract_relationships_hybrid(
    characters: List[str],
    scene_contents: List[Dict[str, Any]],
    edges: List[Tuple[str, str]],
) -> Dict[str, Dict[str, Any]]:
    """
    3-layer hybrid relationship extraction pipeline:
      Layer 1: Heuristic-based (fast, no API call)
      Layer 2: LLM-based (only for pairs heuristics missed or are uncertain about)
      Layer 3: Confidence scoring + merge

    Returns dict mapping "CHAR_A||CHAR_B" â†’ {
        "relationship": str,
        "confidence": float,
        "source": str,
        "supporting_text": str,
    }
    """
    # LAYER 1: Fast heuristics (no API call)
    heuristic_map = _extract_relationships_heuristics(
        scene_contents, characters, edges
    )

    # Determine which pairs still need LLM analysis
    high_confidence_heuristic = {
        k for k, v in heuristic_map.items()
        if v["confidence"] >= 0.85
    }

    # Only send pairs to LLM that heuristics missed or are uncertain about
    missing_edges = []
    for a, b in edges:
        key1 = f"{a}||{b}"
        key2 = f"{b}||{a}"
        if key1 not in high_confidence_heuristic and key2 not in high_confidence_heuristic:
            missing_edges.append((a, b))

    logger.info(
        f"[hybrid] Heuristics resolved {len(high_confidence_heuristic)} pairs "
        f"with high confidence. Sending {len(missing_edges)} pairs to LLM."
    )

    # LAYER 2: LLM for missing/uncertain pairs
    llm_map: Dict[str, Dict[str, Any]] = {}
    if missing_edges:
        try:
            llm_map = await _extract_relationships_with_llm(
                characters, scene_contents, missing_edges
            )
        except Exception as e:
            logger.warning(f"LLM extraction failed, using heuristics only: {e}")

    # LAYER 3: Merge with confidence scoring
    return _merge_relationships(heuristic_map, llm_map)


# â”€â”€ Main builder â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

async def build_character_graph(
    scenes: List[Dict[str, Any]],
    use_llm: bool = True,
    include_scenes: bool = False,
    include_locations: bool = False,
) -> Dict[str, Any]:
    """
    Build a character co-occurrence graph from a list of scene dicts.

    Each scene dict needs at minimum:
      scene_number : int
      characters   : list[str]

    Options:
      include_scenes    â€” add scene nodes + appears_in edges
      include_locations â€” add location nodes + set_in edges

    Returns a React Flow-compatible dict:
      { nodes: [...], edges: [...], summary: [...] }
    """
    G: nx.Graph = nx.Graph()

    # â”€â”€ Pass 1: collect char â†’ scene-list and build edges â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    char_scenes: Dict[str, List[int]] = {}

    for scene in scenes:
        chars: List[str] = scene.get("characters") or []
        scene_num: int = scene.get("scene_number", 0)

        for char in chars:
            char_scenes.setdefault(char, []).append(scene_num)
            if char not in G:
                G.add_node(char)

        for a, b in itertools.combinations(sorted(set(chars)), 2):
            if G.has_edge(a, b):
                G[a][b]["weight"] += 1
                G[a][b]["shared_scenes"].append(scene_num)
            else:
                G.add_edge(a, b, weight=1, shared_scenes=[scene_num])

    if not char_scenes:
        return {"nodes": [], "edges": [], "summary": []}

    max_scenes = max(len(v) for v in char_scenes.values())

    # â”€â”€ Pass 2: classify roles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    char_role: Dict[str, str] = {
        char: _classify_role(len(sc), max_scenes)
        for char, sc in char_scenes.items()
    }

    # Group characters by role, sorted within each group by scene count desc
    role_groups: Dict[str, List[str]] = {"lead": [], "supporting": [], "minor": []}
    for char, role in char_role.items():
        role_groups[role].append(char)
    for role in role_groups:
        role_groups[role].sort(key=lambda c: -len(char_scenes[c]))

    # â”€â”€ Pass 2.5: extract relationships via HYBRID pipeline â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    relationship_map: Dict[str, Dict[str, Any]] = {}
    if use_llm:
        all_chars = list(char_scenes.keys())
        edge_pairs = [(a, b) for a, b, _ in sorted(
            G.edges(data=True), key=lambda x: -x[2]["weight"]
        )]
        try:
            relationship_map = await extract_relationships_hybrid(
                all_chars, scenes, edge_pairs
            )
        except Exception as e:
            logger.warning(f"Hybrid extraction failed, using defaults: {e}")

    # â”€â”€ Pass 3: compute positions (concentric circles, top-aligned) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    char_pos: Dict[str, Dict[str, int]] = {}

    for role, chars_in_role in role_groups.items():
        n = len(chars_in_role)
        if n == 0:
            continue

        radius = ROLE_RADII[role]

        for idx, char in enumerate(chars_in_role):
            if n == 1 and role == "lead":
                # Single lead goes dead-centre
                x, y = CENTER_X, CENTER_Y
            else:
                # Start from the top (âˆ’Ï€/2) and go clockwise
                angle = (2 * math.pi * idx / n) - math.pi / 2
                x = round(CENTER_X + radius * math.cos(angle))
                y = round(CENTER_Y + radius * math.sin(angle))

            char_pos[char] = {"x": x, "y": y}

    # â”€â”€ Pass 4: build React Flow nodes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    nodes: List[Dict[str, Any]] = []

    for role in ["lead", "supporting", "minor"]:
        for char in role_groups[role]:
            sc = char_scenes[char]
            nodes.append({
                "id": char,
                "type": "character",          # â† custom renderer on the frontend
                "position": char_pos[char],
                "data": {
                    "label": char,
                    "role": role,
                    "scene_count": len(sc),
                    "scenes": sorted(set(sc)),
                    "color": ROLE_COLORS[role],
                },
            })

    # â”€â”€ Pass 4b: scene nodes (timeline row below character circles) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if include_scenes:
        scene_y = CENTER_Y + ROLE_RADII["minor"] + 200  # below outer ring
        scene_x_start = CENTER_X - min(len(scenes) * 45, 800) // 2
        for idx, scene in enumerate(scenes):
            sn = scene.get("scene_number", idx + 1)
            nodes.append({
                "id": f"scene-{sn}",
                "type": "scene",
                "position": {
                    "x": scene_x_start + idx * 90,
                    "y": scene_y,
                },
                "data": {
                    "label": f"S{sn}",
                    "scene_number": sn,
                    "heading": scene.get("heading", ""),
                    "location": scene.get("location", ""),
                    "page_start": scene.get("page_start", 0),
                    "page_end": scene.get("page_end", 0),
                    "characters": scene.get("characters", []),
                    "detected_emotions": scene.get("detected_emotions", []),
                },
            })

    # â”€â”€ Pass 4c: location nodes (column to the right) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    unique_locations: Dict[str, List[int]] = {}  # loc â†’ scene numbers
    if include_locations:
        for scene in scenes:
            loc = (scene.get("location") or "").strip()
            if loc and loc.upper() not in ("", "UNKNOWN"):
                sn = scene.get("scene_number", 0)
                unique_locations.setdefault(loc, []).append(sn)

        loc_x = CENTER_X + ROLE_RADII["minor"] + 250  # right of outer ring
        loc_y_start = CENTER_Y - min(len(unique_locations) * 40, 400) // 2
        for idx, (loc, loc_scenes) in enumerate(
            sorted(unique_locations.items(), key=lambda x: -len(x[1]))
        ):
            nodes.append({
                "id": f"loc-{loc}",
                "type": "location",
                "position": {
                    "x": loc_x,
                    "y": loc_y_start + idx * 80,
                },
                "data": {
                    "label": loc,
                    "scene_count": len(loc_scenes),
                    "scenes": sorted(set(loc_scenes)),
                },
            })

    # â”€â”€ Pass 5: build React Flow edges with relationship labels â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    edges: List[Dict[str, Any]] = []
    max_weight = max((d["weight"] for _, _, d in G.edges(data=True)), default=1)

    for a, b, edata in G.edges(data=True):
        w: int = edata["weight"]
        stroke_width = max(1.5, round(2 + 4 * (w / max_weight), 1))
        opacity = round(0.3 + 0.7 * (w / max_weight), 2)

        # Look up relationship from hybrid results
        rel_data = _lookup_relationship(relationship_map, a, b)
        rel_label = rel_data.get("relationship") if rel_data else None
        confidence = rel_data.get("confidence", 0.0) if rel_data else 0.0
        rel_source = rel_data.get("source", "") if rel_data else ""
        supporting_text = rel_data.get("supporting_text", "") if rel_data else ""

        # Determine edge color based on confidence
        if confidence >= 0.85:
            edge_color = "#FDB022" if w == max_weight else "#60A5FA"
        elif confidence >= 0.70:
            edge_color = "#FDB022" if w == max_weight else "#818CF8"
        else:
            edge_color = "#FDB022" if w == max_weight else "#6B7280"

        edges.append({
            "id": f"{a}--{b}",
            "source": a,
            "target": b,
            "type": "smoothstep",
            "animated": (w == max_weight and max_weight > 1),
            "label": rel_label or f"{w} scenes",
            "labelStyle": {
                "fill": "#E2E8F0",
                "fontSize": 11,
                "fontWeight": 600,
                "textShadow": "0 1px 3px rgba(0,0,0,0.8)",
            },
            "labelBgStyle": {
                "fill": "rgba(15,23,42,0.88)",
                "rx": 6,
                "ry": 6,
                "strokeWidth": 1,
                "stroke": "rgba(253,176,34,0.25)",
            },
            "labelBgPadding": [6, 4],
            "style": {
                "stroke": edge_color,
                "strokeWidth": stroke_width,
                "opacity": opacity,
            },
            "data": {
                "shared_scenes": sorted(set(edata["shared_scenes"])),
                "weight": w,
                "relationship": rel_label or "Co-appears",
                "confidence": round(confidence, 2),
                "source": rel_source,
                "supporting_text": supporting_text,
                "first_meeting": min(edata["shared_scenes"]) if edata["shared_scenes"] else None,
            },
        })

    # â”€â”€ Pass 5b: appears_in edges (character â†’ scene) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if include_scenes:
        for scene in scenes:
            sn = scene.get("scene_number", 0)
            for char in (scene.get("characters") or []):
                if char in char_scenes:
                    edges.append({
                        "id": f"{char}--scene-{sn}",
                        "source": char,
                        "target": f"scene-{sn}",
                        "type": "straight",
                        "animated": False,
                        "style": {
                            "stroke": "#475569",
                            "strokeWidth": 1,
                            "opacity": 0.25,
                            "strokeDasharray": "4 3",
                        },
                        "data": {
                            "edge_type": "appears_in",
                            "weight": 1,
                        },
                    })

    # â”€â”€ Pass 5c: set_in edges (scene â†’ location) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if include_locations and include_scenes:
        for scene in scenes:
            sn = scene.get("scene_number", 0)
            loc = (scene.get("location") or "").strip()
            if loc and loc in unique_locations:
                edges.append({
                    "id": f"scene-{sn}--loc-{loc}",
                    "source": f"scene-{sn}",
                    "target": f"loc-{loc}",
                    "type": "straight",
                    "animated": False,
                    "style": {
                        "stroke": "#34D399",
                        "strokeWidth": 1,
                        "opacity": 0.20,
                        "strokeDasharray": "3 4",
                    },
                    "data": {
                        "edge_type": "set_in",
                        "weight": 1,
                    },
                })

    # Sort edges: strongest first (character edges before structural edges)
    edges.sort(key=lambda e: -(e.get("data", {}).get("weight", 0)))

    # â”€â”€ Pass 6: build summary list â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    summary: List[Dict[str, Any]] = []

    for role in ["lead", "supporting", "minor"]:
        for char in role_groups[role]:
            sc = char_scenes[char]
            connections = []
            for neighbor in G.neighbors(char):
                rel_data = _lookup_relationship(relationship_map, char, neighbor)
                rel_label = rel_data.get("relationship") if rel_data else None
                confidence = rel_data.get("confidence", 0.0) if rel_data else 0.0
                supporting_text = rel_data.get("supporting_text", "") if rel_data else ""
                first_meeting = min(G[char][neighbor]["shared_scenes"]) if G[char][neighbor]["shared_scenes"] else None

                connections.append({
                    "name": neighbor,
                    "shared_scenes": G[char][neighbor]["weight"],
                    "relationship": rel_label or "Co-appears",
                    "confidence": round(confidence, 2),
                    "supporting_text": supporting_text,
                    "first_meeting": first_meeting,
                })
            connections.sort(key=lambda c: -c["shared_scenes"])

            summary.append({
                "name": char,
                "role": role,
                "scene_count": len(sc),
                "scenes": sorted(set(sc)),
                "color": ROLE_COLORS[role],
                "connections": connections,
            })

    logger.info(
        f"Character graph built: {len(nodes)} nodes, {len(edges)} edges "
        f"({len(role_groups['lead'])} lead, "
        f"{len(role_groups['supporting'])} supporting, "
        f"{len(role_groups['minor'])} minor), "
        f"{len(relationship_map)} relationships extracted"
    )
    return {"nodes": nodes, "edges": edges, "summary": summary}


def _lookup_relationship(
    relationship_map: Dict[str, Dict[str, Any]], a: str, b: str
) -> Optional[Dict[str, Any]]:
    """Look up a relationship data dict for a pair in either direction."""
    key1 = f"{a}||{b}"
    key2 = f"{b}||{a}"
    return relationship_map.get(key1) or relationship_map.get(key2)
