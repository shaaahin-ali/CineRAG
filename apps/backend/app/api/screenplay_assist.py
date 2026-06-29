"""
Screenplay Assist API — AI-powered screenplay generation from story ideas.

Route:
  POST /api/v1/screenplay/assist
    Body: { story_idea, characters, genre, language, tone }
    Returns: { title, logline, screenplay }

LLM cascade (best-first for creative writing):
  1. Anthropic Claude (best for long-form creative prose)
  2. Groq llama-3.3-70b-versatile (free, high quality)
  3. OpenRouter (free fallback)
  4. Gemini (last resort)

Stateless — no DB writes. The frontend downloads the result as a PDF.
"""

from __future__ import annotations

import logging
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from app.core.security import extract_token

logger = logging.getLogger(__name__)
router = APIRouter()


# ── Request / Response models ─────────────────────────────────────────────────

class CharacterEntry(BaseModel):
    name: str
    description: str = ""


class ScreenplayAssistRequest(BaseModel):
    story_idea: str
    characters: List[CharacterEntry] = []
    genre: str = "drama"
    language: str = "english"
    tone: str = "cinematic"  # cinematic | dark | lighthearted | epic | intimate


class ScreenplayAssistResponse(BaseModel):
    title: str
    logline: str
    screenplay: str


# ── Master Prompt ─────────────────────────────────────────────────────────────

_GENRE_PALETTE = {
    "drama":     "emotionally layered, grounded in human truth, character-driven",
    "thriller":  "taut, psychological, mounting dread, twist-laden",
    "romance":   "emotionally resonant, longing and tension, intimate moments",
    "action":    "kinetic, visceral, high stakes, propulsive",
    "comedy":    "sharp wit, comedic timing, subverted expectations",
    "horror":    "atmospheric dread, unsettling imagery, primal fear",
    "biopic":    "historically grounded, intimate and epic in equal measure",
    "mystery":   "layered clues, unreliable perception, satisfying revelation",
}

_TONE_NOTES = {
    "cinematic":    "Write with visual economy — every scene must be filmable. Prioritize strong imagery over exposition.",
    "dark":         "Lean into moral ambiguity, shadow, and psychological complexity. Nothing is clean or simple.",
    "lighthearted": "Keep it warm and accessible. Humour arises naturally from character, not from jokes.",
    "epic":         "Grand in scope. Each scene contributes to a sweeping, larger-than-life narrative.",
    "intimate":     "Small moments carry enormous weight. Silence and subtext do more work than dialogue.",
}


