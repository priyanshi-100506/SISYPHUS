import logging
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Run, Event, Finding
from app.analysis.detectors import EventDTO, detect_all
from app.analysis.ai_explainer import generate_explanation

logger = logging.getLogger(__name__)

async def analyze(run_id, db: AsyncSession) -> List[Finding] if False else None:
    """
    Runs deterministic analysis on a completed run and persists findings.
    """
    logger.info(f"Starting analysis engine for run_id={run_id}")

    # Fetch run
    result = await db.execute(select(Run).where(Run.id == run_id))
    run = result.scalar_one_or_none()
    if not run:
        logger.error(f"Run {run_id} not found for analysis.")
        return

    # Fetch events ordered by sequence_number
    events_res = await db.execute(
        select(Event).where(Event.run_id == run_id).order_by(Event.sequence_number.asc())
    )
    db_events = events_res.scalars().all()

    # Convert to DTOs
    dtos = [
        EventDTO(
            sequence_number=e.sequence_number,
            event_type=e.event_type,
            tool_name=e.tool_name,
            model=e.model,
            input_hash=e.input_hash,
            output_hash=e.output_hash,
            state_hash=e.state_hash,
            status=e.status,
            tokens_in=e.tokens_in,
            tokens_out=e.tokens_out,
            latency_ms=e.latency_ms
        )
        for e in db_events
    ]

    # Delete pre-existing findings for idempotent re-analysis
    await db.execute(
        Finding.__table__.delete().where(Finding.run_id == run_id)
    )

    detected_findings = detect_all(dtos)

    # Persist findings
    for f_dto in detected_findings:
        explanation = await generate_explanation(f_dto.type, f_dto.evidence)
        finding = Finding(
            run_id=run_id,
            type=f_dto.type,
            severity=f_dto.severity,
            step_start=f_dto.step_start,
            step_end=f_dto.step_end,
            description=f_dto.description,
            evidence=f_dto.evidence,
            waste_tokens=f_dto.waste_tokens,
            waste_ms=f_dto.waste_ms,
            waste_cost=f_dto.waste_cost,
            explanation=explanation
        )
        db.add(finding)

    run.analyzed_at = datetime.now(timezone.utc)
    await db.commit()
    logger.info(f"Analysis finished for run_id={run_id}. Generated {len(detected_findings)} findings.")
