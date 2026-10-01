from fastapi import APIRouter
from app.api.v1.projects import router as projects_router
from app.api.v1.runs import router as runs_router
from app.api.v1.events import router as events_router

api_v1_router = APIRouter()

api_v1_router.include_router(projects_router)
api_v1_router.include_router(runs_router)
api_v1_router.include_router(events_router)
