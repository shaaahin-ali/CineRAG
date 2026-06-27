"""
Graph Explain API — RAG-generated relationship explanations.

When a user taps a character node in the graph panel, this endpoint
retrieves relevant screenplay chunks via the existing RAG pipeline
(Pinecone + Cohere) and generates a concise natural-language summary
of the character's role, relationships, and key scenes.

Routes:
  GET /api/v1/projects/{id}/graph/explain?character={name}
  GET /api/v1/projects/{id}/graph/explain?edge={charA}||{charB}
"""

import logging
from functools import lru_cache
from typing import Any, Dict, Optional
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import StreamingResponse

from app.core.config import settings
from app.core.security import extract_token
from app.services.retrieval import retrieve_chunks
from app.services.storage import SupabaseClient

logger = logging.getLogger(__name__)
router = APIRouter()

# ── In-memory cache for graph explain results ─────────────────────────────────
# Key: (project_id, cache_key) — avoids re-running the full RAG pipeline
# on repeat clicks. Character relationships don't change during a session.
_explain_cache: Dict[tuple, str] = {}


async def _generate_explanation(
    prompt: str,
) -> str:
    """Generate a concise explanation using the configured LLM."""
    try:
        if settings.OPENROUTER_API_KEY:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(
                api_key=settings.OPENROUTER_API_KEY,
                base_url="https://openrouter.ai/api/v1",
            )
            response = await client.chat.completions.create(
                model=settings.OPENROUTER_CHAT_MODEL,
                max_tokens=300,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
            )
            return response.choices[0].message.content or ""

        elif settings.GEMINI_API_KEY:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(
                api_key=settings.GEMINI_API_KEY,
                base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
            )
            response = await client.chat.completions.create(
                model=settings.GEMINI_CHAT_MODEL,
                max_tokens=300,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
            )
            return response.choices[0].message.content or ""

        else:
            return "No LLM configured. Please set OPENROUTER_API_KEY or GEMINI_API_KEY."

    except Exception as e:
        logger.warning(f"Graph explain LLM generation failed: {e}")
        return f"Could not generate explanation: {str(e)}"


async def _stream_explanation(prompt: str):
    """Stream a concise explanation using the configured LLM."""
    try:
        client = None
        model = None

        if settings.OPENROUTER_API_KEY:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(
                api_key=settings.OPENROUTER_API_KEY,
                base_url="https://openrouter.ai/api/v1",
            )
            model = settings.OPENROUTER_CHAT_MODEL

        elif settings.GEMINI_API_KEY:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(
                api_key=settings.GEMINI_API_KEY,
                base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
            )
            model = settings.GEMINI_CHAT_MODEL

        if not client or not model:
            yield "data: No LLM configured.\n\n"
            yield "data: [DONE]\n\n"
            return

        stream = await client.chat.completions.create(
            model=model,
            max_tokens=300,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            stream=True,
        )

        async for chunk in stream:
            delta = chunk.choices[0].delta
            if delta.content:
                yield f"data: {delta.content}\n\n"

        yield "data: [DONE]\n\n"

    except Exception as e:
        logger.warning(f"Graph explain streaming failed: {e}")
        yield f"data: Error: {str(e)}\n\n"
        yield "data: [DONE]\n\n"


