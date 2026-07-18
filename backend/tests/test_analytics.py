"""Tests for the analytics endpoint."""

import io
import pytest


@pytest.mark.asyncio
async def test_analytics_summary(client, sample_image):
    """GET /api/v1/analytics/summary should return aggregated stats."""
    # Create some predictions first
    for crop in ["Wheat", "Rice", "Tomato"]:
        await client.post(
            "/api/v1/predictions",
            files={"image": (f"test_{crop}.jpg", io.BytesIO(sample_image), "image/jpeg")},
            data={"crop_type": crop},
        )

    response = await client.get("/api/v1/analytics/summary")
    assert response.status_code == 200

    data = response.json()
    assert "total_predictions" in data
    assert data["total_predictions"] > 0
    assert "average_confidence" in data
    assert "disease_distribution" in data
    assert isinstance(data["disease_distribution"], list)
    assert "daily_volume" in data
    assert isinstance(data["daily_volume"], list)
    assert "severity_distribution" in data
