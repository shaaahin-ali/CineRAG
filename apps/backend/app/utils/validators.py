"""Input validation helpers."""

from __future__ import annotations

import re


def sanitize_text(text: str, max_length: int = 5000) -> str:
    """Remove null bytes, strip whitespace, truncate."""
    text = text.replace("\x00", "").strip()
    return text[:max_length]


def is_valid_project_title(title: str) -> bool:
    """Project titles: 1-200 chars, no control characters."""
    return bool(title) and len(title) <= 200 and not re.search(r"[\x00-\x1f]", title)


def is_valid_email(email: str) -> bool:
    """Basic email format check."""
    pattern = re.compile(r"^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$")
    return bool(pattern.match(email))
