"""
Core configuration — loads settings from environment variables.
Uses pydantic-settings for validation and type safety.
"""

from __future__ import annotations

import json
from typing import List

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


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
    PINECONE_EMBEDDING_DIMENSION: int = 3072  # OpenAI text-embedding-3-large
    GEMINI_EMBEDDING_DIMENSION: int = 768  # gemini-embedding-001 (matches Pinecone index)
    GEMINI_EMBEDDING_MODEL: str = "gemini-embedding-001"
    GEMINI_CHAT_MODEL: str = "gemini-2.0-flash"

    # ── OpenAI ───────────────────────────────────────────────────────────────
    OPENAI_API_KEY: str = ""
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-large"

    # ── Anthropic ────────────────────────────────────────────────────────────
    ANTHROPIC_API_KEY: str = ""
    ANTHROPIC_MODEL: str = "claude-sonnet-4-5"

    # ── Cohere ───────────────────────────────────────────────────────────────
    COHERE_API_KEY: str = ""
    COHERE_RERANK_MODEL: str = "rerank-english-v3.0"

    # ── Gemini ───────────────────────────────────────────────────────────────
    GEMINI_API_KEY: str = ""

    # ── OpenRouter ───────────────────────────────────────────────────────────
    OPENROUTER_API_KEY: str = ""
    OPENROUTER_CHAT_MODEL: str = "meta-llama/llama-3.3-70b-instruct:free"
    # Fallback cascade — tried in order if the primary model fails.
    # Verified working on OpenRouter free tier as of June 2026.
    OPENROUTER_FALLBACK_MODELS: List[str] = [
        "meta-llama/llama-3.2-3b-instruct:free",
        "google/gemma-4-31b-it:free",
        "nousresearch/hermes-3-llama-3.1-405b:free",
        "deepseek/deepseek-r1-0528:free",
    ]

    # ── Groq (free LLM — 30 req/min, 14400 req/day — best free option) ──────────
    # Get FREE key (no credit card): https://console.groq.com/keys
    # Models run on custom LPU chips — extremely fast inference
    GROQ_API_KEY: str = ""
    GROQ_CHAT_MODEL: str = "llama-3.1-8b-instant"   # fast + generous limits
    GROQ_QUALITY_MODEL: str = "llama-3.3-70b-versatile"  # higher quality (same free limits)

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

    # ── Pollinations.ai (free image generation) ───────────────────────────────
    # Register FREE at https://auth.pollinations.ai to get Seed tier:
    #   Seed tier: 1 req/5s, no watermark
    #   Anonymous (empty): 1 req/15s, watermark added
    POLLINATIONS_TOKEN: str = ""

    # ── HuggingFace (free video generation) ──────────────────────────────────
    # Get token FREE at https://huggingface.co/settings/tokens (Read scope)
    # Without token: anonymous rate limits apply (slower queue)
    HUGGINGFACE_API_TOKEN: str = ""
    VIDEO_MAX_SCENES: int = 5  # Demo cap — covers free-tier GPU constraints

    # ── Replicate (video generation) ──────────────────────────────────────
    # Get token (free $5 credit) at https://replicate.com/account/api-tokens
    # Model: zeroscope-v2-xl — ~$0.03 per 3s clip (~150 clips on $5)
    REPLICATE_API_TOKEN: str = ""

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

    model_config = SettingsConfigDict(
        env_file=".env.local",
        env_file_encoding="utf-8",
        case_sensitive=True
    )


settings = Settings()

