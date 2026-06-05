"""
Malayalam Query Processor — language detection and query expansion
for better retrieval from Malayalam and English screenplay queries.
"""

from __future__ import annotations

import logging
from typing import Any, Dict

logger = logging.getLogger(__name__)

# Try langdetect; graceful fallback to simple Unicode check
try:
    from langdetect import DetectorFactory, detect

    DetectorFactory.seed = 42  # Deterministic results
    LANGDETECT_AVAILABLE = True
except ImportError:
    LANGDETECT_AVAILABLE = False
    logger.warning("langdetect not available. Using Unicode-based language detection.")

# Malayalam film terminology (for query expansion)
FILM_TERMS_ML: Dict[str, str] = {
    "കഥ": "story plot narrative",
    "കഥാപാത്രം": "character protagonist role",
    "സിനിമ": "film movie screenplay",
    "രംഗം": "scene sequence",
    "സംഭാഷണം": "dialogue conversation",
    "ഗാനം": "song music score",
    "സംഘർഷം": "conflict tension climax",
    "പ്രണയം": "love romance relationship",
    "കുടുംബം": "family home domestic",
    "കേരളം": "Kerala location setting",
    "മഴ": "rain monsoon weather",
    "വീട്": "house home interior",
    "നദി": "river water backwater",
    "രാത്രി": "night exterior darkness",
    "പകൽ": "day daylight exterior",
    "നഗരം": "city urban location",
    "ഗ്രാമം": "village rural exterior",
    "ആശുപത്രി": "hospital interior",
    "ക്ഷേത്രം": "temple religious interior",
    "സ്കൂൾ": "school interior",
}

# Malayalam query templates → English equivalent for better embedding
QUERY_EXPANSION_MAP: Dict[str, str] = {
    "കഥാപാത്രത്തിന്റെ വികാസം": "character arc development journey",
    "പ്രണയ വേദന": "love pain heartbreak emotional",
    "കുടുംബ സംഘർഷം": "family conflict tension dynamics",
    "മഴക്കാലം": "monsoon rain season",
    "ക്ലൈമാക്സ്": "climax peak confrontation resolution",
    "ഫ്ലാഷ്ബാക്ക്": "flashback memory past",
    "ആദ്യ രംഗം": "opening scene first sequence introduction",
    "അവസാന രംഗം": "final scene ending conclusion",
}


def _unicode_is_malayalam(text: str) -> bool:
    """Fallback: detect Malayalam by Unicode range."""
    ml_chars = sum(1 for c in text if "\u0D00" <= c <= "\u0D7F")
    return ml_chars / max(len(text), 1) > 0.1  # >10% Malayalam chars


def detect_language(text: str) -> str:
    """
    Detect if the query is in Malayalam ('ml') or English ('en').
    Returns ISO 639-1 language code.
    """
    if LANGDETECT_AVAILABLE:
        try:
            lang = detect(text)
            return lang
        except Exception:
            pass
    # Fallback to Unicode check
    return "ml" if _unicode_is_malayalam(text) else "en"


class MalayalamQueryProcessor:
    """Process queries for Malayalam-aware RAG retrieval."""

    def expand_malayalam_query(self, query: str) -> str:
        """
        Expand a Malayalam query with English equivalents for better embedding.
        This improves retrieval since the screenplay content may be in English.
        """
        expanded = query

        # Add term expansions
        for ml_term, english_equiv in FILM_TERMS_ML.items():
            if ml_term in query:
                expanded += f" {english_equiv}"

        # Add phrase expansions
        for ml_phrase, english_phrase in QUERY_EXPANSION_MAP.items():
            if ml_phrase in query:
                expanded += f" {english_phrase}"

        return expanded.strip()

    def process_query(self, query: str) -> Dict[str, Any]:
        """
        Full query processing pipeline.

        Returns:
        {
            original_query: str,
            detected_language: str,   # 'ml' or 'en'
            expanded_query: str,      # query + English term expansions
            is_malayalam: bool,
            film_terms_found: [str],  # Malayalam film terms detected
        }
        """
        detected_lang = detect_language(query)
        is_malayalam = detected_lang == "ml"

        expanded = self.expand_malayalam_query(query) if is_malayalam else query

        found_terms = [term for term in FILM_TERMS_ML if term in query]

        return {
            "original_query": query,
            "detected_language": detected_lang,
            "expanded_query": expanded,
            "is_malayalam": is_malayalam,
            "film_terms_found": found_terms,
        }
