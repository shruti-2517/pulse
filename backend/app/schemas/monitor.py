from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field, model_validator
from app.models.monitor import MonitorStatus, MonitorType


class MonitorBase(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    type: MonitorType = MonitorType.HTTP
    url: Optional[str] = None
    method: str = "GET"
    headers: Dict[str, str] = Field(default_factory=dict)
    body: Optional[str] = None
    expected_status_code: int = 200
    expected_body_substring: Optional[str] = None
    hostname: Optional[str] = None
    port: Optional[int] = Field(default=None, ge=1, le=65535)
    interval_seconds: int = Field(default=60, ge=30, le=86400)
    timeout_seconds: float = Field(default=10.0, ge=1.0, le=60.0)
    regions: List[str] = Field(default_factory=lambda: ["us-east", "eu-central"])


class MonitorCreate(MonitorBase):
    @model_validator(mode="after")
    def validate_type_fields(self) -> "MonitorCreate":
        if self.type == MonitorType.HTTP:
            if not self.url:
                raise ValueError("url is required for HTTP monitors")
            if not (self.url.startswith("http://") or self.url.startswith("https://")):
                raise ValueError("url must begin with http:// or https://")
        elif self.type == MonitorType.TCP:
            if not self.hostname or not self.port:
                raise ValueError("hostname and port are required for TCP monitors")
        return self


class MonitorUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    url: Optional[str] = None
    method: Optional[str] = None
    headers: Optional[Dict[str, str]] = None
    body: Optional[str] = None
    expected_status_code: Optional[int] = None
    expected_body_substring: Optional[str] = None
    hostname: Optional[str] = None
    port: Optional[int] = Field(default=None, ge=1, le=65535)
    interval_seconds: Optional[int] = Field(default=None, ge=30, le=86400)
    timeout_seconds: Optional[float] = Field(default=None, ge=1.0, le=60.0)
    regions: Optional[List[str]] = None
    is_active: Optional[bool] = None


class MonitorResponse(MonitorBase):
    id: str
    user_id: str
    status: str
    is_active: bool
    last_checked_at: Optional[datetime] = None
    next_run_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
