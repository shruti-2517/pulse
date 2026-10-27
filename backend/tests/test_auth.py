from datetime import timedelta
import pytest
from app.services import security


def test_hash_password():
    """hash_password must return a non-empty bcrypt hash string."""
    password = "SuperSecretPassword123"
    hashed = security.hash_password(password)

    assert isinstance(hashed, str)
    assert hashed != password
    # Bcrypt hashes start with $2a$, $2b$, or $2y$
    assert hashed.startswith(("$2a$", "$2b$", "$2y$"))


def test_hash_password_produces_unique_salts():
    """Hashing the same password twice must yield different hashes due to salt."""
    password = "SamePassword"
    hash1 = security.hash_password(password)
    hash2 = security.hash_password(password)

    assert hash1 != hash2


def test_verify_password_correct():
    """verify_password must return True when password matches hash."""
    password = "CorrectHorseBatteryStaple"
    hashed = security.hash_password(password)

    assert security.verify_password(password, hashed) is True


def test_verify_password_incorrect():
    """verify_password must return False when password does not match hash."""
    password = "CorrectPassword"
    hashed = security.hash_password(password)

    assert security.verify_password("WrongPassword", hashed) is False


def test_verify_password_malformed_hash():
    """verify_password must catch invalid/corrupted hash strings and return False."""
    assert security.verify_password("any_password", "invalid_garbage_hash") is False


def test_create_and_decode_access_token():
    """create_access_token must produce a verifiable JWT with subject claim."""
    subject = "user-12345"
    token = security.create_access_token(subject=subject)

    assert isinstance(token, str)
    assert len(token) > 20

    payload = security.decode_access_token(token)
    assert payload is not None
    assert payload.get("sub") == subject
    assert "exp" in payload


def test_decode_access_token_expired():
    """decode_access_token must return None for expired tokens."""
    subject = "user-expired"
    # Token that expired 5 minutes ago
    expired_token = security.create_access_token(
        subject=subject,
        expires_delta=timedelta(minutes=-5),
    )

    payload = security.decode_access_token(expired_token)
    assert payload is None


def test_decode_access_token_tampered():
    """decode_access_token must return None if token signature is tampered."""
    subject = "user-tamper"
    token = security.create_access_token(subject=subject)
    tampered_token = token[:-4] + "fake"

    payload = security.decode_access_token(tampered_token)
    assert payload is None
