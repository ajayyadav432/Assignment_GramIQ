"""
Security utilities for password hashing and JWT token handling.

Implemented with zero external dependencies using Python's standard library
(hashlib, hmac, base64) to ensure absolute stability and ease of deployment.
"""

import os
import base64
import hmac
import hashlib
import json
import logging
from datetime import datetime, timedelta, timezone

logger = logging.getLogger(__name__)

# Secret key for JWT signature validation (configured via env in production)
SECRET_KEY = os.environ.get("JWT_SECRET", "krishi-clinic-lite-default-jwt-secret-key-xyz-123456")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours


def get_password_hash(password: str) -> str:
    """
    Hash a password using PBKDF2-SHA256 with 100,000 iterations.
    Returns: "salt_hex$hash_hex"
    """
    salt = os.urandom(16)
    db_hash = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        100000
    )
    return f"{salt.hex()}${db_hash.hex()}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain password against the stored PBKDF2-SHA256 hash.
    """
    try:
        if "$" not in hashed_password:
            return False
        salt_hex, hash_hex = hashed_password.split("$", 1)
        salt = bytes.fromhex(salt_hex)
        db_hash = bytes.fromhex(hash_hex)
        
        test_hash = hashlib.pbkdf2_hmac(
            "sha256",
            plain_password.encode("utf-8"),
            salt,
            100000
        )
        return hmac.compare_digest(db_hash, test_hash)
    except Exception as e:
        logger.error(f"Error verifying password: {e}")
        return False


def _base64url_encode(data: bytes) -> str:
    """Encode bytes to URL-safe base64 string without padding."""
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("utf-8")


def _base64url_decode(data: str) -> bytes:
    """Decode URL-safe base64 string with restored padding."""
    padding = "=" * (4 - (len(data) % 4))
    return base64.urlsafe_b64decode(data + padding)


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """
    Generate a signed JWT token containing the payload data.
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Store expiration as epoch timestamp
    to_encode.update({"exp": int(expire.timestamp())})
    
    # Construct JWT parts
    header = {"alg": ALGORITHM, "typ": "JWT"}
    header_json = json.dumps(header, separators=(",", ":")).encode("utf-8")
    payload_json = json.dumps(to_encode, separators=(",", ":")).encode("utf-8")
    
    header_b64 = _base64url_encode(header_json)
    payload_b64 = _base64url_encode(payload_json)
    
    # Sign content
    signature_base = f"{header_b64}.{payload_b64}".encode("utf-8")
    signature = hmac.new(
        SECRET_KEY.encode("utf-8"),
        signature_base,
        hashlib.sha256
    ).digest()
    signature_b64 = _base64url_encode(signature)
    
    return f"{header_b64}.{payload_b64}.{signature_b64}"


def decode_access_token(token: str) -> dict | None:
    """
    Decode and verify JWT signature and expiration.
    Returns the payload dictionary, or None if invalid/expired.
    """
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        
        header_b64, payload_b64, signature_b64 = parts
        
        # Verify signature
        signature_base = f"{header_b64}.{payload_b64}".encode("utf-8")
        expected_sig = hmac.new(
            SECRET_KEY.encode("utf-8"),
            signature_base,
            hashlib.sha256
        ).digest()
        
        if not hmac.compare_digest(_base64url_decode(signature_b64), expected_sig):
            return None
            
        # Parse payload
        payload = json.loads(_base64url_decode(payload_b64).decode("utf-8"))
        
        # Check expiration
        exp = payload.get("exp")
        if exp is None:
            return None
        
        if datetime.now(timezone.utc).timestamp() > exp:
            return None  # Expired
            
        return payload
    except Exception as e:
        logger.debug(f"JWT decode error: {e}")
        return None
