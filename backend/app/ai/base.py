"""
Abstract base class for AI providers.

This interface defines the contract that all AI providers must implement.
The rest of the application depends ONLY on this interface, never on
concrete implementations. This enables zero-friction provider swapping.
"""

from abc import ABC, abstractmethod

from pydantic import BaseModel, Field


class PredictionResult(BaseModel):
    """
    Standardized output from any AI provider.

    All providers — mock, Gemini, OpenAI, or custom — must return
    data in this exact shape. This guarantees that the service layer
    and database layer never need to know which provider was used.
    """

    predicted_disease: str = Field(description="Name of the identified disease")
    confidence: float = Field(
        ge=0.0, le=1.0, description="Confidence score between 0.0 and 1.0"
    )
    severity: str = Field(description="Severity level: Low, Medium, or High")
    recommendation: str = Field(description="Actionable treatment recommendation")


class AIProvider(ABC):
    """
    Abstract interface for crop disease analysis providers.

    Implementations must be stateless per-call and handle their own
    error recovery. The service layer will catch exceptions and
    return appropriate HTTP error codes.
    """

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Return a human-readable name for this provider (e.g., 'gemini', 'mock')."""
        ...

    @abstractmethod
    async def analyze(
        self,
        image: bytes,
        crop_type: str,
        farmer_notes: str | None = None,
    ) -> PredictionResult:
        """
        Analyze a crop image and return a disease prediction.

        Args:
            image: Raw image bytes (JPEG or PNG).
            crop_type: The type of crop (e.g., "Wheat", "Rice").
            farmer_notes: Optional observations from the farmer.

        Returns:
            PredictionResult with disease, confidence, severity, and recommendation.

        Raises:
            Exception: If the AI provider fails or times out.
        """
        ...
