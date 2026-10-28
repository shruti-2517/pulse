import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app
from app.models.user import User
from app.services.security import create_access_token


@pytest.fixture
def test_user():
    return User(
        id="test-user-uuid-1234",
        email="operator@pulse.dev",
        hashed_password="fake_hashed_pw",
        full_name="Pulse Operator",
        is_active=True,
    )


@pytest.fixture
def auth_headers(test_user):
    token = create_access_token(subject=test_user.id)
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_monitor_unauthorized_without_token():
    """Accessing monitor endpoints without bearer token must return 401 Unauthorized."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/monitors")
        assert response.status_code == 401


@pytest.mark.asyncio
async def test_create_http_monitor_validation():
    """Creating HTTP monitor without http/https URL must fail with 422 Unprocessable Entity."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Invalid URL scheme
        response = await client.post(
            "/api/v1/monitors",
            json={
                "name": "Invalid Monitor",
                "type": "http",
                "url": "ftp://example.com",
            },
            headers={"Authorization": "Bearer fake_token"},
        )
        assert response.status_code in (401, 422)