def _build_master_prompt(
    story_idea: str,
    characters: List[CharacterEntry],
    genre: str,
    language: str,
    tone: str,
) -> str:
    genre_desc = _GENRE_PALETTE.get(genre.lower(), _GENRE_PALETTE["drama"])
    tone_note  = _TONE_NOTES.get(tone.lower(), _TONE_NOTES["cinematic"])
    lang_upper = language.upper()

    char_block = ""
    if characters:
        lines = []
        for c in characters:
            desc = f" — {c.description}" if c.description else ""
            lines.append(f"  • {c.name.upper()}{desc}")
        char_block = "CHARACTERS:\n" + "\n".join(lines) + "\n\n"

    return f"""You are one of the greatest living screenwriters — a master of structure, voice, and cinematic language. You have studied the works of Padmarajan, Fazil, and Lohithadas; of Nolan, Tarantino, and Sorkin. You write screenplays that feel inevitable — where every line of dialogue reveals character, every action pushes the story forward, and every scene earns its place.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOUR TASK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Transform the following raw story idea into a complete, properly formatted screenplay. Think deeply about structure (three-act or five-act), dramatic tension, and character arcs BEFORE you begin writing.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STORY BRIEF
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{char_block}GENRE: {genre.upper()} — {genre_desc}
TONE: {tone.upper()} — {tone_note}

STORY IDEA:
{story_idea.strip()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCREENPLAY FORMAT RULES (MANDATORY)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Use STRICT Hollywood/Bollywood industry-standard screenplay format:

1. TITLE PAGE — Title in ALL CAPS, centered, followed by "Written by [AI Assistant]"

2. SCENE HEADINGS — Always: INT./EXT. LOCATION — TIME
   Example: INT. ABANDONED FACTORY - NIGHT

3. ACTION LINES — Present tense, third person. No "we see" or "the camera". Show, don't tell.
   Maximum 4 lines per action block. Use white space liberally.

4. CHARACTER CUE — Character name in ALL CAPS, centered, before dialogue.

5. PARENTHETICALS — Sparingly, only when essential to performance.
   Example: (barely audible)

6. DIALOGUE — Natural, subtext-laden. People rarely say what they mean.
   Each speech block max 5-7 lines.

7. TRANSITIONS — Only FADE IN:, FADE OUT., CUT TO:, SMASH CUT TO: when dramatically motivated.

8. PAGE BREAKS — Use === SCENE BREAK === between scenes for clarity.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL QUALITY RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✦ Write at minimum 8-15 complete scenes (more for epic/complex stories)
✦ Every scene must have a clear GOAL, CONFLICT, and OUTCOME
✦ Characters must WANT something in every scene, even if it's small
✦ Use SUBTEXT — what characters don't say is as important as what they do
✦ The INCITING INCIDENT must occur by scene 3
✦ Build to a clear CLIMAX and satisfying RESOLUTION
✦ Write ALL dialogue in fluent, natural {lang_upper}
✦ Action lines may be in English regardless of language setting
✦ DO NOT summarize or skip scenes — write them fully

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT — STRICT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Start with this EXACT header block (fill in the blanks):

TITLE: [YOUR TITLE IN CAPS]
LOGLINE: [One sentence. Protagonist + Goal + Obstacle + Stakes. Max 40 words.]
---
[FULL SCREENPLAY BELOW]

Then write the complete screenplay. Do not add any commentary, explanation, or notes after the screenplay. End with FADE OUT."""


# ── LLM cascade (best-first for creative writing) ─────────────────────────────

async def _call_best_llm(prompt: str) -> str:
    """
    Cascade: Anthropic Claude → Groq llama-3.3-70b → OpenRouter → Gemini.
    Anthropic Claude is prioritized because it produces the highest quality
    long-form creative prose with accurate format adherence.
    """
    from app.core.config import settings
    from openai import AsyncOpenAI

    # ── 1. Anthropic Claude (best for long creative writing) ──────────────────
    if settings.ANTHROPIC_API_KEY:
        try:
            import anthropic as _ant
            ac = _ant.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
            resp = await ac.messages.create(
                model=settings.ANTHROPIC_MODEL,
                max_tokens=8000,
                messages=[{"role": "user", "content": prompt}],
            )
            text = resp.content[0].text.strip()  # type: ignore[union-attr]
            if text and len(text) > 500:
                logger.info(f"[screenplay_assist] ✓ Anthropic/{settings.ANTHROPIC_MODEL} — {len(text)} chars")
                return text
        except Exception as e:
            logger.warning(f"[screenplay_assist] Anthropic failed: {e}")

    # ── 2. Groq llama-3.3-70b-versatile (free, very high quality) ────────────
    if settings.GROQ_API_KEY:
        try:
            client = AsyncOpenAI(
                api_key=settings.GROQ_API_KEY,
                base_url="https://api.groq.com/openai/v1",
            )
            resp = await client.chat.completions.create(
                model=settings.GROQ_QUALITY_MODEL,
                max_tokens=8000,
                temperature=0.82,
                messages=[{"role": "user", "content": prompt}],
            )
            text = (resp.choices[0].message.content or "").strip()
            if text and len(text) > 500:
                logger.info(f"[screenplay_assist] ✓ Groq/{settings.GROQ_QUALITY_MODEL} — {len(text)} chars")
                return text
        except Exception as e:
            logger.warning(f"[screenplay_assist] Groq failed: {e}")

    # ── 3. OpenRouter (free fallback) ─────────────────────────────────────────
    if settings.OPENROUTER_API_KEY:
        client = AsyncOpenAI(
            api_key=settings.OPENROUTER_API_KEY,
            base_url="https://openrouter.ai/api/v1",
        )
        models = list(dict.fromkeys([settings.OPENROUTER_CHAT_MODEL, *settings.OPENROUTER_FALLBACK_MODELS]))
        for model in models:
            try:
                resp = await client.chat.completions.create(
                    model=model,
                    max_tokens=8000,
                    temperature=0.82,
                    messages=[{"role": "user", "content": prompt}],
                )
                text = (resp.choices[0].message.content or "").strip()
                if text and len(text) > 500:
                    logger.info(f"[screenplay_assist] ✓ OpenRouter/{model} — {len(text)} chars")
                    return text
            except Exception as e:
                logger.warning(f"[screenplay_assist] OpenRouter/{model}: {e}")

    # ── 4. Gemini (last resort) ───────────────────────────────────────────────
    if settings.GEMINI_API_KEY:
        try:
            client = AsyncOpenAI(
                api_key=settings.GEMINI_API_KEY,
                base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
            )
            resp = await client.chat.completions.create(
                model="gemini-1.5-pro",
                max_tokens=8000,
                temperature=0.82,
                messages=[{"role": "user", "content": prompt}],
            )
            text = (resp.choices[0].message.content or "").strip()
            if text and len(text) > 500:
                logger.info(f"[screenplay_assist] ✓ Gemini — {len(text)} chars")
                return text
        except Exception as e:
            logger.warning(f"[screenplay_assist] Gemini failed: {e}")

    return ""


