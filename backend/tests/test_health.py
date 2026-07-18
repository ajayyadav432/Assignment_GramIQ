"""Tests for the /health endpoint."""

import pytest


@pytest.mark.asyncio
async def test_health_check(client):
    """Health endpoint should return 200 with status info."""
    response = await client.get("/health")
    assert response.status_code == 200

    data = response.json()
    assert data["status"] in ("ok", "degraded")
    assert "version" in data
    assert "database" in data


@pytest.mark.asyncio
async def test_health_returns_version(client):
    """Health endpoint should include application version."""
    response = await client.get("/health")
    data = response.json()
    assert data["version"] == "1.0.0"
