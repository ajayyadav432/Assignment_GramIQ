"""
SQLAlchemy 2.0 ORM model for the predictions table.

Uses UUID primary keys, TIMESTAMPTZ for timezone-aware timestamps,
and strategic indexes on frequently queried columns.
"""

import uuid
from datetime import datetime

from sqlalchemy import Float, Index, String, Text, text, Uuid
from sqlalchemy.dialects.postgresql import TIMESTAMP
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Prediction(Base):
    """
    Represents a single crop disease prediction record.

    Each record stores the uploaded image reference, AI analysis results,
    and metadata about the prediction request.
    """

    __tablename__ = "predictions"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    crop_type: Mapped[str] = mapped_column(
        String(100), nullable=False, doc="Crop name (e.g., Wheat, Rice, Tomato)"
    )
    image_filename: Mapped[str] = mapped_column(
        String(255), nullable=True, doc="Stored filename of the uploaded image"
    )
    farmer_notes: Mapped[str | None] = mapped_column(
        Text, nullable=True, doc="Optional observations from the farmer"
    )
    predicted_disease: Mapped[str] = mapped_column(
        String(150), nullable=False, doc="Disease identified by the AI provider"
    )
    confidence: Mapped[float] = mapped_column(
        Float, nullable=False, doc="Prediction confidence score (0.0–1.0)"
    )
    severity: Mapped[str | None] = mapped_column(
        String(50), nullable=True, doc="Severity level: Low, Medium, or High"
    )
    recommendation: Mapped[str | None] = mapped_column(
        Text, nullable=True, doc="Actionable treatment recommendation"
    )
    ai_provider: Mapped[str] = mapped_column(
        String(50), nullable=False, doc="AI provider used (e.g., mock, gemini)"
    )
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP"),
        doc="Timezone-aware creation timestamp",
    )

    # Strategic indexes for analytics queries
    __table_args__ = (
        Index("idx_predictions_created_at", "created_at"),
        Index("idx_predictions_disease", "predicted_disease"),
        Index("idx_predictions_crop_type", "crop_type"),
    )

    def __repr__(self) -> str:
        return (
            f"<Prediction(id={self.id}, crop={self.crop_type}, "
            f"disease={self.predicted_disease}, confidence={self.confidence})>"
        )
