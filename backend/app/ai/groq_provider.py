"""
Groq AI provider implementation.

Uses the Groq REST API with vision-capable models (e.g., llama-4-scout)
for multimodal crop disease analysis. Groq offers free, ultra-fast inference.
"""

import base64
import json
import logging

import httpx

from app.ai.base import AIProvider, PredictionResult

logger = logging.getLogger(__name__)


class GroqProvider(AIProvider):
    """
    AI provider using Groq's fast inference API with vision models.

    Groq provides free-tier access to vision-capable LLMs with
    extremely low latency, making it ideal for real-time crop analysis.
    """

    def __init__(self, api_key: str, model: str = "meta-llama/llama-4-scout-17b-16e-instruct"):
        self._api_key = api_key
        self._model = model
        self._base_url = "https://api.groq.com/openai/v1/chat/completions"

    @property
    def provider_name(self) -> str:
        return "groq"

    async def analyze(
        self,
        image: bytes,
        crop_type: str,
        farmer_notes: str | None = None,
    ) -> PredictionResult:
        """
        Send crop image to Groq's vision model for disease analysis.

        Uses the OpenAI-compatible chat completions API with base64-encoded
        image content for multimodal input.
        """
        notes_section = ""
        if farmer_notes:
            notes_section = f"\nFarmer's observations: {farmer_notes}"

        prompt = (
            f"You are an expert agricultural pathologist. Analyze this image of a "
            f"{crop_type} crop for diseases.\n"
            f"{notes_section}\n\n"
            f"Respond with ONLY a JSON object (no markdown, no code fences) containing:\n"
            f'- "predicted_disease": the most likely disease name (string)\n'
            f'- "confidence": a float between 0.0 and 1.0\n'
            f'- "severity": exactly one of "Low", "Medium", or "High"\n'
            f'- "recommendation": specific, actionable treatment advice (string)\n\n'
            f"If the plant appears healthy, set predicted_disease to 'Healthy', "
            f"confidence to 0.95, severity to 'Low', and provide general care advice."
        )

        # Encode image to base64
        image_b64 = base64.b64encode(image).decode("utf-8")

        payload = {
            "model": self._model,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{image_b64}",
                            },
                        },
                    ],
                }
            ],
            "temperature": 0.2,
            "max_tokens": 1024,
            "response_format": {"type": "json_object"},
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    self._base_url,
                    json=payload,
                    headers={
                        "Authorization": f"Bearer {self._api_key}",
                        "Content-Type": "application/json",
                    },
                )
                response.raise_for_status()

            data = response.json()
            content = data["choices"][0]["message"]["content"]

            # Parse JSON from model response
            result_data = json.loads(content)
            return PredictionResult(**result_data)

        except httpx.HTTPStatusError as e:
            logger.error(
                f"Groq API HTTP error: {e.response.status_code} — {e.response.text}",
                exc_info=True,
            )
            raise RuntimeError(
                f"Groq API returned HTTP {e.response.status_code}: {e.response.text}"
            ) from e
        except Exception as e:
            logger.error(f"Groq API error: {e}", exc_info=True)
            raise RuntimeError(
                f"AI analysis failed: {str(e)}. "
                f"Consider switching to AI_PROVIDER=mock for development."
            ) from e
