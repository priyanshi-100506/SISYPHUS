from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional

class ProjectCreate(BaseModel):
    name: str
    slug: str
    language: Optional[str] = None

class ProjectOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    name: str
    slug: str
    language: Optional[str] = None
    key_prefix: str
    is_demo: bool
    created_at: datetime

class ProjectWithKey(ProjectOut):
    api_key: str
