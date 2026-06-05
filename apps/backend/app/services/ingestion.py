"""
Ingestion pipeline — orchestrates:
  PDF/DOCX/TXT → Parse → Scene-aware chunks → Embed → Pinecone → Supabase scenes

Runs as a FastAPI BackgroundTask after file upload.
"""

import logging
import uuid
from typing import List

from app.models.project import ProjectStatus
from app.services.embedding import embed_texts
from app.services.ml_emotion import MalayalamEmotionDetector
from app.services.ml_parsing import MalayalamScreenplayParser
from app.services.retrieval import upsert_chunks
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


async def run_ingestion_pipeline(
    project_id: str,
    file_content: bytes,
    file_name: str,
    file_ext: str,
) -> None:
    """
    Main ingestion orchestrator. Steps:
    1. Extract text from file
    2. Parse into scenes (Malayalam-aware)
    3. Detect emotions per scene
    4. Chunk scenes
    5. Embed chunks (text-embedding-3-large)
    6. Upsert to Pinecone
    7. Save scenes to Supabase
    8. Update project status → ready
    """
    db = SupabaseClient()
    logger.info(f"[Ingestion] Starting for project {project_id}, file: {file_name}")

    try:
        # ── Step 1: Extract text ───────────────────────────────────────────────
        logger.info(f"[Ingestion] Extracting text from {file_ext} file")
        raw_text = extract_text_from_file(file_content, file_ext)
        logger.info(f"[Ingestion] Extracted {len(raw_text)} chars")

        # ── Step 2: Parse into scenes ──────────────────────────────────────────
        logger.info("[Ingestion] Parsing screenplay into scenes")
        scenes = parse_screenplay_text(raw_text, ml_parser=ml_parser)
        logger.info(f"[Ingestion] Found {len(scenes)} scenes")

        if not scenes:
            raise ValueError("No scenes could be parsed from the screenplay")

        # ── Step 3: Detect emotions per scene (Malayalam-aware) ────────────────
        logger.info("[Ingestion] Running Malayalam emotion detection")
        for scene in scenes:
            emotion_data = emotion_detector.detect_emotions(scene["content"])
            scene["detected_emotions"] = [
                e["emotion"] for e in emotion_data.get("primary_emotions", [])
            ]

        # ── Step 4: Chunk scenes ───────────────────────────────────────────────
        chunks = chunk_scenes(scenes)
        logger.info(f"[Ingestion] Created {len(chunks)} chunks")

        # ── Step 5: Embed all chunks ───────────────────────────────────────────
        logger.info("[Ingestion] Embedding chunks with text-embedding-3-large")
        texts = [chunk["content"] for chunk in chunks]
        embeddings = await embed_texts(texts)

        for chunk, embedding in zip(chunks, embeddings):
            chunk["id"] = str(uuid.uuid4())
            chunk["embedding"] = embedding

        # ── Step 6: Upsert to Pinecone ────────────────────────────────────────
        logger.info("[Ingestion] Upserting to Pinecone")
        vector_count = await upsert_chunks(project_id, chunks)

        # ── Step 7: Save scenes to Supabase ───────────────────────────────────
        logger.info("[Ingestion] Saving scenes to Supabase")
        scene_records = [
            {
                "project_id": project_id,
                "scene_number": s["scene_number"],
                "page_start": s["page_start"],
                "page_end": s["page_end"],
                "heading": s["heading"],
                "location": s["location"],
                "time_of_day": s.get("time_of_day"),
                "int_ext": s.get("int_ext"),
                "characters": s.get("characters", []),
                "content": s["content"],
                "detected_emotions": s.get("detected_emotions", []),
                "estimated_duration_seconds": s.get("estimated_duration_seconds"),
            }
            for s in scenes
        ]
        db.table("scenes").insert(scene_records).execute()

        # ── Step 8: Update project status ─────────────────────────────────────
        all_chars: set[str] = set()
        for s in scenes:
            all_chars.update(s.get("characters", []))

        db.table("projects").update({
            "status": ProjectStatus.ready,
            "scene_count": len(scenes),
            "page_count": scenes[-1]["page_end"] if scenes else 0,
            "character_count": len(all_chars),
        }).eq("id", project_id).execute()

        logger.info(
            f"[Ingestion] ✅ Complete: {len(scenes)} scenes, "
            f"{vector_count} vectors, {len(all_chars)} characters"
        )

    except Exception as e:
        logger.error(f"[Ingestion] ❌ Failed for project {project_id}: {e}", exc_info=True)
        db.table("projects").update({
            "status": ProjectStatus.error,
        }).eq("id", project_id).execute()
