"""
Core configuration — loads settings from environment variables.
Uses pydantic-settings for validation and type safety.
"""

from __future__ import annotations

import json
from typing import List

from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # ── App ──────────────────────────────────────────────────────────────────
    FASTAPI_ENV: str = "development"
    FASTAPI_PORT: int = 8000

    # ── Supabase ─────────────────────────────────────────────────────────────
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str

    # ── Pinecone ─────────────────────────────────────────────────────────────
    PINECONE_API_KEY: str
    PINECONE_INDEX_NAME: str = "cinephile"
    PINECONE_EMBEDDING_DIMENSION: int = 3072  # text-embedding-3-large

    # ── OpenAI ───────────────────────────────────────────────────────────────
    OPENAI_API_KEY: str
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-large"

    # ── Anthropic ────────────────────────────────────────────────────────────
    ANTHROPIC_API_KEY: str
    ANTHROPIC_MODEL: str = "claude-sonnet-4-5"

    # ── Cohere ───────────────────────────────────────────────────────────────
    COHERE_API_KEY: str
    COHERE_RERANK_MODEL: str = "rerank-english-v3.0"

    # ── Auth ─────────────────────────────────────────────────────────────────
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # ── Storage ──────────────────────────────────────────────────────────────
    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE: int = 52_428_800  # 50 MB

    # ── CORS ─────────────────────────────────────────────────────────────────
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]

    # ── Observability ────────────────────────────────────────────────────────
    LANGFUSE_PUBLIC_KEY: str = ""
    LANGFUSE_SECRET_KEY: str = ""
    LOG_LEVEL: str = "INFO"

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: str | List[str]) -> List[str]:
        """Allow CORS_ORIGINS as JSON string or list."""
        if isinstance(v, str):
            try:
                return json.loads(v)
            except ValueError:
                return [origin.strip() for origin in v.split(",")]
        return v

    class Config:
        env_file = ".env.local"
        env_file_encoding = "utf-8"
        case_sensitive = True


settings = Settings()
