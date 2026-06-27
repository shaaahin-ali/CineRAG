"""
Retrieval service — Pinecone vector search + Cohere reranking.
"""

import asyncio
import logging
from typing import Any, Dict, List, Optional


import cohere
from pinecone import Pinecone

from app.core.config import settings
from app.services.embedding import embed_query

logger = logging.getLogger(__name__)

_pinecone_index = None
_cohere_client: cohere.Client | None = None


def get_pinecone_index():
    global _pinecone_index
    if _pinecone_index is None:
        pc = Pinecone(api_key=settings.PINECONE_API_KEY)
        _pinecone_index = pc.Index(settings.PINECONE_INDEX_NAME)
        logger.info(f"Pinecone index '{settings.PINECONE_INDEX_NAME}' connected")
    return _pinecone_index


def get_cohere_client() -> cohere.Client:
    global _cohere_client
    if _cohere_client is None:
        _cohere_client = cohere.Client(settings.COHERE_API_KEY)
    return _cohere_client


async def retrieve_chunks(
    project_id: str,
    query: str,
    top_k: int = 20,
    rerank_top_n: int = 5,
    metadata_filter: Optional[Dict[str, Any]] = None,
) -> List[Dict[str, Any]]:
    """
    Full retrieval pipeline:
    1. Embed the query (text-embedding-3-large, 3072 dims)
    2. Search Pinecone (top_k candidates)
    3. Rerank with Cohere (top rerank_top_n)
    Returns list of dicts with scene metadata + content.
    """
    # ── Step 1: Embed query ───────────────────────────────────────────────────
    query_vector = await embed_query(query)

    # ── Step 2: Pinecone search ───────────────────────────────────────────────
    index = get_pinecone_index()

    pinecone_filter: Dict[str, Any] = {"project_id": {"$eq": project_id}}
    if metadata_filter:
        pinecone_filter.update(metadata_filter)

    results = index.query(
        vector=query_vector,
        top_k=top_k,
        filter=pinecone_filter,
        include_metadata=True,
    )

    if not results.matches:
        logger.info(f"No Pinecone results for project {project_id}")
        return []

    # ── Step 3: Cohere reranking ──────────────────────────────────────────────
    documents = [
        match.metadata.get("content", "") for match in results.matches
    ]

    try:
        co = get_cohere_client()
        reranked = co.rerank(
            model=settings.COHERE_RERANK_MODEL,
            query=query,
            documents=documents,
            top_n=rerank_top_n,
        )

        # Map reranked indices back to full metadata
        reranked_chunks = []
        for r in reranked.results:
            match = results.matches[r.index]
            chunk = {**match.metadata, "relevance_score": r.relevance_score}
            reranked_chunks.append(chunk)

        return reranked_chunks

    except Exception as e:
        logger.warning(f"Cohere reranking failed, falling back to Pinecone order: {e}")
        # Fallback: return top matches without reranking
        return [
            {**m.metadata, "relevance_score": m.score}
            for m in results.matches[:rerank_top_n]
        ]


async def upsert_chunks(project_id: str, chunks: List[Dict[str, Any]]) -> int:
    """
    Upsert scene chunks into Pinecone.
    Each chunk must have: id, embedding, metadata (content, scene_number, etc.)
    All batches are sent concurrently for maximum throughput.
    Returns number of vectors upserted.
    """
    index = get_pinecone_index()
    loop = asyncio.get_event_loop()

    vectors = [
        {
            "id": chunk["id"],
            "values": chunk["embedding"],
            "metadata": {
                "project_id": project_id,
                "scene_number": chunk["scene_number"],
                "page_start": chunk["page_start"],
                "page_end": chunk["page_end"],
                "heading": chunk["heading"],
                "location": chunk["location"],
                "characters": chunk["characters"],
                "content": chunk["content"][:2000],  # Pinecone metadata limit
                "detected_emotions": chunk.get("detected_emotions", []),
            },
        }
        for chunk in chunks
    ]

    # Split into batches (Pinecone recommends 100 per request)
    batch_size = 100
    batches = [vectors[i : i + batch_size] for i in range(0, len(vectors), batch_size)]

    async def _upsert_batch(batch):
        """Run a single synchronous Pinecone upsert in a thread pool."""
        await loop.run_in_executor(None, index.upsert, batch)
        return len(batch)

    # Fire all batches concurrently
    counts = await asyncio.gather(*[_upsert_batch(b) for b in batches])
    total = sum(counts)

    logger.info(f"Upserted {total} vectors for project {project_id}")
    return total



async def delete_project_vectors(project_id: str) -> None:
    """Delete all Pinecone vectors for a project."""
    index = get_pinecone_index()
    index.delete(filter={"project_id": {"$eq": project_id}})
    logger.info(f"Deleted all vectors for project {project_id}")
