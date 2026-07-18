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
        {
            "predicted_disease": "Stem Rust",
            "confidence": 0.95,
            "severity": "High",
            "recommendation": "Plant rust-resistant varieties like HD-2967 or PBW-550. "
            "Apply tebuconazole fungicide at onset of pustule formation.",
        },
        {
            "predicted_disease": "Powdery Mildew",
            "confidence": 0.90,
            "severity": "Medium",
            "recommendation": "Apply sulfur-based fungicide at 3g/L. "
            "Avoid dense planting to improve air circulation.",
        },
        {
            "predicted_disease": "Karnal Bunt",
            "confidence": 0.84,
            "severity": "Low",
            "recommendation": "Use certified bunt-free seeds. "
            "Treat seed with carboxin or thiram before sowing.",
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
        {
            "predicted_disease": "Bacterial Leaf Blight",
            "confidence": 0.89,
            "severity": "High",
            "recommendation": "Use resistant varieties like IR-64. "
            "Apply streptocycline at 500ppm during early infection stages.",
        },
        {
            "predicted_disease": "Sheath Blight",
            "confidence": 0.88,
            "severity": "Medium",
            "recommendation": "Apply hexaconazole 5% SC at 1ml/L. "
            "Avoid excessive nitrogen and maintain proper water management.",
        },
        {
            "predicted_disease": "Healthy",
            "confidence": 0.96,
            "severity": "Low",
            "recommendation": "Continue current agricultural practices. "
            "Monitor regularly for early signs of pest or disease pressure.",
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
        {
            "predicted_disease": "Fusarium Wilt",
            "confidence": 0.84,
            "severity": "High",
            "recommendation": "Remove infected plants. Solarize soil before next planting. "
            "Use resistant varieties like Arka Rakshak.",
        },
        {
            "predicted_disease": "Powdery Mildew",
            "confidence": 0.86,
            "severity": "Low",
            "recommendation": "Apply sulfur-based fungicide at recommended dosage. "
            "Improve air circulation by proper pruning and spacing.",
        },
        {
            "predicted_disease": "Leaf Curl Virus",
            "confidence": 0.88,
            "severity": "High",
            "recommendation": "Control whitefly vectors with imidacloprid spray. "
            "Remove infected plants and use virus-resistant varieties.",
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
        {
            "predicted_disease": "Common Rust",
            "confidence": 0.86,
            "severity": "Medium",
            "recommendation": "Apply mancozeb or triazole fungicide at early pustule stage. "
            "Plant rust-resistant varieties for next season.",
        },
        {
            "predicted_disease": "Stalk Rot",
            "confidence": 0.82,
            "severity": "High",
            "recommendation": "Avoid excessive nitrogen fertilization. "
            "Harvest promptly and destroy infected crop residue.",
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
        {
            "predicted_disease": "Black Scurf",
            "confidence": 0.82,
            "severity": "Medium",
            "recommendation": "Treat seed tubers with pencycuron before planting. "
            "Practice crop rotation with non-solanaceous crops.",
        },
        {
            "predicted_disease": "Early Blight",
            "confidence": 0.87,
            "severity": "Medium",
            "recommendation": "Apply chlorothalonil or mancozeb fungicide at first symptoms. "
            "Ensure adequate plant nutrition with balanced fertilization.",
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
        {
            "predicted_disease": "Cotton Leaf Curl Virus",
            "confidence": 0.87,
            "severity": "High",
            "recommendation": "Control whitefly population with imidacloprid. "
            "Remove infected plants and use resistant Bt cotton varieties.",
        },
        {
            "predicted_disease": "Alternaria Leaf Spot",
            "confidence": 0.83,
            "severity": "Low",
            "recommendation": "Apply mancozeb spray at 2.5g/L. "
            "Remove lower infected leaves to reduce inoculum pressure.",
        },
        {
            "predicted_disease": "Fusarium Wilt",
            "confidence": 0.85,
            "severity": "High",
            "recommendation": "Use wilt-resistant varieties. Practice crop rotation "
            "with non-host crops for at least 3 years.",
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
        {
            "predicted_disease": "Smut",
            "confidence": 0.88,
            "severity": "Medium",
            "recommendation": "Rogue out infected clumps immediately. "
            "Use disease-free seed material from certified nurseries.",
        },
        {
            "predicted_disease": "Grassy Shoot Disease",
            "confidence": 0.81,
            "severity": "Medium",
            "recommendation": "Remove and destroy infected clumps. "
            "Use hot-water treated setts at 52°C for 30 minutes.",
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
        {
            "predicted_disease": "Cercospora Leaf Blight",
            "confidence": 0.79,
            "severity": "Low",
            "recommendation": "Apply copper-based fungicide at early symptoms. "
            "Ensure adequate field drainage and avoid water-logging.",
        },
        {
            "predicted_disease": "Charcoal Rot",
            "confidence": 0.83,
            "severity": "High",
            "recommendation": "Irrigate regularly during dry spells. "
            "Use seed treatment with trichoderma viride before sowing.",
        },
    ],
    "mustard": [
        {
            "predicted_disease": "White Rust",
            "confidence": 0.89,
            "severity": "Medium",
            "recommendation": "Apply metalaxyl + mancozeb at disease onset. "
            "Remove and destroy infected plant parts promptly.",
        },
        {
            "predicted_disease": "Alternaria Blight",
            "confidence": 0.87,
            "severity": "High",
            "recommendation": "Apply mancozeb 75% WP at 2.5g/L at 15-day intervals. "
            "Use resistant varieties like Pusa Bold or RH-30.",
        },
    ],
    "groundnut": [
        {
            "predicted_disease": "Tikka Disease",
            "confidence": 0.86,
            "severity": "Medium",
            "recommendation": "Apply carbendazim 50% WP at 1g/L. "
            "Practice crop rotation and deep ploughing after harvest.",
        },
        {
            "predicted_disease": "Collar Rot",
            "confidence": 0.84,
            "severity": "High",
            "recommendation": "Treat seeds with thiram or captan before sowing. "
            "Ensure well-drained soil and avoid waterlogging.",
        },
    ],
    "chilli": [
        {
            "predicted_disease": "Anthracnose",
            "confidence": 0.90,
            "severity": "High",
            "recommendation": "Apply carbendazim or mancozeb spray at fruit formation. "
            "Use disease-free seeds and practice crop rotation.",
        },
        {
            "predicted_disease": "Leaf Curl Virus",
            "confidence": 0.85,
            "severity": "Medium",
            "recommendation": "Control thrips and mite vectors with fipronil. "
            "Remove infected plants to reduce virus spread.",
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
