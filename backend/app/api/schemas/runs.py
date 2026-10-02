from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional
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

class CompleteRunIn(BaseModel):
    status: str = "completed"

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

