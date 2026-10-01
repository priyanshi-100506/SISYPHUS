from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Any, Dict, Optional

class FindingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    run_id: UUID
    type: str
    severity: str
    step_start: int
    step_end: int
    description: str
    evidence: Dict[str, Any]
    waste_tokens: int
    waste_ms: int
    waste_cost: float
    explanation: Optional[str] = None
    created_at: datetime

