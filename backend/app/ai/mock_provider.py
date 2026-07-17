"""
Mock AI provider for development and CI testing.

Returns deterministic predictions based on crop type using a curated
lookup table of realistic agricultural diseases. This provider makes
ZERO external network calls, enabling fast, reliable testing.
"""

import hashlib
from app.ai.base import AIProvider, PredictionResult


# Realistic disease database keyed by crop type
_DISEASE_DATABASE: dict[str, list[dict]] = {
    "wheat": [
        {
            "predicted_disease": "Yellow Rust",
            "confidence": 0.92,
            "severity": "Medium",
            "recommendation": "Apply propiconazole fungicide at 0.1% concentration. "
            "Monitor field edges where infection typically initiates.",
        },
        {
            "predicted_disease": "Leaf Blight",
            "confidence": 0.87,
            "severity": "High",
            "recommendation": "Remove and destroy infected plant debris. "
            "Apply mancozeb 75% WP at 2.5g/L as preventive spray.",
        },
    ],
    "rice": [
        {
            "predicted_disease": "Blast",
            "confidence": 0.94,
            "severity": "High",
            "recommendation": "Apply tricyclazole 75% WP at 0.6g/L. "
            "Avoid excess nitrogen fertilization and ensure proper spacing.",
        },
        {
            "predicted_disease": "Brown Spot",
            "confidence": 0.85,
            "severity": "Medium",
            "recommendation": "Treat seeds with carbendazim before sowing. "
            "Apply potassium fertilizer to strengthen plant resistance.",
        },
    ],
    "tomato": [
        {
            "predicted_disease": "Early Blight",
            "confidence": 0.91,
            "severity": "Medium",
            "recommendation": "Apply chlorothalonil or copper-based fungicide. "
            "Ensure proper plant spacing for air circulation.",
        },
        {
            "predicted_disease": "Late Blight",
            "confidence": 0.89,
            "severity": "High",
            "recommendation": "Remove and destroy affected plants immediately. "
            "Apply metalaxyl + mancozeb combination spray.",
        },
    ],
    "corn": [
        {
            "predicted_disease": "Northern Leaf Blight",
            "confidence": 0.88,
            "severity": "Medium",
            "recommendation": "Plant resistant hybrids and rotate crops. "
            "Apply strobilurin fungicide if infection exceeds 50% of leaves.",
        },
        {
            "predicted_disease": "Gray Leaf Spot",
            "confidence": 0.86,
            "severity": "Low",
            "recommendation": "Practice crop rotation with non-host crops. "
            "Reduce tillage to minimize spore dispersal.",
        },
    ],
    "potato": [
        {
            "predicted_disease": "Late Blight",
            "confidence": 0.93,
            "severity": "High",
            "recommendation": "Apply mancozeb preventively before disease onset. "
            "Destroy volunteer potato plants and infected tubers.",
        },
        {
            "predicted_disease": "Common Scab",
            "confidence": 0.82,
            "severity": "Low",
            "recommendation": "Maintain soil pH below 5.5 during tuber formation. "
            "Use certified disease-free seed potatoes.",
        },
    ],
    "cotton": [
        {
            "predicted_disease": "Bacterial Blight",
            "confidence": 0.90,
            "severity": "High",
            "recommendation": "Use acid-delinted and treated seeds. "
            "Apply streptomycin sulfate spray at initial symptom appearance.",
        },
    ],
    "sugarcane": [
        {
            "predicted_disease": "Red Rot",
            "confidence": 0.88,
            "severity": "High",
            "recommendation": "Use disease-free setts for planting. "
            "Treat setts with carbendazim (0.1%) for 15 minutes before planting.",
        },
    ],
    "soybean": [
        {
            "predicted_disease": "Rust",
            "confidence": 0.91,
            "severity": "Medium",
            "recommendation": "Apply triazole fungicide at first sign of pustules. "
            "Scout fields regularly during flowering and pod-fill stages.",
        },
    ],
}

# Default fallback for unknown crop types
_DEFAULT_PREDICTION = {
    "predicted_disease": "Powdery Mildew",
    "confidence": 0.78,
    "severity": "Low",
    "recommendation": "Apply sulfur-based fungicide at 3g/L. "
    "Improve air circulation and avoid overhead irrigation.",
}


class MockProvider(AIProvider):
    """
    Deterministic mock AI provider.

    Selects predictions from a curated disease database based on crop type.
    Uses a hash of the image bytes to consistently return the same result
    for the same image, simulating deterministic AI behavior.
    """

    @property
    def provider_name(self) -> str:
        return "mock"

    async def analyze(
        self,
        image: bytes,
        crop_type: str,
        farmer_notes: str | None = None,
    ) -> PredictionResult:
        """
        Return a deterministic prediction based on crop type and image hash.

        The image hash is used to select from multiple possible diseases
        for the same crop type, providing variety while maintaining
        determinism for the same inputs.
        """
        crop_key = crop_type.lower().strip()
        diseases = _DISEASE_DATABASE.get(crop_key, [_DEFAULT_PREDICTION])

        # Use image hash to deterministically select a disease variant
        image_hash = int(hashlib.md5(image).hexdigest(), 16)
        selected = diseases[image_hash % len(diseases)]

        return PredictionResult(**selected)
