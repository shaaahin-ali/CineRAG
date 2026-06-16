"""
Embedding service — OpenAI text-embedding-3-large (3072 dimensions).
Includes batching and retry logic for cost-efficient embedding.
"""

import asyncio
import logging
from typing import List

from openai import AsyncOpenAI

from app.core.config import settings

logger = logging.getLogger(__name__)

_openai_client: AsyncOpenAI | None = None


def get_openai_client() -> AsyncOpenAI:
    global _openai_client
    if _openai_client is None:
        if settings.GEMINI_API_KEY:
            _openai_client = AsyncOpenAI(
                api_key=settings.GEMINI_API_KEY,
                base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
            )
        else:
            _openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    return _openai_client


async def embed_texts(texts: List[str], batch_size: int = 100) -> List[List[float]]:
    """
    Embed a list of texts using text-embedding-3-large (3072 dims) or gemini-embedding-001 (768 dims).
    Batches requests to stay within API limits.
    """
    client = get_openai_client()
    all_embeddings: List[List[float]] = []

    for i in range(0, len(texts), batch_size):
        batch = texts[i : i + batch_size]
        logger.debug(f"Embedding batch {i // batch_size + 1}: {len(batch)} texts")

        for attempt in range(3):
            try:
                kwargs = {
                    "model": (
                        settings.GEMINI_EMBEDDING_MODEL
                        if settings.GEMINI_API_KEY
                        else settings.OPENAI_EMBEDDING_MODEL
                    ),
                    "input": batch,
                }
                kwargs["dimensions"] = (
                    settings.GEMINI_EMBEDDING_DIMENSION
                    if settings.GEMINI_API_KEY
                    else settings.PINECONE_EMBEDDING_DIMENSION
                )

                response = await client.embeddings.create(**kwargs)
                embeddings = [item.embedding for item in response.data]
                all_embeddings.extend(embeddings)
                break
            except Exception as e:
                if attempt == 2:
                    logger.error(f"Embedding failed after 3 attempts: {e}")
                    raise
                wait = 2 ** attempt
                logger.warning(f"Embedding attempt {attempt + 1} failed, retrying in {wait}s: {e}")
                await asyncio.sleep(wait)

    return all_embeddings


async def embed_query(query: str) -> List[float]:
    """Embed a single query string."""
    results = await embed_texts([query])
    return results[0]
