"""
Health and readiness service module.

This module provides probe checks for core infrastructure dependencies (PostgreSQL and Redis).
You (the mentee) will implement the core verification logic in this file.
"""

import asyncio
import time
from typing import Any, Dict, Tuple
from app.core.database import engine, get_redis_client
from sqlalchemy import text


async def check_database(timeout: float = 2.0) -> Dict[str, Any]:
    """
    Verify PostgreSQL connectivity and query execution within a deadline.

    Contract:
    - Input:
        - timeout: Maximum time in seconds to wait before marking the check failed.
    - Expected Behavior:
        - Measure elapsed execution time in milliseconds (latency_ms).
        - Acquire an async connection or session and execute a lightweight test query ("SELECT 1").
        - Must complete within `timeout` seconds.
    - Return Value on Success:
        {
            "status": "healthy",
            "latency_ms": round(latency, 2)
        }
    - Return Value on Failure (connection error, query error, or timeout):
        {
            "status": "unhealthy",
            "error": "<error message>",
            "latency_ms": round(latency, 2)
        }
    - Edge Cases:
        - Connection refused / database down -> Catch exception, do not crash endpoint.
        - Query takes longer than timeout -> Catch asyncio.TimeoutError and return status: unhealthy.
    """
    starttime = time.time()
    try:
        async with engine.connect() as conn:
            await asyncio.wait_for(conn.execute(text("SELECT 1")), timeout=timeout)
            endtime = time.time()
            latency = (endtime - starttime) * 1000
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "latency_ms": round((time.time() - starttime) * 1000, 2)
        }
    return {
        "status": "healthy",
        "latency_ms": round(latency, 2)
    }


async def check_redis(timeout: float = 2.0) -> Dict[str, Any]:
    """
    Verify Redis connectivity via a ping command within a deadline.

    Contract:
    - Input:
        - timeout: Maximum time in seconds to wait before marking the check failed.
    - Expected Behavior:
        - Measure elapsed execution time in milliseconds (latency_ms).
        - Obtain the async Redis client via `get_redis_client()`.
        - Ping Redis (e.g., `await client.ping()`).
        - Must complete within `timeout` seconds.
    - Return Value on Success:
        {
            "status": "healthy",
            "latency_ms": round(latency, 2)
        }
    - Return Value on Failure:
        {
            "status": "unhealthy",
            "error": "<error message>",
            "latency_ms": round(latency, 2)
        }
    - Edge Cases:
        - Redis connection refused / network error -> Catch exception, do not crash endpoint.
        - Operation times out -> Catch asyncio.TimeoutError and return status: unhealthy.
    """
    starttime = time.time()
    try:
        client = get_redis_client()
        await asyncio.wait_for(client.ping(), timeout=timeout)
        endtime = time.time()
        latency = (endtime - starttime) * 1000
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "latency_ms": round((time.time() - starttime) * 1000, 2)
        }
    return {
        "status": "healthy",
        "latency_ms": round(latency, 2)
    }


async def get_readiness_status() -> Tuple[bool, Dict[str, Any]]:
    """
    Evaluate system readiness by concurrently checking all infrastructure dependencies.

    Contract:
    - Expected Behavior:
        - Execute `check_database()` and `check_redis()` concurrently (hint: use asyncio.gather).
        - System is ready (`is_ready=True`) ONLY IF both Postgres and Redis report "healthy".
    - Return Value:
        A tuple of (is_ready: bool, details: dict):
        (
            True,
            {
                "status": "ready",
                "components": {
                    "database": {"status": "healthy", "latency_ms": 1.2},
                    "redis": {"status": "healthy", "latency_ms": 0.5}
                }
            }
        )
        If any component is unhealthy:
        (
            False,
            {
                "status": "unhealthy",
                "components": {
                    "database": {"status": "unhealthy", "error": "...", "latency_ms": 2000.0},
                    "redis": {"status": "healthy", "latency_ms": 0.5}
                }
            }
        )
    """
    result = await asyncio.gather(check_database(), check_redis())
    components = {"database": result[0], "redis": result[1]}
    is_ready = all(component['status'] == 'healthy' for component in components.values())
    details = {
        "status": "ready" if is_ready else "unhealthy",
        "components": components,
    }
    return (is_ready, details)
