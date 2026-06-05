"""
Pytest configuration and shared fixtures.
"""

import pytest
from fastapi.testclient import TestClient

# Mock environment variables before importing app
import os
os.environ.setdefault("SUPABASE_URL", "https://mock.supabase.co")
os.environ.setdefault("SUPABASE_ANON_KEY", "mock-anon-key")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "mock-service-key")
os.environ.setdefault("PINECONE_API_KEY", "mock-pinecone-key")
os.environ.setdefault("OPENAI_API_KEY", "mock-openai-key")
os.environ.setdefault("ANTHROPIC_API_KEY", "mock-anthropic-key")
os.environ.setdefault("COHERE_API_KEY", "mock-cohere-key")
os.environ.setdefault("JWT_SECRET", "test-jwt-secret-key-for-testing-only")


@pytest.fixture(scope="module")
def client():
    from main import app
    with TestClient(app) as c:
        yield c


@pytest.fixture
def sample_screenplay_text():
    return """
INT. LIVING ROOM - DAY

HARI sits at the kitchen table, staring at an old photograph.

ANMOL enters, carrying groceries.

ANMOL
What are you looking at?

HARI
Nothing. Just thinking.

EXT. BACKWATERS - SUNSET

The boat glides silently through the water.
HARI and ANMOL sit at opposite ends, not speaking.

ANMOL (V.O.)
There are things we never say
but always feel.

INT. BEDROOM - NIGHT

HARI lies awake, ceiling fan turning slowly overhead.
The photograph is on the nightstand.
"""
