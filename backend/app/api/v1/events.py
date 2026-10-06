from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import Optional

from app.db.session import get_db
from app.db.models import Project
from app.core.auth import get_project_by_api_key, get_project_by_api_key_or_public
from app.api.schemas.events import EventBatchIn, EventBatchOut, PaginatedEventsOut
from app.services import event_service

router = APIRouter(prefix="/runs/{run_id}/events", tags=["events"])

@router.post("", response_model=EventBatchOut, status_code=200)
async def post_events(
    run_id: UUID,
    batch: EventBatchIn,
    db: AsyncSession = Depends(get_db),
    project: Project = Depends(get_project_by_api_key)
):
    return await event_service.batch_ingest_events(db, project, run_id, batch)

@router.get("", response_model=PaginatedEventsOut)
async def get_events(
    run_id: UUID,
    after: Optional[int] = Query(None, description="Cursor sequence number"),
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    project: Project | None = Depends(get_project_by_api_key_or_public)
):
    return await event_service.get_events_paginated(db, project, run_id, after, limit)
