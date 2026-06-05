"""Logging configuration — JSON in production, pretty in development."""

import logging
import sys

from app.core.config import settings


def setup_logging() -> None:
    """Configure root logger based on environment."""

    level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)

    if settings.FASTAPI_ENV == "production":
        # JSON structured logging for production (works well with Render)
        fmt = '{"time":"%(asctime)s","level":"%(levelname)s","logger":"%(name)s","msg":"%(message)s"}'
    else:
        # Human-readable for development
        fmt = "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s"

    logging.basicConfig(
        level=level,
        format=fmt,
        handlers=[logging.StreamHandler(sys.stdout)],
        force=True,
    )

    # Reduce noise from third-party libraries
    for noisy in ("httpx", "httpcore", "openai", "anthropic", "pinecone"):
        logging.getLogger(noisy).setLevel(logging.WARNING)
