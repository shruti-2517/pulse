"""
Probe Execution and Result Storage Service.

This module executes active health checks against HTTP(S) and TCP targets,
calculates accurate round-trip latencies, and stores time-series check results.
You (the mentee) will implement the core probe execution logic in this file.
"""

import asyncio
from datetime import datetime, timedelta, timezone
import time
from typing import Dict, Optional
import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.check_result import CheckResult
from app.models.monitor import Monitor
from app.schemas.check_result import CheckResultData


async def execute_http_probe(
    url: str,
    method: str = "GET",
    headers: Optional[Dict[str, str]] = None,
    body: Optional[str] = None,
    expected_status: int = 200,
    expected_body: Optional[str] = None,
    timeout: float = 10.0,
    region: str = "us-east",
) -> CheckResultData:
    """
    Execute an asynchronous HTTP probe against a target URL.
    """
    starttime = time.perf_counter()
    try:
        async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
            response = await client.request(method, url, headers=headers, content=body)
        latency = round((time.perf_counter() - starttime) * 1000, 2)
        if response.status_code != expected_status:
            return CheckResultData(
                status="down",
                status_code=response.status_code,
                response_time_ms=latency,
                error_message=f"Expected status {expected_status}, got {response.status_code}",
                region=region,
            )    
        if expected_body and expected_body not in response.text:
            return CheckResultData(
                status="down",
                status_code=response.status_code,
                response_time_ms=latency,
                error_message=f"Body substring '{expected_body}' not found",
                region=region,
            )    
        return CheckResultData(
            status="up",
            status_code=response.status_code,
            response_time_ms=latency,
            error_message=None,
            region=region,
        )
    except httpx.TimeoutException:
        latency = round((time.perf_counter() - starttime) * 1000, 2)
        return CheckResultData(
            status="down",
            status_code=None,
            response_time_ms=latency,
            error_message=f"Request timed out after {timeout}s",
            region=region,
        )
    except httpx.RequestError as e:
        latency = round((time.perf_counter() - starttime) * 1000, 2)
        return CheckResultData(
            status="down",
            status_code=None,
            response_time_ms=latency,
            error_message=str(e),
            region=region,
        )    


async def execute_tcp_probe(
    hostname: str,
    port: int,
    timeout: float = 10.0,
    region: str = "us-east",
) -> CheckResultData:
    """
    Execute an asynchronous raw TCP socket connection probe.
    """
   
    starttime = time.perf_counter()
    try:
        reader, writer = await asyncio.wait_for(asyncio.open_connection(hostname, port), timeout=timeout)
        writer.close()
        await writer.wait_closed()
        latency = round((time.perf_counter() - starttime) * 1000, 2)
        return CheckResultData(
            status="up",
            response_time_ms=latency,
            region=region,
        )
    except asyncio.TimeoutError:
        latency = round((time.perf_counter() - starttime) * 1000, 2)
        return CheckResultData(
            status="down",
            response_time_ms=latency,
            error_message=f"TCP connection timed out after {timeout}s",
            region=region,
        )
    except OSError as e:
        latency = round((time.perf_counter() - starttime) * 1000, 2)
        return CheckResultData(
            status="down",
            response_time_ms=latency,
            error_message=str(e),
            region=region,
        )    
    

async def record_check_result(
    db: AsyncSession,
    monitor: Monitor,
    result_data: CheckResultData,
) -> CheckResult:
    """
    Persist check result to database and update monitor's scheduling state.
    """
    result = CheckResult(
        monitor_id=monitor.id,
        timestamp=datetime.now(timezone.utc),
        status=result_data.status,
        status_code=result_data.status_code,
        response_time_ms=result_data.response_time_ms,
        error_message=result_data.error_message,
        region=result_data.region,
    )
    monitor.status = result_data.status
    monitor.last_checked_at = result.timestamp
    monitor.next_run_at = result.timestamp + timedelta(seconds=monitor.interval_seconds)

    db.add(result)
    await db.commit()
    await db.refresh(result)
    return result