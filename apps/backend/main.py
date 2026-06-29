"""
CinePhile Malayalam Edition — FastAPI Entry Point
🎬 AI-powered RAG platform for Mollywood screenplays
"""

import logging
import sys
from contextlib import asynccontextmanager

# ── Windows asyncio DNS fix ────────────────────────────────────────────────────
# ProactorEventLoop (Windows default) breaks DNS resolution in async HTTP clients
# (httpx, aiohttp). SelectorEventLoop handles DNS correctly on all platforms.
if sys.platform == "win32":
    import asyncio
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
# ──────────────────────────────────────────────────────────────────────────────

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.api import graph, graph_explain, health, narrator, projects, query, scenes, screenplay_assist, upload, video
from app.core.config import settings
from app.core.logging import setup_logging
from app.core.security import limiter

setup_logging()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):  # noqa: ANN001
    """Startup and shutdown events."""
    logger.info("CinePhile Malayalam Edition starting up...")
    logger.info(f"Environment: {settings.FASTAPI_ENV}")
    embed_dims = (
        settings.GEMINI_EMBEDDING_DIMENSION
        if settings.GEMINI_API_KEY
        else settings.PINECONE_EMBEDDING_DIMENSION
    )
    logger.info(f"Pinecone index: {settings.PINECONE_INDEX_NAME} ({embed_dims} dims)")
    yield
    logger.info("CinePhile shutting down gracefully...")


app = FastAPI(
    title="CinePhile API — Malayalam Edition",
    description=(
        "AI-powered RAG platform for Mollywood screenplays. "
        "Upload screenplays, query in Malayalam or English, "
        "get streaming responses with scene citations."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(health.router, prefix="/api/v1", tags=["health"])
app.include_router(projects.router, prefix="/api/v1", tags=["projects"])
app.include_router(upload.router, prefix="/api/v1", tags=["upload"])
app.include_router(query.router, prefix="/api/v1", tags=["query"])
app.include_router(scenes.router, prefix="/api/v1", tags=["scenes"])
app.include_router(graph.router, prefix="/api/v1", tags=["graph"])
app.include_router(graph_explain.router, prefix="/api/v1", tags=["graph"])
app.include_router(video.router, prefix="/api/v1", tags=["video"])
app.include_router(narrator.router, prefix="/api/v1", tags=["narrator"])
app.include_router(screenplay_assist.router, prefix="/api/v1", tags=["screenplay"])

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.FASTAPI_PORT,
        reload=settings.FASTAPI_ENV == "development",
    )
