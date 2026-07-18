"""
OpenAI-compatible AI provider implementation (Bonus Feature).

Demonstrates the true swappability of the AIProvider abstraction.
Switching from Gemini to OpenAI requires ZERO changes to routes,
services, schemas, or the frontend — only the env var changes.

Supports any OpenAI-compatible API (OpenAI, Azure OpenAI, Ollama, etc).
"""

import base64
import json
import logging

import httpx

from app.ai.base import AIProvider, PredictionResult

logger = logging.getLogger(__name__)


class OpenAIProvider(AIProvider):
    """
    AI provider using OpenAI's GPT-4 Vision or compatible APIs.

    This implementation proves the architectural claim that swapping
    AI providers requires zero structural changes. The interface is
    identical to GeminiProvider and MockProvider.
    """

    def __init__(self, api_key: str, model: str = "gpt-4o-mini"):
        self._api_key = api_key
        self._model = model
        self._base_url = "https://api.openai.com/v1"

    @property
    def provider_name(self) -> str:
        return "openai"

    async def analyze(
        self,
        image: bytes,
        crop_type: str,
        farmer_notes: str | None = None,
    ) -> PredictionResult:
        """
        Send crop image to OpenAI Vision API for analysis.

        Encodes image as base64 and sends alongside a structured prompt.
        Uses JSON mode to guarantee parseable output.
        """
        img_b64 = base64.b64encode(image).decode("utf-8")

        notes_section = ""
        if farmer_notes:
            notes_section = f"\nFarmer's observations: {farmer_notes}"

        prompt = (
            f"You are an expert agricultural pathologist. Analyze this image of a "
            f"{crop_type} crop for diseases.{notes_section}\n\n"
            f"Respond with ONLY a JSON object (no markdown, no explanation) with "
            f"these exact keys:\n"
            f'- "predicted_disease": string (disease name, or "Healthy")\n'
            f'- "confidence": float (0.0 to 1.0)\n'
            f'- "severity": string (exactly "Low", "Medium", or "High")\n'
            f'- "recommendation": string (specific treatment advice)'
        )

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self._base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self._api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": self._model,
                        "messages": [
                            {
                                "role": "user",
                                "content": [
                                    {"type": "text", "text": prompt},
                                    {
                                        "type": "image_url",
                                        "image_url": {
                                            "url": f"data:image/jpeg;base64,{img_b64}",
                                            "detail": "low",
                                        },
                                    },
                                ],
                            }
                        ],
                        "response_format": {"type": "json_object"},
                        "temperature": 0.2,
                        "max_tokens": 500,
                    },
                )
                response.raise_for_status()

            data = response.json()
            content = data["choices"][0]["message"]["content"]
            result = json.loads(content)
            return PredictionResult(**result)

        except Exception as e:
            logger.error(f"OpenAI API error: {e}", exc_info=True)
            raise RuntimeError(
                f"OpenAI analysis failed: {str(e)}. "
                f"Consider switching to AI_PROVIDER=mock for development."
            ) from e
