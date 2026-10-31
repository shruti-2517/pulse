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
    """
    result = await asyncio.gather(check_database(), check_redis())
    components = {"database": result[0], "redis": result[1]}
    is_ready = all(component['status'] == 'healthy' for component in components.values())
    details = {
        "status": "ready" if is_ready else "unhealthy",
        "components": components,
    }
    return (is_ready, details)
