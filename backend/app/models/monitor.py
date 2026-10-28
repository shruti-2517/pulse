from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional
import uuid
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin


class MonitorType(str, Enum):
    HTTP = "http"
    TCP = "tcp"
    HEARTBEAT = "heartbeat"


class MonitorStatus(str, Enum):
    ACTIVE = "active"
    PAUSED = "paused"
    PENDING = "pending"
    UP = "up"
    DOWN = "down"
    DEGRADED = "degraded"


class Monitor(Base, TimestampMixin):
    """
    Monitor entity defining an endpoint or target to probe.
    """
    __tablename__ = "monitors"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    type: Mapped[str] = mapped_column(String(20), default=MonitorType.HTTP.value, nullable=False)

    # HTTP probe parameters
    url: Mapped[Optional[str]] = mapped_column(String(2048), nullable=True)
    method: Mapped[str] = mapped_column(String(10), default="GET", nullable=False)
    headers: Mapped[Dict[str, str]] = mapped_column(JSONB, default=dict, nullable=False)
    body: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    expected_status_code: Mapped[int] = mapped_column(Integer, default=200, nullable=False)
    expected_body_substring: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # TCP probe parameters
    hostname: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    port: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Scheduling & Timing
    interval_seconds: Mapped[int] = mapped_column(Integer, default=60, nullable=False)
    timeout_seconds: Mapped[float] = mapped_column(Integer, default=10, nullable=False)
    regions: Mapped[List[str]] = mapped_column(JSONB, default=lambda: ["us-east", "eu-central"], nullable=False)

    # State & Execution tracking
    status: Mapped[str] = mapped_column(String(20), default=MonitorStatus.ACTIVE.value, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    last_checked_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    next_run_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=True,
        index=True,
    )
