"""
Supabase client wrapper — shared across all services.
Uses service role key for server-side operations (bypasses RLS when needed).
"""

import logging

from supabase import Client, create_client

from app.core.config import settings

logger = logging.getLogger(__name__)

_client: Client | None = None


def SupabaseClient() -> Client:
    """Return a singleton Supabase client (service role)."""
    global _client
    if _client is None:
        _client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_ROLE_KEY,
        )
        logger.debug("Supabase client initialized")
    return _client
