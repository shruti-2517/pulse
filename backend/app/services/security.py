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

    Contract:
    - Input:
        - password: The raw plaintext string provided by the user.
    - Expected Behavior:
        - Convert the password string to bytes (UTF-8).
        - Generate a random salt using `bcrypt.gensalt()`.
        - Hash the password with the salt using `bcrypt.hashpw()`.
        - Return the resulting hash decoded back to an ASCII/UTF-8 string.
    - Security Requirements:
        - Never store or log plaintext passwords.
        - Each call must produce a unique hash (due to salt).
    """
    password_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain-text password against a stored bcrypt hash.

    Contract:
    - Input:
        - plain_password: Raw password string provided during login.
        - hashed_password: The bcrypt hash string stored in the database.
    - Expected Behavior:
        - Encode both plain_password and hashed_password to bytes.
        - Use `bcrypt.checkpw(password_bytes, hashed_bytes)` to verify.
        - Return True if they match, False otherwise.
    - Edge Cases:
        - If verification raises ValueError or TypeError (e.g. malformed hash), catch and return False.
        - Prevent timing attacks (handled automatically by bcrypt.checkpw).
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

    Contract:
    - Input:
        - subject: The unique identifier to store in the token (e.g., user ID or email).
        - expires_delta: Optional custom lifetime for the token.
    - Expected Behavior:
        - If expires_delta is provided, expiry is `now(utc) + expires_delta`.
        - Otherwise, expiry is `now(utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)`.
        - Construct payload with standard claims:
            {
                "sub": str(subject),
                "exp": expire_datetime,
                "iat": now_datetime
            }
        - Sign using `jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)`.
        - Return the encoded JWT string.
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

    Contract:
    - Input:
        - token: Raw JWT string extracted from Authorization header.
    - Expected Behavior:
        - Decode and verify the signature using `jwt.decode(...)` with:
            key=settings.JWT_SECRET_KEY
            algorithms=[settings.JWT_ALGORITHM]
        - If valid, return the payload dictionary containing at least "sub".
    - Edge Cases & Failures:
        - If token is expired (`jwt.ExpiredSignatureError`), return None.
        - If signature is invalid or token is malformed (`jwt.PyJWTError`), return None.
        - Never allow an unhandled exception to bubble up from this helper.
    """
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except(jwt.ExpiredSignatureError, jwt.PyJWTError):
        return None
