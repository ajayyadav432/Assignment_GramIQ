"""
Local filesystem image storage implementation.

Saves uploaded images to a configurable directory with secure,
randomized filenames to prevent path traversal attacks and collisions.
"""

import secrets
from pathlib import Path

import aiofiles

from app.storage.base import StorageProvider


class LocalStorage(StorageProvider):
    """
    Stores images on the local filesystem.

    Uses cryptographically random filenames (secrets.token_hex)
    to prevent path traversal and filename collisions.
    """

    def __init__(self, upload_dir: str = "uploads"):
        self._upload_dir = Path(upload_dir)
        self._upload_dir.mkdir(parents=True, exist_ok=True)

    def _generate_secure_filename(self, original_filename: str) -> str:
        """Generate a secure, random filename preserving the original extension."""
        ext = Path(original_filename).suffix.lower()
        if ext not in (".jpg", ".jpeg", ".png", ".webp"):
            ext = ".jpg"  # Safe default
        return f"{secrets.token_hex(16)}{ext}"

    async def save(self, filename: str, content: bytes) -> str:
        """
        Save image bytes to disk with a secure random filename.

        Returns the generated filename (not the full path).
        """
        secure_name = self._generate_secure_filename(filename)
        filepath = self._upload_dir / secure_name

        async with aiofiles.open(filepath, "wb") as f:
            await f.write(content)

        return secure_name

    def get_url(self, filename: str) -> str:
        """Return the relative URL path for the stored image."""
        return f"/uploads/{filename}"
