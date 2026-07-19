"""
Pydantic V2 schemas for prediction request validation and response serialization.

These schemas define the strict API contract between frontend and backend.
They ensure type safety, automatic validation, and clean OpenAPI documentation.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict


# ---------- Response Schemas ----------


class PredictionResponse(BaseModel):
    """Full prediction record returned by the API."""

    id: UUID
    crop_type: str
    image_filename: str | None = None
    farmer_notes: str | None = None
    predicted_disease: str
    confidence: float = Field(ge=0.0, le=1.0)
    severity: str | None = None
    recommendation: str | None = None
    ai_provider: str
    created_at: datetime
    
    # User profiles and Agronomist review workflow
    farmer_id: UUID | None = None
    agronomist_id: UUID | None = None
    status: str
    agronomist_review: str | None = None
    agronomist_predicted_disease: str | None = None
    agronomist_severity: str | None = None
    reviewed_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class PredictionListItem(BaseModel):
    """Lightweight prediction summary for list views."""

    id: UUID
    crop_type: str
    image_filename: str | None = None
    predicted_disease: str
    confidence: float = Field(ge=0.0, le=1.0)
    severity: str | None = None
    ai_provider: str
    created_at: datetime
    status: str
    farmer_id: UUID | None = None
    agronomist_id: UUID | None = None

    model_config = ConfigDict(from_attributes=True)


class AgronomistReviewRequest(BaseModel):
    """Advisory inputs submitted by an agronomist."""

    predicted_disease: str = Field(..., min_length=1, max_length=150, description="Verified disease name")
    severity: str = Field(..., description="Verified severity level (Low, Medium, High)")
    review: str = Field(..., min_length=1, description="Treatment recommendation or advisory comments")


class PredictionListResponse(BaseModel):
    """Paginated list of predictions."""

    items: list[PredictionListItem]
    total: int
    page: int
    limit: int


# ---------- Analytics Schemas ----------


class DiseaseCount(BaseModel):
    """Disease name and its occurrence count."""

    disease: str
    count: int


class DailyCount(BaseModel):
    """Date and prediction count for that day."""

    date: str
    count: int


class AnalyticsSummaryResponse(BaseModel):
    """Aggregated analytics summary for the dashboard."""

    total_predictions: int
    average_confidence: float
    disease_distribution: list[DiseaseCount]
    daily_volume: list[DailyCount]
    severity_distribution: dict[str, int]
    top_crop: str | None = None


# ---------- Health Schema ----------


class HealthResponse(BaseModel):
    """Health check response."""

    status: str
    version: str
    database: str
