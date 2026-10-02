from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException

from app.db.models import Project, User, Run
from app.api.schemas.projects import ProjectCreate, ProjectWithKey, ProjectOut
from app.api.schemas.runs import RunOut
from app.core.security import generate_api_key

async def create_project(db: AsyncSession, user: User, data: ProjectCreate) -> ProjectWithKey:
    # Check if slug exists for user
    res = await db.execute(
        select(Project).where(Project.user_id == user.id, Project.slug == data.slug)
    )
    if res.scalar_one_or_none():
        raise HTTPException(
            status_code=400,
            detail={"error": {"code": "SLUG_EXISTS", "message": f"Project with slug '{data.slug}' already exists."}}
        )

    full_key, key_hash, key_prefix = generate_api_key()

    project = Project(
        user_id=user.id,
        name=data.name,
        slug=data.slug,
        language=data.language,
        api_key_hash=key_hash,
        key_prefix=key_prefix,
        is_demo=False
    )
    db.add(project)
    await db.commit()
    await db.refresh(project)

    project_dict = {c.name: getattr(project, c.name) for c in project.__table__.columns}
    project_dict["api_key"] = full_key
    return ProjectWithKey(**project_dict)

async def list_projects(db: AsyncSession, user: User) -> list[ProjectOut]:
    res = await db.execute(select(Project).where(Project.user_id == user.id))
    projects = res.scalars().all()
    return [ProjectOut.model_validate(p) for p in projects]

async def get_project_by_id(db: AsyncSession, user: User, project_id) -> ProjectOut:
    res = await db.execute(
        select(Project).where(Project.id == project_id, Project.user_id == user.id)
    )
    project = res.scalar_one_or_none()
    if not project:
        raise HTTPException(
            status_code=404,
            detail={"error": {"code": "NOT_FOUND", "message": "Project not found"}}
        )
    return ProjectOut.model_validate(project)

async def get_project_runs(db: AsyncSession, user: User, project_id) -> list[RunOut]:
    """Return all runs for a project, newest first. Validates project ownership."""
    project_res = await db.execute(
        select(Project).where(Project.id == project_id, Project.user_id == user.id)
    )
    project = project_res.scalar_one_or_none()
    if not project:
        raise HTTPException(
            status_code=404,
            detail={"error": {"code": "NOT_FOUND", "message": "Project not found"}}
        )

    runs_res = await db.execute(
        select(Run)
        .where(Run.project_id == project_id)
        .order_by(Run.started_at.desc())
    )
    runs = runs_res.scalars().all()
    return [RunOut.model_validate(r) for r in runs]