# ── Parse LLM output ──────────────────────────────────────────────────────────

def _parse_screenplay_output(raw: str) -> tuple[str, str, str]:
    """
    Extract title, logline, and screenplay body from the LLM response.
    Returns (title, logline, screenplay).
    """
    import re
    title = "Untitled"
    logline = ""
    screenplay = raw

    # Extract TITLE:
    title_match = re.search(r"^TITLE:\s*(.+)$", raw, re.MULTILINE | re.IGNORECASE)
    if title_match:
        title = title_match.group(1).strip().strip('"')

    # Extract LOGLINE:
    logline_match = re.search(r"^LOGLINE:\s*(.+)$", raw, re.MULTILINE | re.IGNORECASE)
    if logline_match:
        logline = logline_match.group(1).strip()

    # Screenplay body starts after the --- separator
    sep_idx = raw.find("---")
    if sep_idx != -1:
        screenplay = raw[sep_idx + 3:].strip()
    else:
        # Fallback: body starts after LOGLINE line
        if logline_match:
            screenplay = raw[logline_match.end():].strip()

    return title, logline, screenplay


# ── Route ─────────────────────────────────────────────────────────────────────

@router.post(
    "/screenplay/assist",
    response_model=ScreenplayAssistResponse,
)
async def generate_screenplay(
    request: Request,
    body: ScreenplayAssistRequest,
) -> ScreenplayAssistResponse:
    """
    Generate a complete, properly formatted screenplay from a raw story idea.
    Uses the best available LLM (Claude > Groq > OpenRouter > Gemini).
    Stateless — caller downloads the result as a PDF.
    """
    token = extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    if not body.story_idea or len(body.story_idea.strip()) < 20:
        raise HTTPException(
            status_code=400,
            detail="Please provide a story idea of at least 20 characters.",
        )

    prompt = _build_master_prompt(
        story_idea=body.story_idea,
        characters=body.characters,
        genre=body.genre,
        language=body.language,
        tone=body.tone,
    )

    logger.info(
        f"[screenplay_assist] Generating screenplay: genre={body.genre}, "
        f"language={body.language}, tone={body.tone}, "
        f"chars={len(body.characters)}, idea_len={len(body.story_idea)}"
    )

    raw = await _call_best_llm(prompt)

    if not raw:
        raise HTTPException(
            status_code=503,
            detail="All LLM providers are currently unavailable. Please try again shortly.",
        )

    title, logline, screenplay = _parse_screenplay_output(raw)

    logger.info(
        f"[screenplay_assist] ✅ Generated: title='{title}', "
        f"screenplay={len(screenplay)} chars"
    )

    return ScreenplayAssistResponse(
        title=title,
        logline=logline,
        screenplay=screenplay,
    )
