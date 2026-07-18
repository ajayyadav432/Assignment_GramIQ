"""
Test configuration and fixtures for the backend test suite.

Uses a file-based async SQLite database (via aiosqlite), MockProvider,
and HTTPX AsyncClient for robust, single-loop async integration testing.
"""

import asyncio
from typing import AsyncGenerator
import pytest
import httpx

import pytest_asyncio

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.database import Base
from app.models.prediction import Prediction
from app.core.dependencies import get_db, get_ai_provider, get_storage_provider
from app.ai.mock_provider import MockProvider
from app.storage.local_storage import LocalStorage

# Use file-based SQLite with aiosqlite to persist schema across connections
SQLALCHEMY_DATABASE_URL = "sqlite+aiosqlite:///./test.db"

engine = create_async_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
    """Provide a test async database session."""
    async with TestingSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


def override_get_ai_provider():
    """Always use MockProvider in tests."""
    return MockProvider()


def override_get_storage_provider():
    """Use a test storage directory."""
    return LocalStorage(upload_dir="test_uploads")


# Override dependencies
app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[get_ai_provider] = override_get_ai_provider
app.dependency_overrides[get_storage_provider] = override_get_storage_provider


@pytest_asyncio.fixture(autouse=True)
async def setup_database():
    """Create test database tables before each test, drop after."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def client():
    """Provide an async test client running on the same loop as the tests."""
    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=app),
        base_url="http://testserver",
    ) as ac:
        yield ac


@pytest.fixture
def sample_image():
    """Create a minimal valid JPEG for testing."""
    return b'\xff\xd8\xff\xe0' + b'\x00' * 100