@router.get("/projects/{project_id}/graph/explain")
async def explain_character_or_edge(
    request: Request,
    project_id: UUID,
    character: Optional[str] = Query(None, description="Character name to explain"),
    edge: Optional[str] = Query(None, description="Edge pair in format 'CharA||CharB'"),
    stream: bool = Query(False, description="Stream the response as SSE"),
) -> Any:
    """
    Generate a RAG-powered explanation for a character or relationship edge.

    Either `character` or `edge` must be provided:
    - ?character=HARI → explains HARI's role, connections, key scenes
    - ?edge=HARI||ANMOL → explains the HARI↔ANMOL relationship in detail
    - ?stream=true → returns Server-Sent Events instead of JSON
    """
    token = extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    if not character and not edge:
        raise HTTPException(
            status_code=400,
            detail="Provide either ?character=NAME or ?edge=CHAR_A||CHAR_B",
        )

    # Build search query based on what we're explaining
    if character:
        search_query = f"Character {character}: role, scenes, relationships, motivations"
        explain_type = "character"
        explain_target = character
    else:
        parts = edge.split("||")
        if len(parts) != 2:
            raise HTTPException(
                status_code=400,
                detail="Edge format must be 'CharA||CharB'",
            )
        char_a, char_b = parts[0].strip(), parts[1].strip()
        search_query = f"{char_a} and {char_b}: relationship, interactions, shared scenes, conflict"
        explain_type = "edge"
        explain_target = f"{char_a} ↔ {char_b}"

    # Retrieve relevant chunks from the screenplay via RAG pipeline
    try:
        chunks = await retrieve_chunks(
            project_id=str(project_id),
            query=search_query,
            top_k=8,
            rerank_top_n=3,
        )
    except Exception as e:
        logger.warning(f"RAG retrieval failed for graph explain: {e}")
        chunks = []

    # Build context from retrieved chunks
    context_parts = []
    for chunk in chunks:
        scene_num = chunk.get("scene_number", "?")
        heading = chunk.get("heading", "")
        location = chunk.get("location", "")
        content = chunk.get("content", "")[:500]
        context_parts.append(
            f"[Scene {scene_num}] {heading} ({location})\n{content}"
        )

    context = "\n---\n".join(context_parts) if context_parts else "No screenplay data available."

    # Build the explanation prompt
    if explain_type == "character":
        prompt = f"""Based on the following screenplay excerpts, write a concise character summary for "{explain_target}".

SCREENPLAY EXCERPTS:
{context}

Write 3-5 sentences covering:
1. Who this character is and their role in the story
2. Their key relationships (name the other characters)
3. Which scenes they appear in and why those scenes matter
4. Any emotional arc or character development

Be specific — reference scene numbers and locations. Write in a natural, engaging tone suitable for a film production team.
Do NOT speculate beyond what the text shows. If information is missing, say so briefly."""

    else:
        prompt = f"""Based on the following screenplay excerpts, explain the relationship between {explain_target}.

SCREENPLAY EXCERPTS:
{context}

Write 3-5 sentences covering:
1. How these two characters are related (family, friends, rivals, etc.)
2. When they first meet or interact
3. Key moments between them (reference scene numbers)
4. How their relationship evolves across the screenplay

Be specific — reference scene numbers and locations. Write in a natural, engaging tone suitable for a film production team.
Do NOT speculate beyond what the text shows."""

    if stream:
        return StreamingResponse(
            _stream_explanation(prompt),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            },
        )

    # Non-streaming: check cache first, then generate
    cache_key = (str(project_id), explain_target)
    if cache_key in _explain_cache:
        logger.info(f"[graph_explain] Cache hit for {explain_target}")
        cached = _explain_cache[cache_key]
        return {
            "type": explain_type,
            "target": explain_target,
            "explanation": cached,
            "sources": [
                {
                    "scene_number": c.get("scene_number"),
                    "heading": c.get("heading", ""),
                    "relevance_score": round(c.get("relevance_score", 0), 3),
                }
                for c in chunks[:3]
            ],
            "cached": True,
        }

    explanation = await _generate_explanation(prompt)
    _explain_cache[cache_key] = explanation  # store for future clicks

    return {
        "type": explain_type,
        "target": explain_target,
        "explanation": explanation,
        "sources": [
            {
                "scene_number": c.get("scene_number"),
                "heading": c.get("heading", ""),
                "relevance_score": round(c.get("relevance_score", 0), 3),
            }
            for c in chunks[:4]
        ],
    }
