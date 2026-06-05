"""
Query API — SSE streaming RAG endpoint with Malayalam language support.

Routes:
  POST /api/v1/projects/{id}/query                    SSE streaming query
  GET  /api/v1/projects/{id}/queries                  Query history
  POST /api/v1/projects/{id}/queries/{qid}/bookmark   Toggle bookmark
  POST /api/v1/projects/{id}/translate                Translate text
"""

import json
import logging
import time
from typing import AsyncIterator, List
from uuid import UUID

from fastapi import APIRouter, HTTPException, Request, status
from fastapi.responses import StreamingResponse

from app.core.security import extract_token, get_current_user_id
from app.models.query import BookmarkResponse, QueryOut, QueryRequest, TranslateRequest
from app.services.generation import stream_rag_response
from app.services.ml_query_processor import MalayalamQueryProcessor
from app.services.storage import SupabaseClient

logger = logging.getLogger(__name__)
router = APIRouter()

ml_processor = MalayalamQueryProcessor()


# ── SSE helpers ───────────────────────────────────────────────────────────────

async def sse_generator(
    project_id: str,
    query_id: str,
    request: QueryRequest,
    user_id: str,
) -> AsyncIterator[str]:
    """Yield SSE events: token, citation, done, error."""
    full_response = ""
    all_citations = []
    start_ms = int(time.time() * 1000)

    try:
        async for event in stream_rag_response(
            project_id=project_id,
            query=request.query,
            user_role=request.user_role,
            language=request.language,
        ):
            event_type = event.get("type")

            if event_type == "token":
                token = event["token"]
                full_response += token
                yield f"event: token\ndata: {json.dumps({'token': token})}\n\n"

            elif event_type == "citation":
                citation = event["citation"]
                all_citations.append(citation)
                yield f"event: citation\ndata: {json.dumps(citation)}\n\n"

            elif event_type == "done":
                # Save completed query to Supabase
                elapsed = int(time.time() * 1000) - start_ms
                db = SupabaseClient()
                db.table("queries").update({
                    "response_text": full_response,
                    "citations": all_citations,
                    "latency_ms": elapsed,
                }).eq("id", query_id).execute()
                yield f"event: done\ndata: {json.dumps({'query_id': query_id, 'latency_ms': elapsed})}\n\n"

    except Exception as e:
        logger.error(f"SSE stream error: {e}")
        yield f"event: error\ndata: {json.dumps({'error': str(e)})}\n\n"


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/projects/{project_id}/query")
async def query_screenplay(
    request: Request,
    project_id: UUID,
    body: QueryRequest,
) -> StreamingResponse:
    """
    Stream a RAG response with Malayalam language support.

    SSE events:
      - event: token   → data: {"token": "..."}
      - event: citation → data: {"scene_number": 1, "page_start": 5, ...}
      - event: done    → data: {"query_id": "...", "latency_ms": 1200}
      - event: error   → data: {"error": "..."}
    """
    token = extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user_id = get_current_user_id(token)

    # Auto-detect language if not provided
    if not body.language:
        processed = ml_processor.process_query(body.query)
        body.language = processed["detected_language"]

    db = SupabaseClient()

    # Create query record (response filled in after streaming)
    result = db.table("queries").insert({
        "project_id": str(project_id),
        "user_id": user_id,
        "query_text": body.query,
        "detected_language": body.language,
    }).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create query record")

    query_id = result.data[0]["id"]

    return StreamingResponse(
        sse_generator(str(project_id), query_id, body, user_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable Nginx buffering
        },
    )


@router.get("/projects/{project_id}/queries", response_model=List[QueryOut])
async def get_query_history(request: Request, project_id: UUID) -> List[QueryOut]:
    """Get query history for a project (user's own queries)."""
    token = extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user_id = get_current_user_id(token)

    db = SupabaseClient()
    result = db.table("queries").select("*").eq(
        "project_id", str(project_id)
    ).eq("user_id", user_id).order("created_at", desc=True).limit(50).execute()

    return [QueryOut(**q) for q in (result.data or [])]


@router.post(
    "/projects/{project_id}/queries/{query_id}/bookmark",
    response_model=BookmarkResponse,
)
async def toggle_bookmark(
    request: Request,
    project_id: UUID,
    query_id: UUID,
) -> BookmarkResponse:
    """Toggle bookmark status on a query."""
    token = extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    db = SupabaseClient()
    # Get current state
    result = db.table("queries").select("bookmarked").eq("id", str(query_id)).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Query not found")

    new_state = not result.data["bookmarked"]
    db.table("queries").update({"bookmarked": new_state}).eq("id", str(query_id)).execute()

    return BookmarkResponse(query_id=query_id, bookmarked=new_state)


@router.post("/projects/{project_id}/translate")
async def translate_text(
    request: Request,
    project_id: UUID,
    body: TranslateRequest,
) -> dict:
    """Translate text between Malayalam and English using Claude."""
    token = extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    from app.services.generation import translate_with_claude

    translated = await translate_with_claude(
        text=body.text,
        source_lang=body.source_lang,
        target_lang=body.target_lang,
    )
    return {"translated_text": translated, "source_lang": body.source_lang, "target_lang": body.target_lang}
