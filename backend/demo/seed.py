import asyncio
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.models import User, Project, Run, Event
from app.core.security import generate_api_key
from app.services.event_utils import canonical_hash, truncate_preview

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
        res = await session.execute(select(Project).where(Project.user_id == user.id, Project.slug == "research-agent"))
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
                is_demo=True
            )
            session.add(project)
            await session.commit()
            await session.refresh(project)

        # 3. Clean Run
        clean_run = Run(
            project_id=project.id,
            status="completed",
            input="Find three Python web frameworks and compare them.",
            started_at=datetime.now(timezone.utc),
            finished_at=datetime.now(timezone.utc),
            total_steps=7,
            total_tokens_in=1450,
            total_tokens_out=620
        )
        session.add(clean_run)
        await session.commit()
        await session.refresh(clean_run)

        clean_events = [
            {"seq": 1, "type": "tool", "name": "search", "in": {"query": "Python web frameworks"}, "out": {"results": ["Django", "Flask", "FastAPI"]}},
            {"seq": 2, "type": "tool", "name": "read", "in": {"doc": "Django"}, "out": {"text": "Full-featured web framework"}},
            {"seq": 3, "type": "think", "name": None, "in": {"note": "Comparing Django features"}, "out": None},
            {"seq": 4, "type": "tool", "name": "search", "in": {"query": "FastAPI benchmarks"}, "out": {"results": ["High performance", "Async"]}},
            {"seq": 5, "type": "think", "name": None, "in": {"note": "Evaluating performance"}, "out": None},
            {"seq": 6, "type": "tool", "name": "search", "in": {"query": "Flask use cases"}, "out": {"results": ["Lightweight", "Microframework"]}},
            {"seq": 7, "type": "end", "name": None, "in": {"summary": "Django for full stack, FastAPI for APIs, Flask for microservices"}, "out": None},
        ]

        for e in clean_events:
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
                tokens_in=200,
                tokens_out=80,
                latency_ms=450,
                timestamp=datetime.now(timezone.utc)
            ))

        # 4. Flawed Run (search loop)
        flawed_run = Run(
            project_id=project.id,
            status="completed",
            input="Search for latest hotel prices in Paris",
            started_at=datetime.now(timezone.utc),
            finished_at=datetime.now(timezone.utc),
            total_steps=5,
            total_tokens_in=2100,
            total_tokens_out=450
        )
        session.add(flawed_run)
        await session.commit()
        await session.refresh(flawed_run)

        flawed_search_input = {"query": "Paris hotels"}
        flawed_search_output = {"results": 10, "status": "no change"}

        for seq in range(1, 5):
            in_h = canonical_hash(flawed_search_input)
            out_h = canonical_hash(flawed_search_output)
            st_h = canonical_hash({"tool_name": "search", "input_hash": in_h, "output_hash": out_h})
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
                latency_ms=430,
                timestamp=datetime.now(timezone.utc)
            ))

        session.add(Event(
            run_id=flawed_run.id,
            sequence_number=5,
            event_type="end",
            status="ok",
            tokens_in=100,
            tokens_out=20,
            timestamp=datetime.now(timezone.utc)
        ))

        await session.commit()

    if db is not None:
        await _run_seed(db)
    else:
        async with AsyncSessionLocal() as session:
            await _run_seed(session)

if __name__ == "__main__":
    asyncio.run(seed_demo())
