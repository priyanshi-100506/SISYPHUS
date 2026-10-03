from pydantic import BaseModel, ConfigDict, field_validator
from uuid import UUID
from datetime import datetime
from typing import Literal, Optional
from decimal import Decimal

class RunCreate(BaseModel):
    input: Optional[str] = None

class RunOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    status: str
    input: Optional[str] = None
    started_at: datetime
    finished_at: Optional[datetime] = None
    total_steps: int
    total_tokens_in: int
    total_tokens_out: int
    estimated_cost: Decimal
    analyzed_at: Optional[datetime] = None

VALID_TERMINAL_STATUSES = {"completed", "failed", "terminated", "timeout"}

class CompleteRunIn(BaseModel):
    status: str = "completed"

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        if v not in VALID_TERMINAL_STATUSES:
            raise ValueError(f"status must be one of: {', '.join(sorted(VALID_TERMINAL_STATUSES))}")
        return v

class RunMetricsOut(BaseModel):
    total_steps: int
    total_tokens_in: int
    total_tokens_out: int
    total_tokens: int
    estimated_cost: float
    duration_ms: Optional[int] = None
    findings_count: int
    waste_tokens: int
    waste_ms: int
    waste_cost: float

