"""
CSV export endpoint — allows downloading prediction history as CSV.

Bonus feature: Enables offline analysis and record-keeping for farmers
and agricultural officers.
"""

import csv
import io
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db
from app.models.prediction import Prediction

router = APIRouter()


@router.get(
    "/predictions/export",
    summary="Export Predictions as CSV",
    description="Download prediction history as a CSV file for offline analysis.",
)
async def export_predictions_csv(
    crop_type: str = Query(None, description="Filter by crop type"),
    disease: str = Query(None, description="Filter by disease name"),
    db: AsyncSession = Depends(get_db),
):
    """
    Stream all predictions (optionally filtered) as a CSV file.

    Returns a downloadable CSV with columns:
    Date, Crop Type, Disease, Confidence, Severity, Recommendation, AI Provider.
    """
    query = select(Prediction).order_by(Prediction.created_at.desc())

    if crop_type:
        query = query.where(Prediction.crop_type.ilike(f"%{crop_type}%"))
    if disease:
        query = query.where(Prediction.predicted_disease.ilike(f"%{disease}%"))

    result = await db.execute(query)
    predictions = result.scalars().all()

    # Generate CSV in memory
    output = io.StringIO()
    writer = csv.writer(output)

    # Header row
    writer.writerow([
        "Date",
        "Crop Type",
        "Disease",
        "Confidence (%)",
        "Severity",
        "Recommendation",
        "Farmer Notes",
        "AI Provider",
    ])

    # Data rows
    for p in predictions:
        writer.writerow([
            p.created_at.strftime("%Y-%m-%d %H:%M") if p.created_at else "",
            p.crop_type,
            p.predicted_disease,
            f"{p.confidence * 100:.1f}",
            p.severity or "",
            p.recommendation or "",
            p.farmer_notes or "",
            p.ai_provider,
        ])

    output.seek(0)

    # Generate timestamped filename
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    filename = f"krishi_predictions_{timestamp}.csv"

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
