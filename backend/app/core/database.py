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

db_url = settings.DATABASE_URL
connect_args = {}

if "sslmode=" in db_url:
    if "?" in db_url:
        base_url, query = db_url.split("?", 1)
        params = query.split("&")
        filtered_params = [p for p in params if not p.startswith("sslmode=")]
        if filtered_params:
            db_url = f"{base_url}?{'&'.join(filtered_params)}"
        else:
            db_url = base_url
    connect_args["ssl"] = True

engine = create_async_engine(
    db_url,
    echo=settings.DEBUG,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,  # Verify connections before use
    connect_args=connect_args,
)

async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,  # Prevent lazy-load errors in async context
)


class Base(DeclarativeBase):
    """Declarative base for all SQLAlchemy models."""
    pass
