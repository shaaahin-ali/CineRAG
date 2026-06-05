"""
Malayalam Emotion Detector — identifies emotions in Malayalam screenplay text
with cultural nuance specific to Mollywood narrative traditions.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List

logger = logging.getLogger(__name__)


class MalayalamEmotionDetector:
    """
    Detect emotions in Malayalam and mixed-language screenplay text.
    Uses a curated Malayalam-cinema-specific emotion lexicon.
    """

    # ── Full Malayalam emotion lexicon ─────────────────────────────────────────
    # Maps Malayalam word → {emotion, intensity 0-1, type, cultural_context}
    EMOTION_LEXICON: Dict[str, Dict[str, Any]] = {
        # Primary emotions
        "പ്രണയം": {
            "emotion": "love",
            "intensity": 0.9,
            "type": "romantic",
            "cultural_context": "Romantic love, often tinged with tragedy in Mollywood",
        },
        "സ്നേഹം": {
            "emotion": "love",
            "intensity": 0.8,
            "type": "familial",
            "cultural_context": "Familial love, bonds between relatives",
        },
        "വിയോഗം": {
            "emotion": "separation",
            "intensity": 0.85,
            "type": "loss",
            "cultural_context": "Viyogam — poignant separation, foundational Mollywood theme",
        },
        "ത്യാഗം": {
            "emotion": "sacrifice",
            "intensity": 0.9,
            "type": "renunciation",
            "cultural_context": "Thyagam — culturally prized renunciation for greater good",
        },
        "സംഘർഷം": {
            "emotion": "conflict",
            "intensity": 0.85,
            "type": "struggle",
            "cultural_context": "Internal or external conflict, social struggle",
        },
        "സങ്കടം": {
            "emotion": "sadness",
            "intensity": 0.75,
            "type": "grief",
            "cultural_context": "Sorrow, often expressed with restraint",
        },
        "സന്തോഷം": {
            "emotion": "joy",
            "intensity": 0.8,
            "type": "happiness",
            "cultural_context": "Happiness, often bittersweet in Mollywood",
        },
        "കോപം": {
            "emotion": "anger",
            "intensity": 0.8,
            "type": "rage",
            "cultural_context": "Anger, often suppressed then explosive",
        },
        "ഭയം": {
            "emotion": "fear",
            "intensity": 0.75,
            "type": "dread",
            "cultural_context": "Fear, dread of loss or confrontation",
        },
        "ലജ്ജ": {
            "emotion": "shame",
            "intensity": 0.7,
            "type": "social",
            "cultural_context": "Social shame, family honor concerns",
        },

        # Nuanced Malayalam emotions (no direct English equivalent)
        "കാതരം": {
            "emotion": "longing",
            "intensity": 0.8,
            "type": "yearning",
            "cultural_context": "Katharam — deep yearning, poetic longing in Malayalam literature",
        },
        "മോഹം": {
            "emotion": "desire",
            "intensity": 0.7,
            "type": "attachment",
            "cultural_context": "Desire, worldly attachment",
        },
        "ബാധ": {
            "emotion": "distress",
            "intensity": 0.8,
            "type": "suffering",
            "cultural_context": "Suffering, being haunted",
        },
        "അരുണോദയം": {
            "emotion": "hope",
            "intensity": 0.65,
            "type": "new_beginning",
            "cultural_context": "Dawn/new beginning — quiet optimism",
        },
        "സന്ധ്യ": {
            "emotion": "melancholy",
            "intensity": 0.6,
            "type": "twilight",
            "cultural_context": "Twilight melancholy — common atmospheric mood in Mollywood",
        },
        "വിജയം": {
            "emotion": "triumph",
            "intensity": 0.85,
            "type": "victory",
            "cultural_context": "Triumph, often hard-won after sacrifice",
        },
        "ദുഃഖം": {
            "emotion": "grief",
            "intensity": 0.9,
            "type": "deep_sorrow",
            "cultural_context": "Deep grief, bereavement",
        },
        "അഭിമാനം": {
            "emotion": "pride",
            "intensity": 0.7,
            "type": "dignity",
            "cultural_context": "Self-respect, family pride — crucial in Kerala social context",
        },
        "ഏകാന്തം": {
            "emotion": "solitude",
            "intensity": 0.65,
            "type": "isolation",
            "cultural_context": "Aloneness — philosophical isolation common in art house Mollywood",
        },
        "പ്രതീക്ഷ": {
            "emotion": "hope",
            "intensity": 0.7,
            "type": "expectation",
            "cultural_context": "Hope and expectation despite hardship",
        },
    }

    # ── Cultural narrative beats ───────────────────────────────────────────────
    NARRATIVE_BEATS = {
        "love": "romantic_arc",
        "separation": "viyoga_vedana",  # Separation pain — classic Mollywood beat
        "sacrifice": "thyaga_moment",
        "conflict": "sangharsha_peak",
        "grief": "tragedy_beat",
        "hope": "prateesha_moment",
        "triumph": "vijaya_beat",
    }

    def detect_emotions(self, text: str) -> Dict[str, Any]:
        """
        Detect Malayalam emotions in screenplay text.

        Returns:
        {
            primary_emotions: [{"emotion", "intensity", "type", "ml_word", "cultural_context"}],
            secondary_emotions: [...],
            intensity_score: float,
            cultural_nuance: str,
            narrative_beat: str
        }
        """
        detected: Dict[str, Any] = {
            "primary_emotions": [],
            "secondary_emotions": [],
            "intensity_score": 0.0,
            "cultural_nuance": "",
            "narrative_beat": "",
        }

        for ml_word, data in self.EMOTION_LEXICON.items():
            if ml_word in text:
                emotion_entry = {
                    "emotion": data["emotion"],
                    "intensity": data["intensity"],
                    "type": data["type"],
                    "ml_word": ml_word,
                    "cultural_context": data["cultural_context"],
                }

                if data["intensity"] >= 0.8:
                    detected["primary_emotions"].append(emotion_entry)
                else:
                    detected["secondary_emotions"].append(emotion_entry)

        all_emotions = detected["primary_emotions"] + detected["secondary_emotions"]
        if all_emotions:
            detected["intensity_score"] = sum(e["intensity"] for e in all_emotions) / len(all_emotions)

            # Primary narrative beat (highest intensity)
            strongest = max(all_emotions, key=lambda e: e["intensity"])
            emotion_name = strongest["emotion"]
            detected["cultural_nuance"] = strongest["cultural_context"]
            detected["narrative_beat"] = self.NARRATIVE_BEATS.get(emotion_name, "general_beat")

        return detected

    def get_scene_emotion_summary(self, scenes: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Summarize emotional arc across all scenes."""
        arc: List[Dict[str, Any]] = []
        for scene in scenes:
            emotions = self.detect_emotions(scene.get("content", ""))
            arc.append({
                "scene_number": scene.get("scene_number"),
                "primary": emotions["primary_emotions"][:2],
                "intensity": emotions["intensity_score"],
                "beat": emotions["narrative_beat"],
            })

        return {
            "total_scenes": len(scenes),
            "emotional_arc": arc,
            "dominant_emotion": self._find_dominant_emotion(arc),
        }

    def _find_dominant_emotion(self, arc: List[Dict[str, Any]]) -> str:
        counts: Dict[str, int] = {}
        for scene in arc:
            for e in scene.get("primary", []):
                counts[e["emotion"]] = counts.get(e["emotion"], 0) + 1
        if not counts:
            return "neutral"
        return max(counts, key=lambda k: counts[k])
