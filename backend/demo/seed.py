import asyncio
import logging
from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.models import User, Project, Run, Event
from app.core.security import generate_api_key
from app.services.event_utils import canonical_hash, truncate_preview

logger = logging.getLogger(__name__)

DEMO_USER_EMAIL = "demo@sisyphus.dev"


async def seed_demo(db: AsyncSession = None):
    from app.db.session import AsyncSessionLocal

    async def _run_seed(session: AsyncSession):
        # 1. User
        res = await session.execute(select(User).where(User.email == DEMO_USER_EMAIL))
        user = res.scalar_one_or_none()
        if not user:
            user = User(email=DEMO_USER_EMAIL)
            session.add(user)
            await session.commit()
            await session.refresh(user)

        # 2. Project
        res = await session.execute(
            select(Project).where(Project.user_id == user.id, Project.slug == "research-agent")
        )
        project = res.scalar_one_or_none()
        if not project:
            full_key, key_hash, key_prefix = generate_api_key()
            project = Project(
                user_id=user.id,
                name="Research Agent Demo",
                slug="research-agent",
                language="python",
                api_key_hash=key_hash,
                key_prefix=key_prefix,
                is_demo=True,
            )
            session.add(project)
            await session.commit()
            await session.refresh(project)
        else:
            # If the project already exists, check if runs are already seeded
            runs_res = await session.execute(
                select(Run).where(Run.project_id == project.id)
            )
            if runs_res.scalars().all():
                logger.info("Demo data already seeded, skipping.")
                return

        base_ts = datetime.now(timezone.utc) - timedelta(hours=2)

        # ── 3. Clean run ──────────────────────────────────────────────────────
        clean_started = base_ts
        clean_finished = clean_started + timedelta(seconds=4)
        clean_run = Run(
            project_id=project.id,
            status="completed",
            input="Find three Python web frameworks and compare them.",
            started_at=clean_started,
            finished_at=clean_finished,
            total_steps=7,
            total_tokens_in=1450,
            total_tokens_out=620,
            estimated_cost=0.000030,
        )
        session.add(clean_run)
        await session.commit()
        await session.refresh(clean_run)

        clean_events = [
            {"seq": 1, "type": "tool", "name": "search",
             "in": {"query": "Python web frameworks 2026"},
             "out": {"results": ["Django", "Flask", "FastAPI"]},
             "tok_in": 220, "tok_out": 90, "ms": 480},
            {"seq": 2, "type": "tool", "name": "read_url",
             "in": {"url": "fastapi.tiangolo.com"},
             "out": {"text": "FastAPI is a modern, fast web framework"},
             "tok_in": 310, "tok_out": 140, "ms": 820},
            {"seq": 3, "type": "think", "name": None,
             "in": {"note": "Comparing Django vs Flask vs FastAPI"},
             "out": None, "tok_in": 280, "tok_out": 95, "ms": 340},
            {"seq": 4, "type": "tool", "name": "read_url",
             "in": {"url": "djangoproject.com"},
             "out": {"text": "Django: The web framework for perfectionists"},
             "tok_in": 290, "tok_out": 130, "ms": 760},
            {"seq": 5, "type": "think", "name": None,
             "in": {"note": "Evaluating trade-offs"},
             "out": None, "tok_in": 265, "tok_out": 80, "ms": 310},
            {"seq": 6, "type": "tool", "name": "summarize",
             "in": {"topic": "Python web frameworks comparison"},
             "out": {"summary": "Django=full-stack, FastAPI=APIs, Flask=micro"},
             "tok_in": 340, "tok_out": 180, "ms": 1200},
            {"seq": 7, "type": "end", "name": None,
             "in": {"result": "Django for full stack, FastAPI for APIs, Flask for microservices"},
             "out": None, "tok_in": 0, "tok_out": 0, "ms": 0},
        ]

        for i, e in enumerate(clean_events):
            in_h = canonical_hash(e["in"])
            out_h = canonical_hash(e["out"])
            session.add(Event(
                run_id=clean_run.id,
                sequence_number=e["seq"],
                event_type=e["type"],
                tool_name=e["name"],
                model="claude-sonnet-4-6",
                input_hash=in_h,
                output_hash=out_h,
                input_preview=truncate_preview(e["in"]),
                output_preview=truncate_preview(e["out"]),
                tokens_in=e["tok_in"],
                tokens_out=e["tok_out"],
                latency_ms=e["ms"] if e["ms"] > 0 else None,
                status="ok",
                timestamp=clean_started + timedelta(seconds=i * 0.6),
            ))

        # ── 4. Flawed run (search loop — 6 repeated identical calls) ─────────
        # The REPEATED_TOOL detector triggers at threshold=3, so 6 calls gives
        # a strong HIGH-severity signal and a clear demo story.
        flawed_started = base_ts + timedelta(minutes=42)
        flawed_finished = flawed_started + timedelta(seconds=18)
        flawed_run = Run(
            project_id=project.id,
            status="completed",
            input="Find the best hotels in Paris with available rooms tonight.",
            started_at=flawed_started,
            finished_at=flawed_finished,
            total_steps=10,
            total_tokens_in=4312,
            total_tokens_out=756,
            estimated_cost=0.000024,
        )
        session.add(flawed_run)
        await session.commit()
        await session.refresh(flawed_run)

        flawed_search_input = {"query": "Paris hotels available tonight"}
        flawed_search_output = {"results": 10, "status": "no_change", "hotels": []}
        in_h = canonical_hash(flawed_search_input)
        out_h = canonical_hash(flawed_search_output)
        st_h = canonical_hash({"tool_name": "search", "input_hash": in_h, "output_hash": out_h})

        # Step 1: initial think
        session.add(Event(
            run_id=flawed_run.id,
            sequence_number=1,
            event_type="think",
            model="claude-sonnet-4-6",
            input_hash=canonical_hash({"note": "I need to find Paris hotels"}),
            input_preview=truncate_preview({"note": "I need to find Paris hotels"}),
            tokens_in=340,
            tokens_out=75,
            latency_ms=310,
            status="ok",
            timestamp=flawed_started + timedelta(seconds=0.3),
        ))

        # Steps 2–7: 6 identical search calls (the loop)
        for seq in range(2, 8):
            session.add(Event(
                run_id=flawed_run.id,
                sequence_number=seq,
                event_type="tool",
                tool_name="search",
                model="claude-sonnet-4-6",
                input_hash=in_h,
                output_hash=out_h,
                state_hash=st_h,
                input_preview=truncate_preview(flawed_search_input),
                output_preview=truncate_preview(flawed_search_output),
                tokens_in=412,
                tokens_out=96,
                latency_ms=430 + (seq * 5),
                status="ok",
                timestamp=flawed_started + timedelta(seconds=0.8 + (seq - 2) * 2.2),
            ))

        # Step 8: think (confused)
        session.add(Event(
            run_id=flawed_run.id,
            sequence_number=8,
            event_type="think",
            model="claude-sonnet-4-6",
            input_hash=canonical_hash({"note": "Still no results, retrying..."}),
            input_preview=truncate_preview({"note": "Still no results, retrying..."}),
            tokens_in=510,
            tokens_out=110,
            latency_ms=420,
            status="ok",
            timestamp=flawed_started + timedelta(seconds=14.5),
        ))

        # Step 9: tool error
        session.add(Event(
            run_id=flawed_run.id,
            sequence_number=9,
            event_type="tool",
            tool_name="search",
            model="claude-sonnet-4-6",
            input_hash=in_h,
            status="error",
            error_code="RATE_LIMITED",
            tokens_in=412,
            tokens_out=0,
            latency_ms=200,
            timestamp=flawed_started + timedelta(seconds=15.8),
        ))

        # Step 10: end
        session.add(Event(
            run_id=flawed_run.id,
            sequence_number=10,
            event_type="end",
            status="ok",
            tokens_in=0,
            tokens_out=0,
            timestamp=flawed_started + timedelta(seconds=17.9),
        ))

        await session.commit()

        # Run analysis so findings are pre-populated in the demo
        try:
            from app.analysis import engine as analysis_engine
            await analysis_engine.analyze(flawed_run.id, session)
            logger.info("Demo seed: analysis complete for flawed run.")
        except Exception as exc:
            logger.warning(f"Demo seed: analysis skipped ({exc})")

    if db is not None:
        await _run_seed(db)
    else:
        async with AsyncSessionLocal() as session:
            await _run_seed(session)


if __name__ == "__main__":
    asyncio.run(seed_demo())
