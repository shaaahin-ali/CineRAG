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
    All batches are sent concurrently for maximum throughput.
    """
    client = get_openai_client()
    model = (
        settings.GEMINI_EMBEDDING_MODEL
        if settings.GEMINI_API_KEY
        else settings.OPENAI_EMBEDDING_MODEL
    )
    dimensions = (
        settings.GEMINI_EMBEDDING_DIMENSION
        if settings.GEMINI_API_KEY
        else settings.PINECONE_EMBEDDING_DIMENSION
    )

    async def _embed_batch(batch: List[str], batch_idx: int) -> List[List[float]]:
        """Embed a single batch with retry logic."""
        for attempt in range(3):
            try:
                logger.debug(f"Embedding batch {batch_idx}: {len(batch)} texts")
                response = await client.embeddings.create(
                    model=model,
                    input=batch,
                    dimensions=dimensions,
                )
                return [item.embedding for item in response.data]
            except Exception as e:
                if attempt == 2:
                    logger.error(f"Embedding batch {batch_idx} failed after 3 attempts: {e}")
                    raise
                wait = 2 ** attempt
                logger.warning(
                    f"Embedding batch {batch_idx} attempt {attempt + 1} failed, "
                    f"retrying in {wait}s: {e}"
                )
                await asyncio.sleep(wait)
        return []  # unreachable, but satisfies type checker

    # Fire all batches concurrently
    batches = [texts[i : i + batch_size] for i in range(0, len(texts), batch_size)]
    batch_results = await asyncio.gather(
        *[_embed_batch(batch, idx) for idx, batch in enumerate(batches)]
    )

    # Flatten results preserving original order
    all_embeddings: List[List[float]] = []
    for batch_result in batch_results:
        all_embeddings.extend(batch_result)

    return all_embeddings



async def embed_query(query: str) -> List[float]:
    """Embed a single query string."""
    results = await embed_texts([query])
    return results[0]
