from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_current_user
from app.core.database import get_db_session
from app.models.check_result import CheckResult
from app.models.monitor import Monitor, MonitorStatus
from app.models.user import User
from app.schemas.check_result import CheckResultResponse
from app.schemas.monitor import MonitorCreate, MonitorResponse, MonitorUpdate
from app.services.prober import execute_http_probe, execute_tcp_probe, record_check_result

router = APIRouter(prefix="/monitors", tags=["Monitors"])


@router.get("", response_model=List[MonitorResponse])
async def list_monitors(
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
):
    """
    List all monitors belonging to the authenticated user.
    """
    stmt = (
        select(Monitor)
        .where(Monitor.user_id == current_user.id)
        .order_by(Monitor.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("", response_model=MonitorResponse, status_code=status.HTTP_201_CREATED)
async def create_monitor(
    monitor_in: MonitorCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
):
    """
    Register a new monitor.
    """
    monitor_data = monitor_in.model_dump()
    monitor = Monitor(
        **monitor_data,
        user_id=current_user.id,
        status=MonitorStatus.ACTIVE.value,
        is_active=True,
        next_run_at=datetime.now(timezone.utc),
    )
    db.add(monitor)
    await db.commit()
    await db.refresh(monitor)
    return monitor


@router.get("/{monitor_id}", response_model=MonitorResponse)
async def get_monitor(
    monitor_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
):
    """
    Retrieve details of a single monitor by ID.
    """
    stmt = select(Monitor).where(Monitor.id == monitor_id, Monitor.user_id == current_user.id)
    result = await db.execute(stmt)
    monitor = result.scalar_one_or_none()

    if not monitor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Monitor not found",
        )
    return monitor


@router.patch("/{monitor_id}", response_model=MonitorResponse)
async def update_monitor(
    monitor_id: str,
    monitor_in: MonitorUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
):
    """
    Update configuration of an existing monitor.
    """
    stmt = select(Monitor).where(Monitor.id == monitor_id, Monitor.user_id == current_user.id)
    result = await db.execute(stmt)
    monitor = result.scalar_one_or_none()

    if not monitor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Monitor not found",
        )

    update_data = monitor_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(monitor, field, value)

    await db.commit()
    await db.refresh(monitor)
    return monitor


@router.post("/{monitor_id}/pause", response_model=MonitorResponse)
async def pause_monitor(
    monitor_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
):
    """
    Pause an active monitor.
    """
    stmt = select(Monitor).where(Monitor.id == monitor_id, Monitor.user_id == current_user.id)
    result = await db.execute(stmt)
    monitor = result.scalar_one_or_none()

    if not monitor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Monitor not found")

    monitor.status = MonitorStatus.PAUSED.value
    monitor.is_active = False
    await db.commit()
    await db.refresh(monitor)
    return monitor


@router.post("/{monitor_id}/resume", response_model=MonitorResponse)
async def resume_monitor(
    monitor_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
):
    """
    Resume a paused monitor.
    """
    stmt = select(Monitor).where(Monitor.id == monitor_id, Monitor.user_id == current_user.id)
    result = await db.execute(stmt)
    monitor = result.scalar_one_or_none()

    if not monitor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Monitor not found")

    monitor.status = MonitorStatus.ACTIVE.value
    monitor.is_active = True
    monitor.next_run_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(monitor)
    return monitor


@router.delete("/{monitor_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_monitor(
    monitor_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
):
    """
    Delete a monitor.
    """
    stmt = select(Monitor).where(Monitor.id == monitor_id, Monitor.user_id == current_user.id)
    result = await db.execute(stmt)
    monitor = result.scalar_one_or_none()

    if not monitor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Monitor not found")

    await db.delete(monitor)
    await db.commit()
    return None


@router.post("/{monitor_id}/check", response_model=CheckResultResponse)
async def trigger_monitor_check(
    monitor_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
):
    """
    Execute an on-demand probe for a specific monitor and record its result.
    """
    stmt = select(Monitor).where(Monitor.id == monitor_id, Monitor.user_id == current_user.id)
    result = await db.execute(stmt)
    monitor = result.scalar_one_or_none()

    if not monitor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Monitor not found")

    if monitor.type == "http":
        probe_data = await execute_http_probe(
            url=monitor.url,
            method=monitor.method,
            headers=monitor.headers,
            body=monitor.body,
            expected_status=monitor.expected_status_code,
            expected_body=monitor.expected_body_substring,
            timeout=float(monitor.timeout_seconds),
        )
    elif monitor.type == "tcp":
        probe_data = await execute_tcp_probe(
            hostname=monitor.hostname,
            port=monitor.port,
            timeout=float(monitor.timeout_seconds),
        )
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Unsupported monitor type: {monitor.type}")

    check_record = await record_check_result(db, monitor, probe_data)
    return check_record


@router.get("/{monitor_id}/results", response_model=List[CheckResultResponse])
async def get_monitor_results(
    monitor_id: str,
    limit: int = Query(default=30, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
):
    """
    Fetch historical check results for a monitor (latest first).
    """
    stmt = select(Monitor).where(Monitor.id == monitor_id, Monitor.user_id == current_user.id)
    result = await db.execute(stmt)
    monitor = result.scalar_one_or_none()

    if not monitor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Monitor not found")

    results_stmt = (
        select(CheckResult)
        .where(CheckResult.monitor_id == monitor_id)
        .order_by(CheckResult.timestamp.desc())
        .limit(limit)
    )
    res = await db.execute(results_stmt)
    return res.scalars().all()
