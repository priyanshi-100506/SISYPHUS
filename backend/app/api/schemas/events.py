from pydantic import BaseModel, Field, ConfigDict
from uuid import UUID
from datetime import datetime, timezone
from typing import Optional, Any, List

class EventIn(BaseModel):
    sequence_number: int
    event_type: str  # think | tool | error | end
    tool_name: Optional[str] = None
    model: Optional[str] = None
    input: Optional[Any] = None
    output: Optional[Any] = None
    status: str = "ok"  # ok | error
    error_code: Optional[str] = None
    tokens_in: int = 0
    tokens_out: int = 0
    latency_ms: Optional[int] = None
    timestamp: Optional[datetime] = Field(default_factory=lambda: datetime.now(timezone.utc))
    state_hash: Optional[str] = None
    parent_id: Optional[UUID] = None

class EventBatchIn(BaseModel):
    events: List[EventIn] = Field(..., max_length=500)

class EventBatchOut(BaseModel):
    accepted: int
    duplicates: int

class EventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    run_id: UUID
    sequence_number: int
    parent_id: Optional[UUID] = None
    event_type: str
    tool_name: Optional[str] = None
    model: Optional[str] = None
    input_hash: Optional[str] = None
    output_hash: Optional[str] = None
    state_hash: Optional[str] = None
    input_preview: Optional[str] = None
    output_preview: Optional[str] = None
    status: str
    error_code: Optional[str] = None
    tokens_in: int
    tokens_out: int
    latency_ms: Optional[int] = None
    timestamp: datetime

class PaginatedEventsOut(BaseModel):
    events: List[EventOut]
    next_cursor: Optional[int] = None
