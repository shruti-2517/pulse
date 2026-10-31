from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class CheckResultData(BaseModel):
    """Raw result data returned by probe execution functions."""
    status: str  # "up" or "down"
    status_code: Optional[int] = None
    response_time_ms: float
    error_message: Optional[str] = None
    region: str = "us-east"


class CheckResultResponse(CheckResultData):
    """Public API schema for check results."""
    id: str
    monitor_id: str
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)
