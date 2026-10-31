from datetime import datetime, timezone
from typing import Optional
import uuid
from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base


class CheckResult(Base):
    """
    Time-series record of an individual probe execution.
    In production TimescaleDB, this table converts into a hypertable partitioned by timestamp.
    """
    __tablename__ = "check_results"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )
    monitor_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("monitors.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )
    status: Mapped[str] = mapped_column(String(20), nullable=False)  # "up", "down", "degraded"
    status_code: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    response_time_ms: Mapped[float] = mapped_column(Float, nullable=False)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    region: Mapped[str] = mapped_column(String(50), default="us-east", nullable=False)
