"""
Malayalam Screenplay Parser — Unicode normalization + Malayalam-aware scene detection.
Uses indic-nlp-library for proper Malayalam text handling.
"""

import logging
import unicodedata
from typing import Any, Dict, List

import regex as re
from unidecode import unidecode

logger = logging.getLogger(__name__)

# Try to import indic_nlp; fall back gracefully if not yet installed
try:
    from indicnlp.normalize.indic_normalize import IndicNormalizerFactory

    _factory = IndicNormalizerFactory()
    _normalizer = _factory.get_normalizer("ml")
    INDIC_NLP_AVAILABLE = True
except ImportError:
    _normalizer = None
    INDIC_NLP_AVAILABLE = False
    logger.warning(
        "indic-nlp-library not available. Malayalam normalization will use basic Unicode. "
        "Run: pip install indic-nlp-library"
    )


# ── Malayalam script Unicode range ────────────────────────────────────────────
MALAYALAM_UNICODE_RANGE = re.compile(r"[\u0D00-\u0D7F]")

# ── Scene heading patterns (English + Malayalam) ──────────────────────────────
ENGLISH_SCENE_PATTERN = re.compile(
    r"^(INT\.|EXT\.|INT/EXT\.)\s+(.+?)\s*[-–]\s*(.+)$",
    re.MULTILINE | re.IGNORECASE,
)

# Malayalam scene patterns (ഉൾ = interior, പുറ = exterior)
MALAYALAM_SCENE_PATTERN = re.compile(
    r"^(\d+)\.\s+(ഉൾ\.|പുറ\.|ഉൾ/പുറ\.)\s+(.+)",
    re.MULTILINE | re.UNICODE,
)

# Malayalam "Location:" / "Time:" patterns
ML_LOCATION_PATTERN = re.compile(r"സ്ഥലം\s*[:=]\s*(.+)", re.UNICODE)
ML_TIME_PATTERN = re.compile(r"കാലം\s*[:=]\s*(.+)", re.UNICODE)
ML_CHARACTERS_PATTERN = re.compile(r"കഥാപാത്രങ്ങൾ\s*[:=]\s*(.+)", re.UNICODE)

# Character name detection (ALL CAPS lines)
CHARACTER_NAME_PATTERN = re.compile(r"^([A-Z][A-Z\s'.-]{1,30})$", re.MULTILINE)

# Malayalam emotion markers for scene annotation
MALAYALAM_EMOTION_MARKERS = {
    "സങ്കടം": "sadness",
    "സന്തോഷം": "joy",
    "കോപം": "anger",
    "ഭയം": "fear",
    "സ്നേഹം": "love",
    "പ്രണയം": "love",
    "ത്യാഗം": "sacrifice",
    "വിയോഗം": "separation",
    "സംഘർഷം": "conflict",
    "വിജയം": "triumph",
    "കാതരം": "longing",
    "മോഹം": "desire",
}


class MalayalamScreenplayParser:
    """
    Parse Malayalam and mixed-language screenplays.
    Handles:
    - Malayalam Unicode normalization
    - Mixed-language scene headings (English INT./EXT. + Malayalam text)
    - Malayalam-only scene headings
    - Emotion marker extraction
    """

    def normalize_malayalam_text(self, text: str) -> str:
        """
        Normalize Malayalam text:
        1. Unicode NFC normalization (handles diacritic variations)
        2. Indic-NLP normalization if available
        """
        # NFC normalize
        normalized = unicodedata.normalize("NFC", text)

        # Indic NLP normalization
        if INDIC_NLP_AVAILABLE and _normalizer:
            try:
                normalized = _normalizer.normalize(normalized)
            except Exception as e:
                logger.debug(f"Indic normalization skipped: {e}")

        return normalized

    def contains_malayalam(self, text: str) -> bool:
        """Check if text contains Malayalam Unicode characters."""
        return bool(MALAYALAM_UNICODE_RANGE.search(text))

    def extract_characters_from_scene(self, content: str) -> List[str]:
        """
        Extract character names from scene content.
        Detects ALL CAPS names (standard screenplay format).
        """
        chars = CHARACTER_NAME_PATTERN.findall(content)
        # Filter common false positives
        stopwords = {"INT", "EXT", "INT/EXT", "FADE", "CUT", "DISSOLVE", "THE", "AND"}
        return list({
            c.strip()
            for c in chars
            if c.strip() and c.strip() not in stopwords and len(c.strip()) > 1
        })

    def extract_ml_metadata(self, text: str) -> Dict[str, Any]:
        """Extract Malayalam-specific metadata from scene text."""
        meta: Dict[str, Any] = {}

        loc_match = ML_LOCATION_PATTERN.search(text)
        if loc_match:
            meta["location_ml"] = loc_match.group(1).strip()

        time_match = ML_TIME_PATTERN.search(text)
        if time_match:
            meta["time_of_day_ml"] = time_match.group(1).strip()

        char_match = ML_CHARACTERS_PATTERN.search(text)
        if char_match:
            meta["characters_ml"] = [c.strip() for c in char_match.group(1).split(",")]

        # Emotion markers
        emotions = [
            eng for ml_word, eng in MALAYALAM_EMOTION_MARKERS.items() if ml_word in text
        ]
        if emotions:
            meta["emotion_markers"] = emotions

        return meta

    def parse_ml_scene_heading(self, line: str) -> Dict[str, Any] | None:
        """Parse a Malayalam scene heading if detected."""
        match = MALAYALAM_SCENE_PATTERN.match(line)
        if not match:
            return None

        int_ext_ml = match.group(2)
        int_ext_map = {"ഉൾ.": "INT", "പുറ.": "EXT", "ഉൾ/പുറ.": "INT/EXT"}

        return {
            "scene_number": int(match.group(1)),
            "int_ext": int_ext_map.get(int_ext_ml, "INT"),
            "heading": match.group(3).strip(),
        }
