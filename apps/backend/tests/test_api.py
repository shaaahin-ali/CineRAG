"""API endpoint tests."""

from fastapi.testclient import TestClient

FAKE_PROJECT_ID = "00000000-0000-0000-0000-000000000001"


def test_health_check(client: TestClient):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "CinePhile" in data["service"]


def test_upload_requires_auth(client: TestClient):
    response = client.post(
        f"/api/v1/projects/{FAKE_PROJECT_ID}/upload",
        files={"file": ("test.pdf", b"fake pdf content", "application/pdf")},
    )
    assert response.status_code == 401


def test_query_requires_auth(client: TestClient):
    response = client.post(
        f"/api/v1/projects/{FAKE_PROJECT_ID}/query",
        json={"query": "What is the story?"},
    )
    assert response.status_code == 401


def test_projects_requires_auth(client: TestClient):
    response = client.get("/api/v1/projects")
    assert response.status_code == 401


def test_character_graph_requires_auth(client: TestClient):
    """Character-graph endpoint must reject unauthenticated requests."""
    response = client.get(f"/api/v1/projects/{FAKE_PROJECT_ID}/character-graph")
    assert response.status_code == 401


def test_scenes_requires_auth(client: TestClient):
    """Scenes endpoint must reject unauthenticated requests."""
    response = client.get(f"/api/v1/projects/{FAKE_PROJECT_ID}/scenes")
    assert response.status_code == 401


def test_characters_requires_auth(client: TestClient):
    """Characters endpoint must reject unauthenticated requests."""
    response = client.get(f"/api/v1/projects/{FAKE_PROJECT_ID}/characters")
    assert response.status_code == 401

