"""API endpoint tests."""

from fastapi.testclient import TestClient


def test_health_check(client: TestClient):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "CinePhile" in data["service"]


def test_upload_requires_auth(client: TestClient):
    response = client.post(
        "/api/v1/projects/00000000-0000-0000-0000-000000000001/upload",
        files={"file": ("test.pdf", b"fake pdf content", "application/pdf")},
    )
    assert response.status_code == 401


def test_query_requires_auth(client: TestClient):
    response = client.post(
        "/api/v1/projects/00000000-0000-0000-0000-000000000001/query",
        json={"query": "What is the story?"},
    )
    assert response.status_code == 401


def test_projects_requires_auth(client: TestClient):
    response = client.get("/api/v1/projects")
    assert response.status_code == 401
