"""
Text embedding utilities for biobank indexing and RAG retrieval.
"""

import os
import hmac
import hashlib
import logging
import asyncio
from google import genai

from app.core.config import get_settings

logger = logging.getLogger(__name__)


def get_mock_embedding(text: str) -> list[float]:
    """
    Generate a deterministic 768-dimensional mock embedding vector.
    Used for local offline testing and CI.
    """
    vector = []
    text_bytes = text.lower().strip().encode("utf-8")
    for i in range(768):
        # Generate pseudo-random float between -1.0 and 1.0 using SHA256 hashes
        h = hashlib.sha256(text_bytes + str(i).encode("utf-8")).digest()
        val = (int.from_bytes(h[:4], "big") / 4294967295.0) * 2 - 1
        vector.append(val)
    return vector


async def generate_embedding(text: str) -> list[float]:
    """
    Generate a 768-dimensional text embedding.
    Uses Gemini's text-embedding-004 if GEMINI_API_KEY is configured.
    Falls back to get_mock_embedding if offline or API key is not present.
    """
    settings = get_settings()
    
    if not settings.GEMINI_API_KEY or settings.AI_PROVIDER == "mock":
        logger.debug("GEMINI_API_KEY not configured or mock mode active. Generating mock embedding.")
        return get_mock_embedding(text)
        
    try:
        # Run SDK blocking call in thread executor to keep it async
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        loop = asyncio.get_running_loop()
        
        response = await loop.run_in_executor(
            None,
            lambda: client.models.embed_content(
                model="text-embedding-004",
                contents=text
            )
        )
        return response.embeddings[0].values
    except Exception as e:
        logger.warning(f"Error generating Gemini embedding: {e}. Falling back to mock embedding.")
        return get_mock_embedding(text)


def cosine_similarity(v1: list[float], v2: list[float]) -> float:
    """
    Compute cosine similarity between two float vectors.
    Returns a score between -1.0 and 1.0 (or 0.0 if empty/mismatched).
    """
    if not v1 or not v2 or len(v1) != len(v2):
        return 0.0
        
    dot_product = sum(a * b for a, b in zip(v1, v2))
    norm_a = sum(a * a for a in v1) ** 0.5
    norm_b = sum(b * b for b in v2) ** 0.5
    
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
        
    return dot_product / (norm_a * norm_b)
