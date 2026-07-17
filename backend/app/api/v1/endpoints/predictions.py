"""
Prediction endpoints — POST/GET for crop disease analysis.

Handles file upload validation, delegates to PredictionService,
and returns properly serialized Pydantic responses.
Route handlers are intentionally thin — all logic lives in the service layer.
"""

import uuid
import logging

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.base import AIProvider
from app.core.config import get_settings
from app.core.dependencies import get_ai_provider, get_db, get_storage_provider
from app.schemas.prediction import (
    PredictionListItem,
    PredictionListResponse,
    PredictionResponse,
)
from app.services.prediction_service import PredictionService
from app.storage.base import StorageProvider

logger = logging.getLogger(__name__)
router = APIRouter()

# Allowed MIME types for uploaded images
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}


def _validate_image(file: UploadFile, content: bytes) -> None:
    """
    Validate uploaded file: MIME type and file size.

    Raises HTTPException with descriptive error messages.
    """
    settings = get_settings()
    max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024

    # Check MIME type
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Invalid file type",
                "message": f"Only JPEG, PNG, and WebP images are accepted. "
                f"Received: {file.content_type}",
                "allowed_types": list(ALLOWED_MIME_TYPES),
            },
        )

    # Check file size
    if len(content) > max_bytes:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "File too large",
                "message": f"Maximum file size is {settings.MAX_FILE_SIZE_MB}MB. "
                f"Received: {len(content) / (1024 * 1024):.1f}MB",
            },
        )

    # Check if file is not empty
    if len(content) == 0:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Empty file",
                "message": "The uploaded file is empty.",
            },
        )


@router.post(
    "/predictions",
    response_model=PredictionResponse,
    status_code=201,
    summary="Create Prediction",
    description="Upload a crop image for AI-powered disease analysis.",
)
async def create_prediction(
    image: UploadFile = File(..., description="Crop image (JPEG, PNG, or WebP)"),
    crop_type: str = Form(..., description="Type of crop (e.g., Wheat, Rice, Tomato)"),
    farmer_notes: str = Form(None, description="Optional observations from the farmer"),
    db: AsyncSession = Depends(get_db),
    ai_provider: AIProvider = Depends(get_ai_provider),
    storage: StorageProvider = Depends(get_storage_provider),
):
    """
    Accept a crop image upload and return an AI-powered disease prediction.

    Flow: validate → save image → AI analysis → persist → return result.
    The AI provider and storage backend are injected via dependency injection.
    """
    # Read and validate the uploaded file
    content = await image.read()
    _validate_image(image, content)

    # Validate crop_type is not empty
    crop_type = crop_type.strip()
    if not crop_type or len(crop_type) > 100:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Invalid crop type",
                "message": "Crop type must be between 1 and 100 characters.",
            },
        )

    # Validate farmer_notes length
    if farmer_notes and len(farmer_notes) > 1000:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Notes too long",
                "message": "Farmer notes must be under 1000 characters.",
            },
        )

    # Delegate to service layer
    try:
        service = PredictionService(db, ai_provider, storage)
        prediction = await service.create_prediction(
            image_bytes=content,
            image_filename=image.filename or "upload.jpg",
            crop_type=crop_type,
            farmer_notes=farmer_notes,
        )
        return prediction

    except RuntimeError as e:
        logger.error(f"AI provider error: {e}")
        raise HTTPException(
            status_code=503,
            detail={
                "error": "AI service unavailable",
                "message": str(e),
            },
        )
    except Exception as e:
        logger.error(f"Unexpected error in create_prediction: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Internal server error",
                "message": "An unexpected error occurred. Please try again.",
            },
        )


@router.get(
    "/predictions",
    response_model=PredictionListResponse,
    summary="List Predictions",
    description="Retrieve paginated prediction history with optional filters.",
)
async def list_predictions(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    crop_type: str = Query(None, description="Filter by crop type"),
    disease: str = Query(None, description="Filter by disease name"),
    db: AsyncSession = Depends(get_db),
    ai_provider: AIProvider = Depends(get_ai_provider),
    storage: StorageProvider = Depends(get_storage_provider),
):
    """
    Return paginated list of predictions, newest first.

    Supports optional filtering by crop type and disease name.
    Filters use case-insensitive partial matching.
    """
    service = PredictionService(db, ai_provider, storage)
    predictions, total = await service.list_predictions(
        page=page,
        limit=limit,
        crop_type=crop_type,
        disease=disease,
    )

    return PredictionListResponse(
        items=[PredictionListItem.model_validate(p) for p in predictions],
        total=total,
        page=page,
        limit=limit,
    )


@router.get(
    "/predictions/{prediction_id}",
    response_model=PredictionResponse,
    summary="Get Prediction Detail",
    description="Retrieve full details of a specific prediction by ID.",
)
async def get_prediction(
    prediction_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    ai_provider: AIProvider = Depends(get_ai_provider),
    storage: StorageProvider = Depends(get_storage_provider),
):
    """
    Fetch a single prediction by UUID.

    Returns 404 if the prediction does not exist.
    """
    service = PredictionService(db, ai_provider, storage)
    prediction = await service.get_prediction(prediction_id)

    if not prediction:
        raise HTTPException(
            status_code=404,
            detail={
                "error": "Not found",
                "message": f"Prediction with ID {prediction_id} does not exist.",
            },
        )

    return prediction
