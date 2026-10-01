from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app.db.session import get_db
from app.db.models import Project
from app.core.auth import get_project_by_api_key
from app.api.schemas.runs import RunCreate, RunOut, CompleteRunIn
from app.services import run_service

router = APIRouter(prefix="/runs", tags=["runs"])

@router.post("", response_model=RunOut, status_code=201)
async def create_run(
    data: RunCreate,
    db: AsyncSession = Depends(get_db),
    project: Project = Depends(get_project_by_api_key)
):
    return await run_service.create_run(db, project, data)

@router.get("/{id}", response_model=RunOut)
async def get_run(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    project: Project = Depends(get_project_by_api_key)
):
    return await run_service.get_run_by_id(db, project, id)

@router.post("/{id}/complete", response_model=RunOut)
async def complete_run(
    id: UUID,
    data: CompleteRunIn,
    db: AsyncSession = Depends(get_db),
    project: Project = Depends(get_project_by_api_key)
):
    return await run_service.complete_run(db, project, id, data)
