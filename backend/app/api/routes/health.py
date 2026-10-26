from fastapi import APIRouter, status
from fastapi.responses import JSONResponse
from app.services.health import get_readiness_status

router = APIRouter(prefix="/health", tags=["Health & Readiness"])


@router.get("/live", status_code=status.HTTP_200_OK, summary="Liveness Probe")
async def liveness():
    """
    Kubernetes / Docker Liveness Probe.
    Returns 200 OK immediately if the web server process is alive and responsive.
    Does NOT check downstream dependencies to prevent cascading restart loops.
    """
    return {"status": "alive"}


@router.get("/ready", summary="Readiness Probe")
async def readiness():
    """
    Kubernetes / Docker Readiness Probe.
    Checks whether the service is ready to accept incoming user requests.
    Returns:
        - HTTP 200 OK with component health details if all dependencies are ready.
        - HTTP 503 Service Unavailable if any dependency (DB or Redis) is down.
    """
    is_ready, details = await get_readiness_status()
    status_code = status.HTTP_200_OK if is_ready else status.HTTP_503_SERVICE_UNAVAILABLE
    return JSONResponse(status_code=status_code, content=details)
