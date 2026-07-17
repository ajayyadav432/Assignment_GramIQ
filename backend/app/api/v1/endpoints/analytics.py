"""
Analytics endpoint — aggregated dashboard statistics.

All aggregation is performed via SQL (not in Python) for efficiency.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.base import AIProvider
from app.core.dependencies import get_ai_provider, get_db, get_storage_provider
from app.schemas.prediction import AnalyticsSummaryResponse
from app.services.prediction_service import PredictionService
from app.storage.base import StorageProvider

router = APIRouter()


@router.get(
    "/analytics/summary",
    response_model=AnalyticsSummaryResponse,
    summary="Analytics Summary",
    description="Aggregated statistics for the analytics dashboard.",
)
async def get_analytics_summary(
    db: AsyncSession = Depends(get_db),
    ai_provider: AIProvider = Depends(get_ai_provider),
    storage: StorageProvider = Depends(get_storage_provider),
):
    """
    Return aggregated analytics including disease distribution,
    daily prediction volume, severity breakdown, and averages.

    All aggregation uses SQL GROUP BY — no full-table scans in Python.
    """
    service = PredictionService(db, ai_provider, storage)
    summary = await service.get_analytics_summary()
    return AnalyticsSummaryResponse(**summary)
