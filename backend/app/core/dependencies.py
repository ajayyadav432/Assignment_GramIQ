"""
FastAPI dependency injection providers.

Centralizes dependency resolution for database sessions,
AI providers, and storage backends. This is the single point
where concrete implementations are bound to abstract interfaces.
"""

from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.database import async_session_factory
from app.ai.base import AIProvider
from app.ai.mock_provider import MockProvider
from app.ai.gemini_provider import GeminiProvider
from app.ai.openai_provider import OpenAIProvider
from app.ai.fallback_provider import FallbackAIProvider
from app.storage.base import StorageProvider
from app.storage.local_storage import LocalStorage
import logging

logger = logging.getLogger(__name__)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Yield an async database session scoped to a single request.
    The session is automatically closed after the request completes.
    """
    async with async_session_factory() as session:
        try:
            yield session
        finally:
            await session.close()


def get_ai_provider() -> AIProvider:
    """
    Factory for AI providers — reads AI_PROVIDER from env
    and returns the appropriate concrete implementation.

    Supports three providers with automatic mock fallback:
      - mock: Deterministic responses, no API key needed
      - gemini: Google Gemini (falls back to mock if API key is missing or calls fail)
      - openai: OpenAI GPT-4 Vision (falls back to mock if API key is missing or calls fail)

    Switching providers requires only changing the AI_PROVIDER
    environment variable. Zero code changes to routes or services.
    """
    settings = get_settings()

    if settings.AI_PROVIDER == "gemini":
        if not settings.GEMINI_API_KEY:
            logger.warning(
                "GEMINI_API_KEY is not set but AI_PROVIDER=gemini. Falling back to MockProvider."
            )
            return MockProvider()
        primary = GeminiProvider(
            api_key=settings.GEMINI_API_KEY,
            model=settings.GEMINI_MODEL,
        )
        return FallbackAIProvider(primary, MockProvider())

    if settings.AI_PROVIDER == "openai":
        if not settings.OPENAI_API_KEY:
            logger.warning(
                "OPENAI_API_KEY is not set but AI_PROVIDER=openai. Falling back to MockProvider."
            )
            return MockProvider()
        primary = OpenAIProvider(
            api_key=settings.OPENAI_API_KEY,
            model=settings.OPENAI_MODEL,
        )
        return FallbackAIProvider(primary, MockProvider())

    # Default to mock — safe for development and CI
    return MockProvider()


def get_storage_provider() -> StorageProvider:
    """
    Factory for storage backends.
    Currently returns local filesystem storage.
    Swap to S3Storage by changing this single binding.
    """
    settings = get_settings()
    return LocalStorage(upload_dir=settings.UPLOAD_DIR)
