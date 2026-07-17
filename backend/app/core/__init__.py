"""
Application configuration using Pydantic Settings.
All environment variables are loaded here with sensible defaults for development.
"""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Central configuration for the Krishi Clinic Lite backend."""

    # Application
    APP_NAME: str = "Krishi Clinic Lite"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@db:5432/krishiclinic"

    # AI Provider: "mock" | "gemini"
    AI_PROVIDER: str = "mock"
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.0-flash"

    # Storage
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE_MB: int = 10

    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://frontend:3000",
        "http://127.0.0.1:3000",
    ]

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
    }


@lru_cache
def get_settings() -> Settings:
    """Cached settings instance — loaded once per process."""
    return Settings()
