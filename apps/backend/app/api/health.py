"""Health check endpoint."""

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class HealthResponse(BaseModel):
    status: str
    version: str
    service: str


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """
    Liveness probe — used by Render health check and cron-job.org keepalive.
    Returns 200 OK if the service is running.
    """
    return HealthResponse(
        status="ok",
        version="1.0.0",
        service="CinePhile Malayalam Edition",
    )
