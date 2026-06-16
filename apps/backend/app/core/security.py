"""
Security utilities — JWT verification, rate limiting configuration.
"""

import base64
import json
import logging
from typing import Optional

from fastapi import HTTPException, Request, status
from fastapi.security import HTTPBearer
from slowapi import Limiter
from slowapi.util import get_remote_address

logger = logging.getLogger(__name__)

# ── Rate Limiter ──────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)

# ── Bearer Token Extractor ─────────────────────────────────────────────────────
bearer_scheme = HTTPBearer(auto_error=False)


def extract_token(request: Request) -> Optional[str]:
    """Extract Bearer token from Authorization header."""
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header.removeprefix("Bearer ").strip()
    return None


def _decode_jwt_payload(token: str) -> dict:
    """Decode JWT payload without verifying signature (demo/dev mode)."""
    try:
        parts = token.split(".")
        if len(parts) != 3:
            raise ValueError("Invalid JWT structure")
        # Add padding if needed
        payload_b64 = parts[1]
        padding = 4 - len(payload_b64) % 4
        if padding != 4:
            payload_b64 += "=" * padding
        payload_bytes = base64.urlsafe_b64decode(payload_b64)
        return json.loads(payload_bytes)
    except Exception as e:
        raise ValueError(f"Failed to decode JWT payload: {e}") from e


def verify_token(token: str) -> dict:
    """
    Verify a Supabase-issued JWT.
    Decodes the token payload to extract the user_id (sub claim).
    Demo mode: skips signature verification.
    """
    try:
        payload = _decode_jwt_payload(token)
        user_id: str = payload.get("sub", "")
        if not user_id:
            raise ValueError("Token has no subject (sub) claim")
        return payload
    except Exception as e:
        logger.warning(f"Token verification failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_user_id(token: str) -> str:
    """Extract user_id (sub) from a verified token."""
    payload = verify_token(token)
    return payload["sub"]
