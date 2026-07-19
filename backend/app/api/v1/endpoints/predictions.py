"""
Prediction endpoints — POST/GET for crop disease analysis.

Handles file upload validation, delegates to PredictionService,
and returns properly serialized Pydantic responses.
Route handlers are intentionally thin — all logic lives in the service layer.
"""

import uuid
import logging

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, Query, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession

from datetime import datetime, timezone
from app.ai.base import AIProvider
from app.core.config import get_settings
from app.core.dependencies import (
    get_ai_provider,
    get_ai_provider_by_name,
    get_db,
    get_storage_provider,
    get_current_user,
    get_current_farmer,
    get_current_agronomist
)
from app.models.user import User
from app.schemas.prediction import (
    PredictionListItem,
    PredictionListResponse,
    PredictionResponse,
    AgronomistReviewRequest,
)
from app.services.prediction_service import PredictionService, process_prediction_background
from app.storage.base import StorageProvider

logger = logging.getLogger(__name__)
router = APIRouter()


def mask_prediction(p, user_role: str):
    """
    Mask raw AI response fields if prediction is pending review and user is not an Agronomist or Admin.
    If prediction is reviewed, return agronomist's verified diagnosis and review notes.
    """
    if user_role in ("AGRONOMIST", "ADMIN"):
        return {
            "id": p.id,
            "crop_type": p.crop_type,
            "image_filename": p.image_filename,
            "farmer_notes": p.farmer_notes,
            "predicted_disease": p.predicted_disease,
            "confidence": p.confidence,
            "severity": p.severity,
            "recommendation": p.recommendation,
            "possible_reasons": p.possible_reasons,
            "location": p.location,
            "language": p.language,
            "ai_provider": p.ai_provider,
            "created_at": p.created_at,
            "farmer_id": p.farmer_id,
            "agronomist_id": p.agronomist_id,
            "status": p.status,
            "agronomist_review": p.agronomist_review,
            "agronomist_predicted_disease": p.agronomist_predicted_disease,
            "agronomist_severity": p.agronomist_severity,
            "reviewed_at": p.reviewed_at
        }
    
    if p.status == "PENDING_REVIEW":
        return {
            "id": p.id,
            "crop_type": p.crop_type,
            "image_filename": p.image_filename,
            "farmer_notes": p.farmer_notes,
            "predicted_disease": "Pending Review",
            "confidence": 0.0,
            "severity": "Pending",
            "recommendation": "Our agricultural expert is currently reviewing this prediction. You will receive the advice once verified.",
            "possible_reasons": "Pending Review",
            "location": p.location,
            "language": p.language,
            "ai_provider": "Hidden",
            "created_at": p.created_at,
            "farmer_id": p.farmer_id,
            "agronomist_id": p.agronomist_id,
            "status": p.status,
            "agronomist_review": None,
            "agronomist_predicted_disease": None,
            "agronomist_severity": None,
            "reviewed_at": None
        }
    
    # Reviewed status: show agronomist's verified information
    return {
        "id": p.id,
        "crop_type": p.crop_type,
        "image_filename": p.image_filename,
        "farmer_notes": p.farmer_notes,
        "predicted_disease": p.agronomist_predicted_disease or p.predicted_disease,
        "confidence": p.confidence,
        "severity": p.agronomist_severity or p.severity,
        "recommendation": p.agronomist_review or p.recommendation,
        "possible_reasons": p.possible_reasons,
        "location": p.location,
        "language": p.language,
        "ai_provider": p.ai_provider,
        "created_at": p.created_at,
        "farmer_id": p.farmer_id,
        "agronomist_id": p.agronomist_id,
        "status": p.status,
        "agronomist_review": p.agronomist_review,
        "agronomist_predicted_disease": p.agronomist_predicted_disease,
        "agronomist_severity": p.agronomist_severity,
        "reviewed_at": p.reviewed_at
    }


