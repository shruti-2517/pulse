import asyncio
from datetime import timedelta
from unittest.mock import AsyncMock, MagicMock, patch
import httpx
import pytest
from app.models.monitor import Monitor, MonitorStatus, MonitorType
from app.schemas.check_result import CheckResultData
from app.services import prober


@pytest.mark.asyncio
async def test_http_probe_success():
    """execute_http_probe must return status 'up' when status code matches expected."""
    mock_response = MagicMock(spec=httpx.Response)
    mock_response.status_code = 200
    mock_response.text = "OK - System operational"

    with patch("httpx.AsyncClient.request", new_callable=AsyncMock) as mock_request:
        mock_request.return_value = mock_response

        result = await prober.execute_http_probe(
            url="https://api.example.com/health",
            expected_status=200,
        )

        assert isinstance(result, CheckResultData)
        assert result.status == "up"
        assert result.status_code == 200
        assert result.response_time_ms >= 0
        assert result.error_message is None


@pytest.mark.asyncio
async def test_http_probe_status_mismatch():
    """execute_http_probe must return status 'down' when status code differs from expected."""
    mock_response = MagicMock(spec=httpx.Response)
    mock_response.status_code = 502
    mock_response.text = "Bad Gateway"

    with patch("httpx.AsyncClient.request", new_callable=AsyncMock) as mock_request:
        mock_request.return_value = mock_response

        result = await prober.execute_http_probe(
            url="https://api.example.com/health",
            expected_status=200,
        )

        assert result.status == "down"
        assert result.status_code == 502
        assert "502" in result.error_message


@pytest.mark.asyncio
async def test_http_probe_expected_body_found():
    """execute_http_probe must pass when expected substring is present in response text."""
    mock_response = MagicMock(spec=httpx.Response)
    mock_response.status_code = 200
    mock_response.text = '{"status": "ready", "database": "healthy"}'

    with patch("httpx.AsyncClient.request", new_callable=AsyncMock) as mock_request:
        mock_request.return_value = mock_response

        result = await prober.execute_http_probe(
            url="https://api.example.com/health",
            expected_status=200,
            expected_body="ready",
        )

        assert result.status == "up"


@pytest.mark.asyncio
async def test_http_probe_expected_body_missing():
    """execute_http_probe must fail when expected substring is absent from response text."""
    mock_response = MagicMock(spec=httpx.Response)
    mock_response.status_code = 200
    mock_response.text = '{"status": "error"}'

    with patch("httpx.AsyncClient.request", new_callable=AsyncMock) as mock_request:
        mock_request.return_value = mock_response

        result = await prober.execute_http_probe(
            url="https://api.example.com/health",
            expected_status=200,
            expected_body="healthy",
        )

        assert result.status == "down"
        assert "healthy" in result.error_message


@pytest.mark.asyncio
async def test_http_probe_timeout():
    """execute_http_probe must catch timeout and return status 'down'."""
    with patch("httpx.AsyncClient.request", side_effect=httpx.ReadTimeout("Timed out")):
        result = await prober.execute_http_probe(
            url="https://slow-api.example.com",
            timeout=1.0,
        )

        assert result.status == "down"
        assert "timed out" in result.error_message.lower()


@pytest.mark.asyncio
async def test_tcp_probe_success():
    """execute_tcp_probe must return status 'up' when TCP socket connects."""
    mock_reader = AsyncMock()
    mock_writer = AsyncMock()
    mock_writer.close = MagicMock()
    mock_writer.wait_closed = AsyncMock()

    with patch("asyncio.open_connection", return_value=(mock_reader, mock_writer)):
        result = await prober.execute_tcp_probe(
            hostname="127.0.0.1",
            port=5432,
            timeout=2.0,
        )

        assert isinstance(result, CheckResultData)
        assert result.status == "up"
        assert result.response_time_ms >= 0
        mock_writer.close.assert_called_once()


@pytest.mark.asyncio
async def test_tcp_probe_failure():
    """execute_tcp_probe must catch socket errors and return status 'down'."""
    with patch("asyncio.open_connection", side_effect=ConnectionRefusedError("Connection refused")):
        result = await prober.execute_tcp_probe(
            hostname="127.0.0.1",
            port=9999,
            timeout=2.0,
        )

        assert result.status == "down"
        assert "Connection refused" in result.error_message


@pytest.mark.asyncio
async def test_record_check_result():
    """record_check_result must persist CheckResult and advance monitor next_run_at."""
    monitor = Monitor(
        id="mon-123",
        user_id="user-123",
        name="Prod API",
        type=MonitorType.HTTP.value,
        interval_seconds=60,
        status=MonitorStatus.ACTIVE.value,
        is_active=True,
    )
    result_data = CheckResultData(
        status="up",
        status_code=200,
        response_time_ms=45.2,
        region="us-east",
    )

    mock_db = AsyncMock()
    mock_db.add = MagicMock()
    mock_db.commit = AsyncMock()
    mock_db.refresh = AsyncMock()

    saved_result = await prober.record_check_result(
        db=mock_db,
        monitor=monitor,
        result_data=result_data,
    )

    mock_db.add.assert_called_once()
    mock_db.commit.assert_called_once()
    assert monitor.status == "up"
    assert monitor.last_checked_at is not None
    assert monitor.next_run_at is not None
    # Next run time should be roughly now + 60 seconds
    assert monitor.next_run_at > monitor.last_checked_at
