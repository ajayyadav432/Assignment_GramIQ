"""
Health check endpoint.

Validates application liveliness and database connectivity.
Returns version info for monitoring and debugging.
"""

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.dependencies import get_db
from app.schemas.prediction import HealthResponse

router = APIRouter()


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Health Check",
    description="Verify application and database health status.",
)
async def health_check(db: AsyncSession = Depends(get_db)):
    """
    Return application health status including database connectivity.

    Returns 200 with status 'ok' if everything is healthy.
    Returns 200 with status 'degraded' if database is unreachable
    (application is still running but database is down).
    """
    settings = get_settings()
    db_status = "connected"

    try:
        await db.execute(text("SELECT 1"))
    except Exception:
        db_status = "disconnected"

    return HealthResponse(
        status="ok" if db_status == "connected" else "degraded",
        version=settings.APP_VERSION,
        database=db_status,
    )