def mask_prediction_list_item(p, user_role: str):
    """
    Lightweight masking for the predictions list view.
    """
    if user_role in ("AGRONOMIST", "ADMIN"):
        return p
    
    if p.status == "PENDING_REVIEW":
        return {
            "id": p.id,
            "crop_type": p.crop_type,
            "image_filename": p.image_filename,
            "predicted_disease": "Pending Review",
            "confidence": 0.0,
            "severity": "Pending",
            "ai_provider": "Hidden",
            "created_at": p.created_at,
            "status": p.status,
            "farmer_id": p.farmer_id,
            "agronomist_id": p.agronomist_id
        }
    
    return {
        "id": p.id,
        "crop_type": p.crop_type,
        "image_filename": p.image_filename,
        "predicted_disease": p.agronomist_predicted_disease or p.predicted_disease,
        "confidence": p.confidence,
        "severity": p.agronomist_severity or p.severity,
        "ai_provider": p.ai_provider,
        "created_at": p.created_at,
        "status": p.status,
        "farmer_id": p.farmer_id,
        "agronomist_id": p.agronomist_id
    }

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
    background_tasks: BackgroundTasks,
    image: UploadFile = File(..., description="Crop image (JPEG, PNG, or WebP)"),
    crop_type: str = Form(..., description="Type of crop (e.g., Wheat, Rice, Tomato)"),
    farmer_notes: str = Form(None, description="Optional observations from the farmer"),
    location: str = Form(None, description="Location/Region of the farmer"),
    language: str = Form(None, description="Language for diagnosis translation"),
    ai_provider_name: str = Form(None, description="Optional AI provider override: mock, gemini, groq, openai"),
    db: AsyncSession = Depends(get_db),
    ai_provider: AIProvider = Depends(get_ai_provider),
    storage: StorageProvider = Depends(get_storage_provider),
    current_user: User = Depends(get_current_farmer),
):
    """
    Accept a crop image upload and return a pending prediction.
    """
    # Allow per-request provider override from the frontend model selector
    if ai_provider_name and ai_provider_name.strip():
        ai_provider = get_ai_provider_by_name(ai_provider_name.strip().lower())

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
        prediction = await service.create_prediction_placeholder(
            image_bytes=content,
            image_filename=image.filename or "upload.jpg",
            crop_type=crop_type,
            farmer_id=current_user.id,
            farmer_notes=farmer_notes,
            location=location,
            language=language,
            ai_provider_name=ai_provider_name,
        )
        
        # Queue processing task to execute asynchronously
        background_tasks.add_task(
            process_prediction_background,
            prediction.id,
            content,
            crop_type,
            farmer_notes,
            ai_provider_name,
        )
        
        return mask_prediction(prediction, current_user.role)

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
    status: str = Query(None, description="Filter by status (PENDING_REVIEW, REVIEWED)"),
    db: AsyncSession = Depends(get_db),
    ai_provider: AIProvider = Depends(get_ai_provider),
    storage: StorageProvider = Depends(get_storage_provider),
    current_user: User = Depends(get_current_user),
):
    """
    Return paginated list of predictions, newest first.
    If the user is a Farmer, only show their own predictions.
    If Agronomist, show all predictions.
    """
    farmer_id = current_user.id if current_user.role == "FARMER" else None

    service = PredictionService(db, ai_provider, storage)
    predictions, total = await service.list_predictions(
        page=page,
        limit=limit,
        crop_type=crop_type,
        disease=disease,
        farmer_id=farmer_id,
        status=status,
    )

    return PredictionListResponse(
        items=[PredictionListItem.model_validate(mask_prediction_list_item(p, current_user.role)) for p in predictions],
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
    current_user: User = Depends(get_current_user),
):
    """
    Fetch a single prediction by UUID.
    Checks ownership for Farmers.
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

    # Authorization check
    if current_user.role == "FARMER" and prediction.farmer_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail={
                "error": "Forbidden",
                "message": "You do not have permission to view this prediction.",
            },
        )

    return mask_prediction(prediction, current_user.role)


@router.post(
    "/predictions/{prediction_id}/review",
    response_model=PredictionResponse,
    summary="Review Prediction",
    description="Review a pending prediction request (Agronomist only).",
)
async def review_prediction(
    prediction_id: uuid.UUID,
    review_in: AgronomistReviewRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_agronomist),
):
    """
    Review a pending prediction request (Agronomist only).
    """
    service = PredictionService(db, None, None)
    prediction = await service.get_prediction(prediction_id)

    if not prediction:
        raise HTTPException(
            status_code=404,
            detail={
                "error": "Not found",
                "message": f"Prediction with ID {prediction_id} does not exist.",
            },
        )

    # Update prediction fields
    prediction.status = "REVIEWED"
    prediction.agronomist_id = current_user.id
    prediction.agronomist_predicted_disease = review_in.predicted_disease
    prediction.agronomist_severity = review_in.severity
    prediction.agronomist_review = review_in.review
    prediction.reviewed_at = datetime.now(timezone.utc)

    db.add(prediction)
    await db.commit()
    await db.refresh(prediction)

    logger.info(f"Agronomist {current_user.username} reviewed prediction {prediction_id}")
    return prediction
