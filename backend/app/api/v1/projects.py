from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.db.session import get_db
from app.db.models import User
from app.core.auth import get_current_dev_user
from app.api.schemas.projects import ProjectCreate, ProjectOut, ProjectWithKey
from app.api.schemas.runs import RunOut
from app.services import project_service, run_service

router = APIRouter(prefix="/projects", tags=["projects"])

@router.post("", response_model=ProjectWithKey, status_code=201)
async def create_project(
    data: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_dev_user)
):
    return await project_service.create_project(db, user, data)

@router.get("", response_model=list[ProjectOut])
async def list_projects(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_dev_user)
):
    return await project_service.list_projects(db, user)

@router.get("/{id}", response_model=ProjectOut)
async def get_project(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_dev_user)
):
    return await project_service.get_project_by_id(db, user, id)

@router.get("/{id}/runs", response_model=list[RunOut])
async def get_project_runs(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_dev_user)
):
    return await project_service.get_project_runs(db, user, id)

