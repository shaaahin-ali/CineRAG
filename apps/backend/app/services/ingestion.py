"""
Ingestion pipeline — orchestrates:
  PDF/DOCX/TXT → Parse → Scene-aware chunks → Embed → Pinecone → Supabase scenes

Runs as a FastAPI BackgroundTask after file upload.
"""

import asyncio
import logging
import uuid
from typing import List

from app.models.project import ProjectStatus
from app.services.embedding import embed_texts
from app.services.graph_cache import clear_cached_graph
from app.services.ml_emotion import MalayalamEmotionDetector
from app.services.ml_parsing import MalayalamScreenplayParser
from app.services.retrieval import upsert_chunks
from app.services.scene_images import generate_images_for_project
from app.services.storage import SupabaseClient
from app.utils.chunking import chunk_scenes
from app.utils.parsing import parse_screenplay_text

logger = logging.getLogger(__name__)

ml_parser = MalayalamScreenplayParser()
emotion_detector = MalayalamEmotionDetector()


def extract_text_from_file(file_content: bytes, file_ext: str) -> str:
    """Extract raw text from PDF, DOCX, or TXT."""
    if file_ext == ".pdf":
        import fitz  # PyMuPDF

        doc = fitz.open(stream=file_content, filetype="pdf")
        pages = [page.get_text() for page in doc]
        doc.close()
        return "\n".join(pages)

    elif file_ext == ".docx":
        import io

        from docx import Document

        doc = Document(io.BytesIO(file_content))
        return "\n".join(para.text for para in doc.paragraphs)

    elif file_ext == ".txt":
        return file_content.decode("utf-8", errors="replace")

    else:
        raise ValueError(f"Unsupported file extension: {file_ext}")


async def _detect_emotion_async(scene: dict) -> dict:
    """Run emotion detection for a single scene in a thread pool (non-blocking)."""
    loop = asyncio.get_event_loop()
    emotion_data = await loop.run_in_executor(
        None, emotion_detector.detect_emotions, scene["content"]
    )
    scene["detected_emotions"] = [
        e["emotion"] for e in emotion_data.get("primary_emotions", [])
    ]
    return scene


async def run_ingestion_pipeline(
    project_id: str,
    file_content: bytes,
    file_name: str,
    file_ext: str,
    progress_callback=None,
) -> None:
    """
    Main ingestion orchestrator. Steps:
    1. Extract text from file
    2. Parse into scenes (Malayalam-aware)
    3. Detect emotions per scene  ← now runs ALL scenes in parallel
    4. Chunk scenes
    5. Embed chunks (text-embedding-3-large) ← now all batches in parallel
    6. Upsert to Pinecone  ← now all batches in parallel
    7. Save scenes to Supabase
    8. Update project status → ready
    9. Queue AI image generation for first 30 scenes (background)

    progress_callback: optional async callable(step: str, detail: str)
                       used by SSE endpoint to stream live progress.
    """
    db = SupabaseClient()
    logger.info(f"[Ingestion] Starting for project {project_id}, file: {file_name}")

    async def _progress(step: str, detail: str = "") -> None:
        logger.info(f"[Ingestion] {step}" + (f" — {detail}" if detail else ""))
        if progress_callback:
            try:
                await progress_callback(step, detail)
            except Exception:
                pass  # Never let progress reporting crash the pipeline

    try:
        # Clear any existing graph cache for this project since data will change
        clear_cached_graph(project_id)

        # ── Step 1: Extract text ───────────────────────────────────────────────
        await _progress("extracting", f"Reading {file_ext} file")
        raw_text = extract_text_from_file(file_content, file_ext)
        await _progress("extracted", f"{len(raw_text):,} characters")

        # ── Step 2: Parse into scenes ──────────────────────────────────────────
        await _progress("parsing", "Identifying scenes")
        scenes = parse_screenplay_text(raw_text, ml_parser=ml_parser)
        await _progress("parsed", f"{len(scenes)} scenes found")

        if not scenes:
            raise ValueError("No scenes could be parsed from the screenplay")

        # ── Step 3: Detect emotions per scene — ALL SCENES IN PARALLEL ─────────
        await _progress("emotions", f"Analysing emotions across {len(scenes)} scenes")
        scenes = list(
            await asyncio.gather(*[_detect_emotion_async(s) for s in scenes])
        )
        await _progress("emotions_done", "Emotion detection complete")

        # ── Step 4: Chunk scenes ───────────────────────────────────────────────
        chunks = chunk_scenes(scenes)
        await _progress("chunking", f"{len(chunks)} chunks created")

        # ── Step 5: Embed all chunks — batches sent in parallel ────────────────
        await _progress("embedding", f"Embedding {len(chunks)} chunks")
        texts = [chunk["content"] for chunk in chunks]
        embeddings = await embed_texts(texts)

        for chunk, embedding in zip(chunks, embeddings):
            chunk["id"] = str(uuid.uuid4())
            chunk["embedding"] = embedding

        await _progress("embedding_done", f"{len(embeddings)} embeddings ready")

        # ── Step 6: Upsert to Pinecone — batches sent in parallel ─────────────
        await _progress("indexing", "Upserting vectors to Pinecone")
        vector_count = await upsert_chunks(project_id, chunks)
        await _progress("indexing_done", f"{vector_count} vectors indexed")

        # ── Step 7: Save scenes to Supabase ───────────────────────────────────
        await _progress("saving", "Saving scenes to database")
        scene_records = [
            {
                "project_id": project_id,
                "scene_number": s["scene_number"],
                "page_start": s["page_start"],
                "page_end": s["page_end"],
                "heading": s["heading"],
                "location": s["location"],
                "content": s["content"],
                "characters": s.get("characters", []),
                "int_ext": s.get("int_ext"),
                "time_of_day": s.get("time_of_day"),
                "detected_emotions": s.get("detected_emotions", []),
            }
            for s in scenes
        ]
        # Insert in batches of 250 to respect Supabase payload limits
        batch_size = 250
        for i in range(0, len(scene_records), batch_size):
            db.table("scenes").insert(scene_records[i : i + batch_size]).execute()

        # ── Step 8: Update project status ─────────────────────────────────────
        all_chars: set[str] = set()
        for s in scenes:
            all_chars.update(s.get("characters", []))

        db.table("projects").update({
            "status": ProjectStatus.ready.value,
            "scene_count": len(scenes),
            "page_count": scenes[-1]["page_end"] if scenes else 0,
            "character_count": len(all_chars),
        }).eq("id", project_id).execute()

        await _progress(
            "ready",
            f"{len(scenes)} scenes · {vector_count} vectors · {len(all_chars)} characters",
        )
        logger.info(
            f"[Ingestion] ✅ Complete: {len(scenes)} scenes, "
            f"{vector_count} vectors, {len(all_chars)} characters"
        )

        # ── Step 9: Queue AI image generation (background — does not block) ──
        await _progress("images", "Queuing AI scene image generation")
        asyncio.create_task(
            generate_images_for_project(
                project_id=project_id,
                scenes=scenes,
            )
        )
        # NOTE: Video generation is NOT triggered here.
        # Videos are only generated when the user explicitly presses
        # "Generate Videos" in the Scene Videos panel.
        # This prevents accidental Veo API charges on every upload.

    except Exception as e:
        logger.error(f"[Ingestion] Failed for project {project_id}: {e}", exc_info=True)
        db.table("projects").update({
            "status": ProjectStatus.error.value,
        }).eq("id", project_id).execute()
