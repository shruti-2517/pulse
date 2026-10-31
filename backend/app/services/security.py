"""
Security and Cryptography Service.

This module provides password hashing (bcrypt) and JWT token creation/verification.
You (the mentee) will implement the core security logic in this file.
"""

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional
import bcrypt
import jwt
from app.core.config import get_settings

settings = get_settings()


def hash_password(password: str) -> str:
    """
    Hash a plain-text password using bcrypt.
    """
    password_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain-text password against a stored bcrypt hash.
    """
    plain_password_bytes = plain_password.encode("utf-8")
    hashed_password_bytes = hashed_password.encode("utf-8")
    try:
        return bcrypt.checkpw(plain_password_bytes, hashed_password_bytes)
    except (ValueError, TypeError):
        return False


def create_access_token(subject: str, expires_delta: Optional[timedelta] = None) -> str:
    """
    Generate a cryptographically signed JSON Web Token (JWT).
    """
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    payload = {
        "sub": str(subject),
        "exp": expire,
        "iat": now
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Validate and decode a JWT access token.
    """
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except(jwt.ExpiredSignatureError, jwt.PyJWTError):
        return None
