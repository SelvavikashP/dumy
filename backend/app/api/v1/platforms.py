from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import require_test_creator
from app.models.models import ExternalPlatform, ExternalProblemReference
from app.services.platform_adapters.adapters import PlatformAdapterRegistry

router = APIRouter(prefix="/platforms", tags=["External Coding Platforms"])

@router.get("/search")
async def search_external_problems(
    platform: str,
    query: str,
    limit: int = 10,
    current_auth: dict = Depends(require_test_creator),
    db: AsyncSession = Depends(get_db)
):
    """
    Searches problems from configured external coding platforms (Codeforces, LeetCode, etc.)
    using official APIs / compliant reference metadata.
    """
    res = await db.execute(select(ExternalPlatform).where(ExternalPlatform.slug == platform.lower()))
    plat = res.scalars().first()
    if not plat or not plat.is_enabled:
        raise HTTPException(status_code=400, detail=f"Platform '{platform}' is currently disabled by Admin")

    adapter = PlatformAdapterRegistry.get_adapter(
        platform_slug=plat.slug,
        api_endpoint=plat.api_endpoint,
        api_key=plat.api_key
    )
    problems = await adapter.search_problems(query=query, limit=limit)
    return problems

@router.get("/{platform}/problem/{problem_id}")
async def get_external_problem_details(
    platform: str,
    problem_id: str,
    current_auth: dict = Depends(require_test_creator),
    db: AsyncSession = Depends(get_db)
):
    """Fetches permitted metadata & external URL for a specific external problem ID."""
    res = await db.execute(select(ExternalPlatform).where(ExternalPlatform.slug == platform.lower()))
    plat = res.scalars().first()
    if not plat or not plat.is_enabled:
        raise HTTPException(status_code=400, detail=f"Platform '{platform}' is disabled")

    adapter = PlatformAdapterRegistry.get_adapter(
        platform_slug=plat.slug,
        api_endpoint=plat.api_endpoint,
        api_key=plat.api_key
    )
    meta = await adapter.get_problem_metadata(problem_id=problem_id)
    if not meta:
        raise HTTPException(status_code=404, detail="Problem metadata not found")
    return meta
