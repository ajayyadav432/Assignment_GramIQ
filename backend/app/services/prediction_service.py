"""
Prediction service — orchestrates business logic for crop disease analysis.

This is the core business logic layer. It coordinates between:
  - AI Provider (disease analysis)
  - Storage Provider (image persistence)
  - Database (record persistence)

Route handlers remain thin — they only parse HTTP and delegate here.
"""

import logging
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select, cast, Date
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.base import AIProvider
from app.models.prediction import Prediction
from app.storage.base import StorageProvider

logger = logging.getLogger(__name__)


class PredictionService:
    """
    Encapsulates all prediction-related business logic.

    Dependencies are injected through the constructor, making this
    class fully testable with mock implementations.
    """

    def __init__(
        self,
        db: AsyncSession,
        ai_provider: AIProvider,
        storage: StorageProvider,
    ):
        self._db = db
        self._ai = ai_provider
        self._storage = storage

    async def create_prediction(
        self,
        image_bytes: bytes,
        image_filename: str,
        crop_type: str,
        farmer_notes: str | None = None,
    ) -> Prediction:
        """
        Full prediction pipeline: store image → analyze → persist record.

        Args:
            image_bytes: Raw uploaded image content.
            image_filename: Original filename from the upload.
            crop_type: Type of crop being analyzed.
            farmer_notes: Optional farmer observations.

        Returns:
            The persisted Prediction ORM object.
        """
        # 1. Save image to storage
        stored_filename = await self._storage.save(image_filename, image_bytes)
        logger.info(f"Image saved: {stored_filename}")

        # 2. Run AI analysis
        ai_result = await self._ai.analyze(image_bytes, crop_type, farmer_notes)
        logger.info(
            f"AI prediction: {ai_result.predicted_disease} "
            f"(confidence={ai_result.confidence}, provider={self._ai.provider_name})"
        )

        # 3. Persist prediction record
        prediction = Prediction(
            id=uuid.uuid4(),
            crop_type=crop_type,
            image_filename=stored_filename,
            farmer_notes=farmer_notes,
            predicted_disease=ai_result.predicted_disease,
            confidence=ai_result.confidence,
            severity=ai_result.severity,
            recommendation=ai_result.recommendation,
            ai_provider=self._ai.provider_name,
        )

        self._db.add(prediction)
        await self._db.commit()
        await self._db.refresh(prediction)

        return prediction

    async def get_prediction(self, prediction_id: uuid.UUID) -> Prediction | None:
        """Fetch a single prediction by ID."""
        result = await self._db.execute(
            select(Prediction).where(Prediction.id == prediction_id)
        )
        return result.scalar_one_or_none()

    async def list_predictions(
        self,
        page: int = 1,
        limit: int = 10,
        crop_type: str | None = None,
        disease: str | None = None,
    ) -> tuple[list[Prediction], int]:
        """
        Return paginated predictions with optional filtering.

        Args:
            page: Page number (1-indexed).
            limit: Items per page.
            crop_type: Optional filter by crop type.
            disease: Optional filter by disease name.

        Returns:
            Tuple of (predictions list, total count).
        """
        query = select(Prediction)
        count_query = select(func.count(Prediction.id))

        # Apply filters
        if crop_type:
            query = query.where(Prediction.crop_type.ilike(f"%{crop_type}%"))
            count_query = count_query.where(
                Prediction.crop_type.ilike(f"%{crop_type}%")
            )
        if disease:
            query = query.where(Prediction.predicted_disease.ilike(f"%{disease}%"))
            count_query = count_query.where(
                Prediction.predicted_disease.ilike(f"%{disease}%")
            )

        # Get total count
        total_result = await self._db.execute(count_query)
        total = total_result.scalar() or 0

        # Paginate — newest first
        offset = (page - 1) * limit
        query = query.order_by(Prediction.created_at.desc()).offset(offset).limit(limit)

        result = await self._db.execute(query)
        predictions = list(result.scalars().all())

        return predictions, total

    async def get_analytics_summary(self) -> dict:
        """
        Compute aggregated analytics for the dashboard.

        Returns disease distribution, daily volume (last 7 days),
        severity breakdown, average confidence, and total count.
        All computed via SQL aggregation for efficiency.
        """
        # Total predictions
        total_result = await self._db.execute(
            select(func.count(Prediction.id))
        )
        total = total_result.scalar() or 0

        # Average confidence
        avg_result = await self._db.execute(
            select(func.avg(Prediction.confidence))
        )
        avg_confidence = round(float(avg_result.scalar() or 0), 3)

        # Disease distribution (GROUP BY)
        disease_result = await self._db.execute(
            select(
                Prediction.predicted_disease,
                func.count(Prediction.id).label("count"),
            )
            .group_by(Prediction.predicted_disease)
            .order_by(func.count(Prediction.id).desc())
        )
        disease_distribution = [
            {"disease": row.predicted_disease, "count": row.count}
            for row in disease_result.all()
        ]

        # Daily volume (last 7 days)
        seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
        daily_result = await self._db.execute(
            select(
                func.date(Prediction.created_at).label("date"),
                func.count(Prediction.id).label("count"),
            )
            .where(Prediction.created_at >= seven_days_ago)
            .group_by(func.date(Prediction.created_at))
            .order_by(func.date(Prediction.created_at))
        )
        daily_volume = [
            {"date": str(row.date), "count": row.count}
            for row in daily_result.all()
        ]

        # Severity distribution
        severity_result = await self._db.execute(
            select(
                Prediction.severity,
                func.count(Prediction.id).label("count"),
            )
            .where(Prediction.severity.isnot(None))
            .group_by(Prediction.severity)
        )
        severity_distribution = {
            row.severity: row.count for row in severity_result.all()
        }

        # Top crop type
        top_crop_result = await self._db.execute(
            select(Prediction.crop_type)
            .group_by(Prediction.crop_type)
            .order_by(func.count(Prediction.id).desc())
            .limit(1)
        )
        top_crop = top_crop_result.scalar_one_or_none()

        return {
            "total_predictions": total,
            "average_confidence": avg_confidence,
            "disease_distribution": disease_distribution,
            "daily_volume": daily_volume,
            "severity_distribution": severity_distribution,
            "top_crop": top_crop,
        }
