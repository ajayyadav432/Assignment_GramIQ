"""
API v1 router — aggregates all endpoint routers under /api/v1.
"""

from fastapi import APIRouter

from app.api.v1.endpoints import health, predictions, analytics, export, auth, translate

router = APIRouter()

# Health check is at the root level (no prefix)
router.include_router(health.router, tags=["Health"])

# Authentication endpoints
router.include_router(auth.router, prefix="/api/v1", tags=["Auth"])

# Translation endpoints
router.include_router(translate.router, prefix="/api/v1", tags=["Translation"])

# Prediction and analytics endpoints under /api/v1
# Include export first so /predictions/export is matched before /predictions/{prediction_id}
router.include_router(export.router, prefix="/api/v1", tags=["Export"])
router.include_router(predictions.router, prefix="/api/v1", tags=["Predictions"])
router.include_router(analytics.router, prefix="/api/v1", tags=["Analytics"])

