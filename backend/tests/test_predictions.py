"""Tests for the prediction endpoints."""

import io
import pytest


@pytest.mark.asyncio
async def test_create_prediction_success(client, sample_image):
    """POST /api/v1/predictions with valid data should return 201."""
    response = await client.post(
        "/api/v1/predictions",
        files={"image": ("test_crop.jpg", io.BytesIO(sample_image), "image/jpeg")},
        data={"crop_type": "Wheat", "farmer_notes": "Yellow spots on leaves"},
    )
    assert response.status_code == 201

    data = response.json()
    assert data["crop_type"] == "Wheat"
    assert data["farmer_notes"] == "Yellow spots on leaves"
    assert data["predicted_disease"] == "Pending Review"
    assert data["confidence"] == 0.0
    assert data["ai_provider"] == "Hidden"
    assert "id" in data
    assert "created_at" in data


@pytest.mark.asyncio
async def test_create_prediction_missing_image(client):
    """POST without image should return 422."""
    response = await client.post(
        "/api/v1/predictions",
        data={"crop_type": "Wheat"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_prediction_invalid_file_type(client):
    """POST with non-image file should return 400."""
    response = await client.post(
        "/api/v1/predictions",
        files={"image": ("test.txt", io.BytesIO(b"not an image"), "text/plain")},
        data={"crop_type": "Wheat"},
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_create_prediction_empty_crop_type(client, sample_image):
    """POST with empty crop_type should return 400."""
    response = await client.post(
        "/api/v1/predictions",
        files={"image": ("test.jpg", io.BytesIO(sample_image), "image/jpeg")},
        data={"crop_type": "   "},
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_list_predictions(client, sample_image):
    """GET /api/v1/predictions should return paginated list."""
    # Create a prediction first
    await client.post(
        "/api/v1/predictions",
        files={"image": ("test.jpg", io.BytesIO(sample_image), "image/jpeg")},
        data={"crop_type": "Rice"},
    )

    response = await client.get("/api/v1/predictions")
    assert response.status_code == 200

    data = response.json()
    assert "items" in data
    assert "total" in data
    assert "page" in data
    assert "limit" in data
    assert len(data["items"]) > 0


@pytest.mark.asyncio
async def test_list_predictions_with_filter(client):
    """GET /api/v1/predictions with crop_type filter should work."""
    response = await client.get("/api/v1/predictions?crop_type=Wheat")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_get_prediction_detail(client, sample_image):
    """GET /api/v1/predictions/{id} should return full prediction."""
    # Create a prediction
    create_response = await client.post(
        "/api/v1/predictions",
        files={"image": ("test.jpg", io.BytesIO(sample_image), "image/jpeg")},
        data={"crop_type": "Tomato"},
    )
    prediction_id = create_response.json()["id"]

    # Fetch the detail
    response = await client.get(f"/api/v1/predictions/{prediction_id}")
    assert response.status_code == 200

    data = response.json()
    assert data["id"] == prediction_id
    assert data["crop_type"] == "Tomato"


@pytest.mark.asyncio
async def test_get_prediction_not_found(client):
    """GET /api/v1/predictions/{invalid_id} should return 404."""
    response = await client.get(
        "/api/v1/predictions/00000000-0000-0000-0000-000000000000"
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_agronomist_review_flow(client, sample_image):
    """POST /predictions/{id}/review should allow Agronomists to verify and publish AI responses."""
    # 1. Create a prediction (as Farmer by default override)
    create_response = await client.post(
        "/api/v1/predictions",
        files={"image": ("test.jpg", io.BytesIO(sample_image), "image/jpeg")},
        data={"crop_type": "Wheat", "farmer_notes": "Rust spots"},
    )
    assert create_response.status_code == 201
    pred_id = create_response.json()["id"]

    # 2. Verify it is pending review and details are masked
    detail_response = await client.get(f"/api/v1/predictions/{pred_id}")
    assert detail_response.json()["status"] == "PENDING_REVIEW"
    assert detail_response.json()["predicted_disease"] == "Pending Review"

    # 3. Submit Agronomist review (using client which overrides to test_agronomist)
    review_response = await client.post(
        f"/api/v1/predictions/{pred_id}/review",
        json={
            "predicted_disease": "Yellow Rust",
            "severity": "Medium",
            "review": "Fungicide recommended immediately."
        }
    )
    assert review_response.status_code == 200
    assert review_response.json()["status"] == "REVIEWED"

    # 4. Fetch details again as farmer, verify it shows the reviewed content
    detail_response_after = await client.get(f"/api/v1/predictions/{pred_id}")
    assert detail_response_after.json()["status"] == "REVIEWED"
    assert detail_response_after.json()["predicted_disease"] == "Yellow Rust"
    assert detail_response_after.json()["recommendation"] == "Fungicide recommended immediately."
