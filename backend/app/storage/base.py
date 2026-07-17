"""
Abstract base class for image storage providers.
"""

from abc import ABC, abstractmethod


class StorageProvider(ABC):
    """Interface for image storage backends."""

    @abstractmethod
    async def save(self, filename: str, content: bytes) -> str:
        """Save image content and return the stored filename/key."""
        ...

    @abstractmethod
    def get_url(self, filename: str) -> str:
        """Return a URL or path to retrieve the stored image."""
        ...
