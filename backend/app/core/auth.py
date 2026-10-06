from fastapi import Depends, HTTPException, Security, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_db
from app.db.models import User, Project
from app.core.security import hash_api_key

security = HTTPBearer(auto_error=False)

# TODO Phase 2: Replace with real OAuth session verification
DEV_USER_EMAIL = "dev@sisyphus.local"

async def get_current_dev_user(
    db: AsyncSession = Depends(get_db),
    x_dev_mode: str = Header(None)
) -> User:
    """
    DEV-ONLY auth stub for POST/GET /projects.
    Returns or creates a default dev user.
    Marked with TODO Phase 2: replace with real OAuth / session cookies.
    """
    result = await db.execute(select(User).where(User.email == DEV_USER_EMAIL))
    user = result.scalar_one_or_none()
    if not user:
        user = User(email=DEV_USER_EMAIL)
        db.add(user)
        await db.commit()
        await db.refresh(user)
    return user

async def get_project_by_api_key_or_public(
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: AsyncSession = Depends(get_db)
) -> Project | None:
    """
    Validates Bearer sk_live_... key if present, or allows public reading of runs in dev.
    """
    if not credentials or not credentials.credentials:
        return None

    token = credentials.credentials
    key_hash = hash_api_key(token)

    result = await db.execute(select(Project).where(Project.api_key_hash == key_hash))
    return result.scalar_one_or_none()

async def get_project_by_api_key(
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: AsyncSession = Depends(get_db)
) -> Project:
    """
    Validates Bearer sk_live_... key and returns associated Project.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=401,
            detail={"error": {"code": "UNAUTHORIZED", "message": "Missing API key in Bearer header"}}
        )

    token = credentials.credentials
    key_hash = hash_api_key(token)

    result = await db.execute(select(Project).where(Project.api_key_hash == key_hash))
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(
            status_code=401,
            detail={"error": {"code": "INVALID_API_KEY", "message": "Invalid API key provided"}}
        )

    return project

