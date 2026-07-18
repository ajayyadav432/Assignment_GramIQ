"""Tests for the AI provider abstraction."""

import pytest
from app.ai.mock_provider import MockProvider
from app.ai.base import PredictionResult


@pytest.mark.asyncio
async def test_mock_provider_returns_prediction():
    """MockProvider should return a valid PredictionResult."""
    provider = MockProvider()
    result = await provider.analyze(
        image=b"dummy image data",
        crop_type="Wheat",
        farmer_notes="Yellow spots on leaves",
    )

    assert isinstance(result, PredictionResult)
    assert result.predicted_disease
    assert 0.0 <= result.confidence <= 1.0
    assert result.severity in ("Low", "Medium", "High")
    assert result.recommendation


@pytest.mark.asyncio
async def test_mock_provider_different_crops():
    """MockProvider should return different diseases for different crops."""
    provider = MockProvider()

    wheat_result = await provider.analyze(b"wheat_image", "Wheat")
    rice_result = await provider.analyze(b"rice_image", "Rice")
    tomato_result = await provider.analyze(b"tomato_image", "Tomato")

    # All should return valid results
    assert wheat_result.predicted_disease
    assert rice_result.predicted_disease
    assert tomato_result.predicted_disease


@pytest.mark.asyncio
async def test_mock_provider_name():
    """MockProvider should identify itself as 'mock'."""
    provider = MockProvider()
    assert provider.provider_name == "mock"


@pytest.mark.asyncio
async def test_mock_provider_unknown_crop():
    """MockProvider should handle unknown crop types gracefully."""
    provider = MockProvider()
    result = await provider.analyze(b"unknown_crop", "Dragonfruit")

    assert isinstance(result, PredictionResult)
    assert result.predicted_disease  # Should use fallback
    assert result.confidence > 0


@pytest.mark.asyncio
async def test_mock_provider_deterministic():
    """Same inputs should produce same outputs (deterministic)."""
    provider = MockProvider()
    image = b"consistent_test_image"

    result1 = await provider.analyze(image, "Wheat", "some notes")
    result2 = await provider.analyze(image, "Wheat", "some notes")

    assert result1.predicted_disease == result2.predicted_disease
    assert result1.confidence == result2.confidence


class FailingProvider(MockProvider):
    """Mock provider that always raises an error to test fallbacks."""
    @property
    def provider_name(self) -> str:
        return "failing"

    async def analyze(
        self,
        image: bytes,
        crop_type: str,
        farmer_notes: str | None = None,
    ) -> PredictionResult:
        raise RuntimeError("Mock API connection failure")


@pytest.mark.asyncio
async def test_fallback_provider_success():
    """FallbackAIProvider should return primary provider's result if it succeeds."""
    from app.ai.fallback_provider import FallbackAIProvider
    primary = MockProvider()
    fallback = MockProvider()
    provider = FallbackAIProvider(primary, fallback)

    result = await provider.analyze(b"image", "Tomato")
    assert isinstance(result, PredictionResult)
    assert provider.provider_name == "mock"


@pytest.mark.asyncio
async def test_fallback_provider_fails_to_fallback():
    """FallbackAIProvider should use the fallback provider if primary fails."""
    from app.ai.fallback_provider import FallbackAIProvider
    primary = FailingProvider()
    fallback = MockProvider()
    provider = FallbackAIProvider(primary, fallback)

    result = await provider.analyze(b"image", "Tomato")
    assert isinstance(result, PredictionResult)
    assert provider.provider_name == "failing (fallback to mock)"

