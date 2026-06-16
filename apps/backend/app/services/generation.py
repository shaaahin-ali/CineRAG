"""
Generation service — Claude Sonnet streaming with Malayalam cultural system prompt.
Yields SSE events: token, citation, done.
"""

import logging
from typing import Any, AsyncIterator, Dict, List, Optional

import anthropic
from openai import AsyncOpenAI

from app.core.config import settings
from app.services.ml_query_processor import MalayalamQueryProcessor
from app.services.ml_system_prompt import MalayalamSystemPrompt
from app.services.retrieval import retrieve_chunks

logger = logging.getLogger(__name__)
ml_processor = MalayalamQueryProcessor()

_anthropic_client: anthropic.AsyncAnthropic | None = None
_gemini_client: AsyncOpenAI | None = None
_openrouter_client: AsyncOpenAI | None = None


def get_anthropic_client() -> anthropic.AsyncAnthropic:
    global _anthropic_client
    if _anthropic_client is None:
        _anthropic_client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
    return _anthropic_client


def get_gemini_client() -> AsyncOpenAI:
    global _gemini_client
    if _gemini_client is None:
        _gemini_client = AsyncOpenAI(
            api_key=settings.GEMINI_API_KEY,
            base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
        )
    return _gemini_client


def get_openrouter_client() -> AsyncOpenAI:
    global _openrouter_client
    if _openrouter_client is None:
        _openrouter_client = AsyncOpenAI(
            api_key=settings.OPENROUTER_API_KEY,
            base_url="https://openrouter.ai/api/v1"
        )
    return _openrouter_client


def build_context_block(chunks: List[Dict[str, Any]]) -> str:
    """Format retrieved chunks as context for the LLM."""
    if not chunks:
        return "No relevant screenplay excerpts found."

    lines = ["RETRIEVED SCREENPLAY EXCERPTS:\n" + "─" * 60]
    for i, chunk in enumerate(chunks, 1):
        lines.append(
            f"\n[EXCERPT {i}]\n"
            f"Scene {chunk.get('scene_number', '?')} | "
            f"Pages {chunk.get('page_start', '?')}–{chunk.get('page_end', '?')}\n"
            f"Location: {chunk.get('location', 'Unknown')}\n"
            f"Characters: {', '.join(chunk.get('characters', []) or ['None listed'])}\n"
            f"Heading: {chunk.get('heading', '')}\n"
            f"Content:\n{chunk.get('content', '')}\n"
            + "─" * 40
        )
    return "\n".join(lines)


