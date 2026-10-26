import asyncio
from unittest.mock import AsyncMock, patch
import pytest
from httpx import AsyncClient
from app.services import health


@pytest.mark.asyncio
async def test_liveness_endpoint(async_client: AsyncClient):
    """Liveness probe must return HTTP 200 and {'status': 'alive'} unconditionally."""
    response = await async_client.get("/api/v1/health/live")
    assert response.status_code == 200
    assert response.json() == {"status": "alive"}


@pytest.mark.asyncio
async def test_check_database_healthy():
    """check_database() must execute query and return status 'healthy' with latency."""
    mock_conn = AsyncMock()
    mock_conn.execute.return_value = None

    with patch("sqlalchemy.ext.asyncio.AsyncEngine.connect") as mock_connect:
        mock_connect.return_value.__aenter__.return_value = mock_conn
        result = await health.check_database(timeout=1.0)

        assert isinstance(result, dict)
        assert result.get("status") == "healthy"
        assert "latency_ms" in result
        assert isinstance(result["latency_ms"], (int, float))
        assert result["latency_ms"] >= 0


@pytest.mark.asyncio
async def test_check_database_unhealthy_on_exception():
    """check_database() must catch connection errors and return status 'unhealthy'."""
    with patch("sqlalchemy.ext.asyncio.AsyncEngine.connect", side_effect=Exception("Database connection refused")):
        result = await health.check_database(timeout=1.0)

        assert isinstance(result, dict)
        assert result.get("status") == "unhealthy"
        assert "error" in result
        assert "Database connection refused" in result["error"]
        assert "latency_ms" in result


@pytest.mark.asyncio
async def test_check_database_timeout():
    """check_database() must enforce deadline and catch timeout."""
    mock_conn = AsyncMock()

    async def slow_execute(*args, **kwargs):
        await asyncio.sleep(0.5)

    mock_conn.execute.side_effect = slow_execute

    with patch("sqlalchemy.ext.asyncio.AsyncEngine.connect") as mock_connect:
        mock_connect.return_value.__aenter__.return_value = mock_conn
        result = await health.check_database(timeout=0.05)

        assert isinstance(result, dict)
        assert result.get("status") == "unhealthy"
        assert "error" in result
        assert "latency_ms" in result


@pytest.mark.asyncio
async def test_check_redis_healthy():
    """check_redis() must ping redis and return status 'healthy' with latency."""
    mock_redis = AsyncMock()
    mock_redis.ping.return_value = True

    with patch("app.services.health.get_redis_client", return_value=mock_redis):
        result = await health.check_redis(timeout=1.0)

        assert isinstance(result, dict)
        assert result.get("status") == "healthy"
        assert "latency_ms" in result
        assert result["latency_ms"] >= 0


@pytest.mark.asyncio
async def test_check_redis_unhealthy_on_exception():
    """check_redis() must catch redis connection errors and return status 'unhealthy'."""
    mock_redis = AsyncMock()
    mock_redis.ping.side_effect = ConnectionRefusedError("Redis down")

    with patch("app.services.health.get_redis_client", return_value=mock_redis):
        result = await health.check_redis(timeout=1.0)

        assert isinstance(result, dict)
        assert result.get("status") == "unhealthy"
        assert "error" in result
        assert "Redis down" in result["error"]
        assert "latency_ms" in result


@pytest.mark.asyncio
async def test_get_readiness_status_ready():
    """When both DB and Redis are healthy, get_readiness_status returns (True, details)."""
    with patch("app.services.health.check_database", new_callable=AsyncMock) as mock_db, \
         patch("app.services.health.check_redis", new_callable=AsyncMock) as mock_redis:

        mock_db.return_value = {"status": "healthy", "latency_ms": 1.5}
        mock_redis.return_value = {"status": "healthy", "latency_ms": 0.8}

        is_ready, details = await health.get_readiness_status()

        assert is_ready is True
        assert details["status"] == "ready"
        assert details["components"]["database"]["status"] == "healthy"
        assert details["components"]["redis"]["status"] == "healthy"


@pytest.mark.asyncio
async def test_get_readiness_status_unhealthy_when_one_fails():
    """When any dependency fails, get_readiness_status returns (False, details)."""
    with patch("app.services.health.check_database", new_callable=AsyncMock) as mock_db, \
         patch("app.services.health.check_redis", new_callable=AsyncMock) as mock_redis:

        mock_db.return_value = {"status": "healthy", "latency_ms": 1.5}
        mock_redis.return_value = {"status": "unhealthy", "error": "Connection lost", "latency_ms": 50.0}

        is_ready, details = await health.get_readiness_status()

        assert is_ready is False
        assert details["status"] == "unhealthy"
        assert details["components"]["redis"]["status"] == "unhealthy"


@pytest.mark.asyncio
async def test_readiness_endpoint_http_status_codes(async_client: AsyncClient):
    """
    Readiness endpoint must return:
    - HTTP 200 OK when ready
    - HTTP 503 SERVICE UNAVAILABLE when not ready
    """
    # 1. Healthy scenario -> 200
    with patch("app.api.routes.health.get_readiness_status", new_callable=AsyncMock) as mock_status:
        mock_status.return_value = (True, {"status": "ready", "components": {}})
        response = await async_client.get("/api/v1/health/ready")
        assert response.status_code == 200
        assert response.json()["status"] == "ready"

    # 2. Degraded scenario -> 503
    with patch("app.api.routes.health.get_readiness_status", new_callable=AsyncMock) as mock_status:
        mock_status.return_value = (False, {"status": "unhealthy", "components": {}})
        response = await async_client.get("/api/v1/health/ready")
        assert response.status_code == 503
        assert response.json()["status"] == "unhealthy"
