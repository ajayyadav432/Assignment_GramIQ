"""
Google Gemini AI provider implementation.

Uses the google-genai SDK to send crop images for multimodal analysis.
Forces structured JSON output via Pydantic schema to guarantee
parseable, type-safe responses from the LLM.
"""

import json
import logging

from google import genai
from google.genai import types

from app.ai.base import AIProvider, PredictionResult

logger = logging.getLogger(__name__)


class GeminiProvider(AIProvider):
    """
    Production AI provider using Google Gemini's multimodal capabilities.

    Sends crop images alongside contextual prompts to Gemini and forces
    structured JSON output matching our PredictionResult schema.
    """

    def __init__(self, api_key: str, model: str = "gemini-2.0-flash"):
        self._client = genai.Client(api_key=api_key)
        self._model = model

    @property
    def provider_name(self) -> str:
        return "gemini"

    async def analyze(
        self,
        image: bytes,
        crop_type: str,
        farmer_notes: str | None = None,
    ) -> PredictionResult:
        """
        Send crop image to Gemini for disease analysis.

        Uses multimodal input (text + image) with structured output
        to guarantee a parseable JSON response matching PredictionResult.
        """
        # Build the contextual prompt
        notes_section = ""
        if farmer_notes:
            notes_section = f"\nFarmer's observations: {farmer_notes}"

        prompt = (
            f"You are an expert agricultural pathologist. Analyze this image of a "
            f"{crop_type} crop for diseases.\n"
            f"{notes_section}\n\n"
            f"Respond with a JSON object containing:\n"
            f"- predicted_disease: the most likely disease name\n"
            f"- confidence: a float between 0.0 and 1.0\n"
            f"- severity: exactly one of 'Low', 'Medium', or 'High'\n"
            f"- recommendation: specific, actionable treatment advice\n"
            f"- possible_reasons: brief summary of possible reasons or triggers for this disease (e.g. humidity, pest vectors, soil moisture)\n\n"
            f"If the plant appears healthy, set predicted_disease to 'Healthy', "
            f"confidence to 0.95, severity to 'Low', possible_reasons to 'N/A', and provide general care advice."
        )

        try:
            # Construct multimodal content parts
            image_part = types.Part.from_bytes(data=image, mime_type="image/jpeg")

            response = self._client.models.generate_content(
                model=self._model,
                contents=[prompt, image_part],
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=PredictionResult,
                    temperature=0.2,  # Low temperature for consistent results
                ),
            )

            # Parse the structured response
            result_data = json.loads(response.text)
            return PredictionResult(**result_data)

        except Exception as e:
            logger.error(f"Gemini API error: {e}", exc_info=True)
            raise RuntimeError(
                f"AI analysis failed: {str(e)}. "
                f"Consider switching to AI_PROVIDER=mock for development."
            ) from e