def build_citations(chunks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Convert retrieved chunks to citation objects."""
    return [
        {
            "scene_number": chunk.get("scene_number"),
            "page_start": chunk.get("page_start"),
            "page_end": chunk.get("page_end"),
            "heading": chunk.get("heading", ""),
            "location": chunk.get("location", ""),
            "characters": chunk.get("characters", []),
            "excerpt": chunk.get("content", "")[:300],
            "relevance_score": chunk.get("relevance_score"),
            "detected_emotions": chunk.get("detected_emotions", []),
        }
        for chunk in chunks
    ]


async def stream_rag_response(
    project_id: str,
    query: str,
    user_role: Optional[str] = None,
    language: Optional[str] = None,
) -> AsyncIterator[Dict[str, Any]]:
    """
    Full RAG pipeline with streaming:
    1. Process query (language detection + Malayalam expansion)
    2. Retrieve + rerank chunks
    3. Yield citations
    4. Stream Claude response token by token
    5. Yield done event
    """
    # ── Step 1: Process query ──────────────────────────────────────────────────
    processed = ml_processor.process_query(query)
    effective_language = language or processed["detected_language"]
    expanded_query = processed["expanded_query"]

    logger.info(f"Query language: {effective_language}, expanded: {len(expanded_query)} chars")

    # ── Step 2: Retrieve chunks ────────────────────────────────────────────────
    chunks = await retrieve_chunks(
        project_id=project_id,
        query=expanded_query,
        top_k=20,
        rerank_top_n=5,
    )

    # ── Step 3: Emit citations ─────────────────────────────────────────────────
    citations = build_citations(chunks)
    for citation in citations:
        yield {"type": "citation", "citation": citation}

    # ── Step 4: Build prompt ───────────────────────────────────────────────────
    context = build_context_block(chunks)

    system_prompt = (
        MalayalamSystemPrompt.get_malayalam_context()
        + "\n\n"
        + MalayalamSystemPrompt.get_role_specific_prompt(user_role or "director")
    )

    user_message = (
        f"Query: {query}\n\n"
        + (f"[Query is in Malayalam — respond in English with Malayalam terms where culturally relevant]\n\n"
           if effective_language == "ml" else "")
        + context
    )

    # ── Step 5: Stream response ────────────────────────────────────────
    if settings.OPENROUTER_API_KEY:
        client = get_openrouter_client()
        
        models_to_try = [
            settings.OPENROUTER_CHAT_MODEL,
            "google/gemma-4-31b-it:free",
            "meta-llama/llama-3.2-3b-instruct:free",
            "nousresearch/hermes-3-llama-3.1-405b:free"
        ]
        
        response = None
        for model in models_to_try:
            try:
                response = await client.chat.completions.create(
                    model=model,
                    max_tokens=2048,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_message}
                    ],
                    stream=True,
                )
                break  # Success!
            except Exception as e:
                logger.warning(f"OpenRouter model {model} failed: {e}")
                continue
                
        if not response:
            yield {"type": "token", "token": "\n\n[System] All free OpenRouter models are currently extremely busy and rate-limited. Please wait a minute and try again!"}
            yield {"type": "done"}
            return

        async for chunk in response:
            text = chunk.choices[0].delta.content or ""
            if text:
                yield {"type": "token", "token": text}
    elif settings.GEMINI_API_KEY:
        client = get_gemini_client()
        response = await client.chat.completions.create(
            model=settings.GEMINI_CHAT_MODEL,
            max_tokens=2048,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            stream=True,
        )
        async for chunk in response:
            text = chunk.choices[0].delta.content or ""
            if text:
                yield {"type": "token", "token": text}
    else:
        client = get_anthropic_client()
        async with client.messages.stream(
            model=settings.ANTHROPIC_MODEL,
            max_tokens=2048,
            system=system_prompt,
            messages=[{"role": "user", "content": user_message}],
        ) as stream:
            async for text in stream.text_stream:
                yield {"type": "token", "token": text}

    yield {"type": "done"}


async def translate_with_claude(text: str, source_lang: str, target_lang: str) -> str:
    """Translate text between Malayalam and English using Claude (or Gemini)."""
    lang_names = {"ml": "Malayalam", "en": "English"}
    source = lang_names.get(source_lang, source_lang)
    target = lang_names.get(target_lang, target_lang)

    user_prompt = (
        f"Translate the following {source} text to {target}. "
        f"Preserve film/screenplay terminology accurately. "
        f"Return only the translated text, no explanations.\n\n"
        f"Text: {text}"
    )

    if settings.OPENROUTER_API_KEY:
        client = get_openrouter_client()
        response = await client.chat.completions.create(
            model=settings.OPENROUTER_CHAT_MODEL,
            max_tokens=1024,
            messages=[{"role": "user", "content": user_prompt}],
        )
        return response.choices[0].message.content or ""
    elif settings.GEMINI_API_KEY:
        client = get_gemini_client()
        response = await client.chat.completions.create(
            model=settings.GEMINI_CHAT_MODEL,
            max_tokens=1024,
            messages=[{"role": "user", "content": user_prompt}],
        )
        return response.choices[0].message.content or ""
    else:
        client = get_anthropic_client()
        response = await client.messages.create(
            model=settings.ANTHROPIC_MODEL,
            max_tokens=1024,
            messages=[
                {
                    "role": "user",
                    "content": user_prompt,
                }
            ],
        )
        return response.content[0].text
