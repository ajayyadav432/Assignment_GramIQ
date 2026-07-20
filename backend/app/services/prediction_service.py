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
from app.ai.embedding import generate_embedding, cosine_similarity

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
        farmer_id: uuid.UUID,
        farmer_notes: str | None = None,
        location: str | None = None,
        language: str | None = None,
    ) -> Prediction:
        """
        Full prediction pipeline: store image → RAG retrieval → analyze → persist record.
        """
        # 1. Save image to storage
        stored_filename = await self._storage.save(image_filename, image_bytes)
        logger.info(f"Image saved: {stored_filename}")

        # 2. Generate embedding for notes & crop type
        embedding = None
        rag_context = ""
        try:
            embedding_text = f"{crop_type}: {farmer_notes or ''}"
            embedding = await generate_embedding(embedding_text)

            # RAG: Find similar reviewed predictions for the same crop type
            result = await self._db.execute(
                select(Prediction)
                .where(Prediction.status == "REVIEWED")
                .where(Prediction.crop_type == crop_type)
                .where(Prediction.notes_embedding.isnot(None))
            )
            candidates = result.scalars().all()

            scored = []
            for cand in candidates:
                if cand.notes_embedding:
                    sim = cosine_similarity(embedding, cand.notes_embedding)
                    scored.append((sim, cand))

            # Sort by similarity descending
            scored.sort(key=lambda x: x[0], reverse=True)
            top_similar = scored[:2]

            if top_similar:
                rag_context = "\n\n=== BIOBANK HISTORICAL CASES (Agronomist Verified) ===\n"
                for idx, (sim, cand) in enumerate(top_similar):
                    rag_context += f"Case {idx+1} (Similarity: {sim:.2f}):\n"
                    rag_context += f"- Farmer Observations: {cand.farmer_notes or 'None'}\n"
                    rag_context += f"- Verified Diagnosis: {cand.agronomist_predicted_disease or cand.predicted_disease}\n"
                    rag_context += f"- Verified Treatment/Advisory: {cand.agronomist_review or cand.recommendation}\n\n"
                logger.info(f"RAG found {len(top_similar)} similar cases. Injected as context.")
        except Exception as e:
            logger.warning(f"RAG or embedding generation failed: {e}", exc_info=True)

        # Append RAG context to notes sent to AI
        ai_notes = (farmer_notes or "") + rag_context

        # 3. Run AI analysis
        ai_result = await self._ai.analyze(image_bytes, crop_type, ai_notes)
        logger.info(
            f"AI prediction: {ai_result.predicted_disease} "
            f"(confidence={ai_result.confidence}, provider={self._ai.provider_name})"
        )

        # 4. Persist prediction record
        prediction = Prediction(
            id=uuid.uuid4(),
            crop_type=crop_type,
            image_filename=stored_filename,
            farmer_notes=farmer_notes,
            predicted_disease=ai_result.predicted_disease,
            confidence=ai_result.confidence,
            severity=ai_result.severity,
            recommendation=ai_result.recommendation,
            possible_reasons=ai_result.possible_reasons,
            location=location,
            language=language,
            ai_provider=self._ai.provider_name,
            farmer_id=farmer_id,
            status="PENDING_REVIEW",
            notes_embedding=embedding,
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
        farmer_id: uuid.UUID | None = None,
        status: str | None = None,
    ) -> tuple[list[Prediction], int]:
        """
        Return paginated predictions with optional filtering.
        """
        query = select(Prediction)
        count_query = select(func.count(Prediction.id))

        # Apply filters
        if farmer_id:
            query = query.where(Prediction.farmer_id == farmer_id)
            count_query = count_query.where(Prediction.farmer_id == farmer_id)
        if status:
            query = query.where(Prediction.status == status)
            count_query = count_query.where(Prediction.status == status)
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

        # Daily volume (last 7 days) - pre-populate with 0 to ensure continuous time series chart
        daily_map = {}
        for i in range(7):
            d = (datetime.now(timezone.utc) - timedelta(days=i)).date()
            daily_map[str(d)] = 0

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
        
        for row in daily_result.all():
            date_str = str(row.date)
            if date_str in daily_map:
                daily_map[date_str] = row.count

        daily_volume = [
            {"date": d_str, "count": count}
            for d_str, count in sorted(daily_map.items())
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

    async def create_prediction_placeholder(
        self,
        image_bytes: bytes,
        image_filename: str,
        crop_type: str,
        farmer_id: uuid.UUID,
        farmer_notes: str | None = None,
        location: str | None = None,
        language: str | None = None,
        ai_provider_name: str | None = None,
    ) -> Prediction:
        """
        Creates a fast database placeholder record, persisting the image immediately.
        The heavy AI analysis is deferred to a background task.
        """
        stored_filename = await self._storage.save(image_filename, image_bytes)
        logger.info(f"Image saved: {stored_filename}")

        prediction = Prediction(
            id=uuid.uuid4(),
            crop_type=crop_type,
            image_filename=stored_filename,
            farmer_notes=farmer_notes,
            predicted_disease="Analyzing...",
            confidence=0.0,
            severity="Pending",
            recommendation="AI is analyzing your crop image. Results will appear shortly.",
            possible_reasons="Analyzing...",
            location=location,
            language=language,
            ai_provider=ai_provider_name or self._ai.provider_name,
            farmer_id=farmer_id,
            status="PENDING_REVIEW",
        )

        self._db.add(prediction)
        await self._db.commit()
        await self._db.refresh(prediction)
        return prediction


async def process_prediction_background(
    prediction_id: uuid.UUID,
    image_bytes: bytes,
    crop_type: str,
    farmer_notes: str | None,
    ai_provider_name: str | None,
):
    """
    Asynchronous background task to run RAG matching, call the AI PATH provider,
    and update the database prediction record.
    """
    from app.core.database import async_session_factory
    from app.core.dependencies import get_ai_provider_by_name
    from app.ai.embedding import generate_embedding, cosine_similarity
    from app.models.prediction import Prediction
    from sqlalchemy import select

    logger.info(f"Starting async background analysis for prediction {prediction_id}")

    # 1. Resolve AI provider
    try:
        if ai_provider_name and ai_provider_name.strip():
            ai = get_ai_provider_by_name(ai_provider_name.strip().lower())
        else:
            from app.core.config import get_settings
            settings = get_settings()
            ai = get_ai_provider_by_name(settings.AI_PROVIDER)
    except Exception as e:
        logger.error(f"Failed to load AI provider in background: {e}", exc_info=True)
        return

    # 2. Run embedding & RAG search
    embedding = None
    rag_context = ""
    try:
        embedding_text = f"{crop_type}: {farmer_notes or ''}"
        embedding = await generate_embedding(embedding_text)

        async with async_session_factory() as session:
            # Query reviewed predictions for RAG similarity
            result = await session.execute(
                select(Prediction)
                .where(Prediction.status == "REVIEWED")
                .where(Prediction.crop_type == crop_type)
                .where(Prediction.notes_embedding.isnot(None))
            )
            candidates = result.scalars().all()

            scored = []
            for cand in candidates:
                if cand.notes_embedding:
                    sim = cosine_similarity(embedding, cand.notes_embedding)
                    scored.append((sim, cand))

            scored.sort(key=lambda x: x[0], reverse=True)
            top_similar = scored[:2]

            if top_similar:
                rag_context = "\n\n=== BIOBANK HISTORICAL CASES (Agronomist Verified) ===\n"
                for idx, (sim, cand) in enumerate(top_similar):
                    rag_context += f"Case {idx+1} (Similarity: {sim:.2f}):\n"
                    rag_context += f"- Farmer Observations: {cand.farmer_notes or 'None'}\n"
                    rag_context += f"- Verified Diagnosis: {cand.agronomist_predicted_disease or cand.predicted_disease}\n"
                    rag_context += f"- Verified Treatment/Advisory: {cand.agronomist_review or cand.recommendation}\n\n"
                logger.info(f"Background RAG found {len(top_similar)} similar cases.")
    except Exception as e:
        logger.warning(f"Background RAG/Embedding generation failed: {e}", exc_info=True)

    # 3. Call AI analysis
    ai_notes = (farmer_notes or "") + rag_context
    try:
        ai_result = await ai.analyze(image_bytes, crop_type, ai_notes)
        logger.info(f"Background AI completed: {ai_result.predicted_disease} for prediction {prediction_id}")
    except Exception as e:
        logger.error(f"Background AI analysis failed for prediction {prediction_id}: {e}", exc_info=True)
        async with async_session_factory() as session:
            res = await session.execute(select(Prediction).where(Prediction.id == prediction_id))
            pred = res.scalar_one_or_none()
            if pred:
                pred.predicted_disease = "AI Error"
                pred.recommendation = f"Error during AI analysis: {str(e)}. Please retry or consult an agronomist."
                pred.possible_reasons = "System Error"
                session.add(pred)
                await session.commit()
        return

    # 4. Save results to DB
    async with async_session_factory() as session:
        res = await session.execute(select(Prediction).where(Prediction.id == prediction_id))
        pred = res.scalar_one_or_none()
        if pred:
            pred.predicted_disease = ai_result.predicted_disease
            pred.confidence = ai_result.confidence
            pred.severity = ai_result.severity
            pred.recommendation = ai_result.recommendation
            pred.possible_reasons = ai_result.possible_reasons
            pred.notes_embedding = embedding
            pred.ai_provider = ai.provider_name
            session.add(pred)
            await session.commit()
            logger.info(f"Background prediction {prediction_id} successfully saved to database.")
