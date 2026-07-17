"""
Fallback AI provider implementation.

Wraps a primary AI provider (e.g., Gemini) and catches any execution errors,
falling back to a secondary provider (e.g., Mock) to ensure system resilience.
"""

import logging
from app.ai.base import AIProvider, PredictionResult

logger = logging.getLogger(__name__)


class FallbackAIProvider(AIProvider):
    """
    Resilient wrapper that delegates to a primary provider,
    falling back to a secondary provider if the primary one raises an exception.
    """

    def __init__(self, primary: AIProvider, fallback: AIProvider):
        self._primary = primary
        self._fallback = fallback
        self._last_used_provider_name = primary.provider_name

    @property
    def provider_name(self) -> str:
        """
        Return the name of the provider that actually resolved the last prediction,
        or the primary provider's name if no analysis has run yet.
        """
        return self._last_used_provider_name

    async def analyze(
        self,
        image: bytes,
        crop_type: str,
        farmer_notes: str | None = None,
    ) -> PredictionResult:
        """
        Attempt to analyze using the primary provider.
        If it fails, fall back to the secondary provider.
        """
        try:
            logger.info(f"Attempting crop disease analysis using primary provider: {self._primary.provider_name}")
            result = await self._primary.analyze(image, crop_type, farmer_notes)
            # Ensure we report the actual provider used
            self._last_used_provider_name = self._primary.provider_name
            return result
        except Exception as e:
            logger.warning(
                f"Primary AI provider ({self._primary.provider_name}) failed: {e}. "
                f"Falling back to secondary provider ({self._fallback.provider_name}).",
                exc_info=True
            )
            try:
                result = await self._fallback.analyze(image, crop_type, farmer_notes)
                self._last_used_provider_name = f"{self._primary.provider_name} (fallback to {self._fallback.provider_name})"
                return result
            except Exception as fallback_err:
                logger.error(
                    f"Fallback AI provider ({self._fallback.provider_name}) also failed: {fallback_err}",
                    exc_info=True
                )
                raise fallback_err
