from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from fastapi import HTTPException
from datetime import datetime, timezone

from app.db.models import Run, Project, Event, Finding
from app.api.schemas.runs import RunCreate, RunOut, CompleteRunIn, RunMetricsOut
from app.api.schemas.findings import FindingOut
from app.analysis import engine as analysis_engine

async def create_run(db: AsyncSession, project: Project, data: RunCreate) -> RunOut:
    run = Run(
        project_id=project.id,
        status="running",
        input=data.input,
        started_at=datetime.now(timezone.utc)
    )
    db.add(run)
    await db.commit()
    await db.refresh(run)
    return RunOut.model_validate(run)

async def get_run_by_id(db: AsyncSession, project: Project, run_id) -> RunOut:
    res = await db.execute(
        select(Run).where(Run.id == run_id, Run.project_id == project.id)
    )
    run = res.scalar_one_or_none()
    if not run:
        raise HTTPException(
            status_code=404,
            detail={"error": {"code": "NOT_FOUND", "message": "Run not found"}}
        )
    return RunOut.model_validate(run)

async def get_run_findings(db: AsyncSession, project: Project, run_id) -> list[FindingOut]:
    run_res = await db.execute(
        select(Run).where(Run.id == run_id, Run.project_id == project.id)
    )
    run = run_res.scalar_one_or_none()
    if not run:
        raise HTTPException(
            status_code=404,
            detail={"error": {"code": "NOT_FOUND", "message": "Run not found"}}
        )

    findings_res = await db.execute(
        select(Finding).where(Finding.run_id == run_id).order_by(Finding.step_start.asc())
    )
    findings = findings_res.scalars().all()
    return [FindingOut.model_validate(f) for f in findings]

async def complete_run(db: AsyncSession, project: Project, run_id, data: CompleteRunIn) -> RunOut:
    res = await db.execute(
        select(Run).where(Run.id == run_id, Run.project_id == project.id)
    )
    run = res.scalar_one_or_none()
    if not run:
        raise HTTPException(
            status_code=404,
            detail={"error": {"code": "NOT_FOUND", "message": "Run not found"}}
        )

    if run.status != "running":
        raise HTTPException(
            status_code=409,
            detail={"error": {"code": "RUN_ALREADY_COMPLETED", "message": f"Run is already in status '{run.status}'"}}
        )

    # Compute totals from events
    stats_res = await db.execute(
        select(
            func.count(Event.id).label("total_steps"),
            func.coalesce(func.sum(Event.tokens_in), 0).label("total_tokens_in"),
            func.coalesce(func.sum(Event.tokens_out), 0).label("total_tokens_out")
        ).where(Event.run_id == run.id)
    )
    stats = stats_res.one()

    run.status = data.status
    run.finished_at = datetime.now(timezone.utc)
    run.total_steps = stats.total_steps
    run.total_tokens_in = stats.total_tokens_in
    run.total_tokens_out = stats.total_tokens_out

    await db.commit()
    await db.refresh(run)

    # Trigger analysis
    await analysis_engine.analyze(run.id, db)

    return RunOut.model_validate(run)

async def get_run_metrics(db: AsyncSession, project: Project, run_id) -> RunMetricsOut:
    """Aggregate waste stats from findings for a run's metrics dashboard."""
    res = await db.execute(
        select(Run).where(Run.id == run_id, Run.project_id == project.id)
    )
    run = res.scalar_one_or_none()
    if not run:
        raise HTTPException(
            status_code=404,
            detail={"error": {"code": "NOT_FOUND", "message": "Run not found"}}
        )

    findings_res = await db.execute(
        select(Finding).where(Finding.run_id == run_id)
    )
    findings = findings_res.scalars().all()

    waste_tokens = sum(f.waste_tokens for f in findings)
    waste_ms = sum(f.waste_ms for f in findings)
    waste_cost = float(sum(f.waste_cost for f in findings))

    duration_ms = None
    if run.started_at and run.finished_at:
        duration_ms = int((run.finished_at - run.started_at).total_seconds() * 1000)

    return RunMetricsOut(
        total_steps=run.total_steps,
        total_tokens_in=run.total_tokens_in,
        total_tokens_out=run.total_tokens_out,
        total_tokens=run.total_tokens_in + run.total_tokens_out,
        estimated_cost=float(run.estimated_cost),
        duration_ms=duration_ms,
        findings_count=len(findings),
        waste_tokens=waste_tokens,
        waste_ms=waste_ms,
        waste_cost=waste_cost,
    )

