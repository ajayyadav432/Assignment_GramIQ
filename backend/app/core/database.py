"""
Async SQLAlchemy 2.0 database engine and session factory.

Uses asyncpg driver for non-blocking PostgreSQL access.
Connection pooling is configured for moderate concurrent load.
"""

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.core.config import get_settings

settings = get_settings()

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,  # Verify connections before use
)

async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,  # Prevent lazy-load errors in async context
)


class Base(DeclarativeBase):
    """Declarative base for all SQLAlchemy models."""
    pass
