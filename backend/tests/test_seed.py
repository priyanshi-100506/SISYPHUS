import pytest
from sqlalchemy import select
from app.db.models import Project, Run
from demo.seed import seed_demo

@pytest.mark.asyncio
async def test_seed_creates_demo_project_and_runs(db_session):
    await seed_demo(db_session)

    res = await db_session.execute(select(Project).where(Project.slug == "research-agent"))
    project = res.scalar_one_or_none()
    assert project is not None
    assert project.is_demo is True

    runs_res = await db_session.execute(select(Run).where(Run.project_id == project.id))
    runs = runs_res.scalars().all()
    assert len(runs) >= 2
