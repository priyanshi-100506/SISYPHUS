from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from fastapi import HTTPException
from typing import Optional

from app.db.models import Run, Project, Event
from app.api.schemas.events import EventBatchIn, EventBatchOut, EventOut, PaginatedEventsOut
from app.services.event_utils import canonical_hash, truncate_preview

async def batch_ingest_events(
    db: AsyncSession,
    project: Project,
    run_id,
    batch: EventBatchIn
) -> EventBatchOut:
    # Verify run exists and belongs to project
    res = await db.execute(
        select(Run).where(Run.id == run_id, Run.project_id == project.id)
    )
    run = res.scalar_one_or_none()
    if not run:
        raise HTTPException(
            status_code=404,
            detail={"error": {"code": "NOT_FOUND", "message": "Run not found"}}
        )

    # Reject events on completed runs
    if run.status != "running":
        raise HTTPException(
            status_code=409,
            detail={"error": {"code": "RUN_COMPLETED", "message": f"Cannot add events to run in status '{run.status}'"}}
        )

    if not batch.events:
        return EventBatchOut(accepted=0, duplicates=0)

    # Prepare values for bulk insert with ON CONFLICT DO NOTHING
    values_to_insert = []
    for ev in batch.events:
        in_hash = canonical_hash(ev.input)
        out_hash = canonical_hash(ev.output)

        # state_hash default: hash(tool_name, input_hash, output_hash) if not provided by client
        st_hash = ev.state_hash
        if not st_hash and ev.event_type == "tool":
            st_hash = canonical_hash({"tool_name": ev.tool_name, "input_hash": in_hash, "output_hash": out_hash})

        values_to_insert.append({
            "run_id": run.id,
            "sequence_number": ev.sequence_number,
            "parent_id": ev.parent_id,
            "event_type": ev.event_type,
            "tool_name": ev.tool_name,
            "model": ev.model,
            "input_hash": in_hash,
            "output_hash": out_hash,
            "state_hash": st_hash,
            "input_preview": truncate_preview(ev.input),
            "output_preview": truncate_preview(ev.output),
            "status": ev.status,
            "error_code": ev.error_code,
            "tokens_in": ev.tokens_in,
            "tokens_out": ev.tokens_out,
            "latency_ms": ev.latency_ms,
            "timestamp": ev.timestamp,
        })

    stmt = insert(Event).values(values_to_insert)
    stmt = stmt.on_conflict_do_nothing(index_elements=["run_id", "sequence_number"]).returning(Event.id)

    result = await db.execute(stmt)
    inserted_ids = result.scalars().all()
    await db.commit()

    accepted = len(inserted_ids)
    duplicates = len(batch.events) - accepted
    return EventBatchOut(accepted=accepted, duplicates=duplicates)

async def get_events_paginated(
    db: AsyncSession,
    project: Project | None,
    run_id,
    after: Optional[int] = None,
    limit: int = 100
) -> PaginatedEventsOut:
    # Verify run exists
    stmt = select(Run).where(Run.id == run_id)
    if project:
        stmt = stmt.where(Run.project_id == project.id)
    res = await db.execute(stmt)
    run = res.scalar_one_or_none()
    if not run:
        raise HTTPException(
            status_code=404,
            detail={"error": {"code": "NOT_FOUND", "message": "Run not found"}}
        )

    query = select(Event).where(Event.run_id == run_id)
    if after is not None:
        query = query.where(Event.sequence_number > after)

    query = query.order_by(Event.sequence_number.asc()).limit(limit + 1)
    events_res = await db.execute(query)
    events_list = events_res.scalars().all()

    has_more = len(events_list) > limit
    result_events = events_list[:limit]

    next_cursor = result_events[-1].sequence_number if has_more and result_events else None

    return PaginatedEventsOut(
        events=[EventOut.model_validate(e) for e in result_events],
        next_cursor=next_cursor
    )
