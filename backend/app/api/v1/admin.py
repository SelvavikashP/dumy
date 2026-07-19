from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db
from app.core.security import require_portal_admin, get_password_hash
from app.core.audit import log_audit_event
from app.models.models import (
    PortalAdmin, TestCreator, TestAttender, CreatorPermission,
    Company, Assessment, AssessmentAttempt, AuditLog,
    PlatformSetting, ExternalPlatform, ProctoringEvent
)
from app.schemas.schemas import (
    CreatorCreateRequest, CreatorUpdateRequest,
    PlatformSettingUpdate, ExternalPlatformUpdate
)
from app.services.platform_adapters.adapters import PlatformAdapterRegistry

router = APIRouter(prefix="/admin", tags=["Portal Admin Operations"])

# ----------------- Analytics & Overview -----------------

@router.get("/overview")
async def get_admin_overview(
    admin: PortalAdmin = Depends(require_portal_admin),
    db: AsyncSession = Depends(get_db)
):
    """Retrieves high-level platform statistics and telemetry."""
    creators_cnt = await db.scalar(select(func.count(TestCreator.id)))
    attenders_cnt = await db.scalar(select(func.count(TestAttender.id)))
    assessments_cnt = await db.scalar(select(func.count(Assessment.id)))
    attempts_cnt = await db.scalar(select(func.count(AssessmentAttempt.id)))
    violations_cnt = await db.scalar(select(func.count(ProctoringEvent.id)))
    active_attempts_cnt = await db.scalar(
        select(func.count(AssessmentAttempt.id)).where(AssessmentAttempt.status == "ACTIVE")
    )

    return {
        "total_test_creators": creators_cnt or 0,
        "total_test_attenders": attenders_cnt or 0,
        "total_assessments": assessments_cnt or 0,
        "total_attempts": attempts_cnt or 0,
        "active_attempts_now": active_attempts_cnt or 0,
        "total_proctoring_incidents": violations_cnt or 0,
        "system_status": "OPERATIONAL"
    }

# ----------------- Test Creator Management -----------------

@router.get("/creators")
async def list_creators(
    admin: PortalAdmin = Depends(require_portal_admin),
    db: AsyncSession = Depends(get_db)
):
    """Lists all Test Creators with company info and permissions."""
    res = await db.execute(select(TestCreator))
    creators = res.scalars().all()
    output = []
    for c in creators:
        perm_res = await db.execute(
            select(CreatorPermission).where(
                CreatorPermission.creator_id == c.id,
                CreatorPermission.is_granted == True
            )
        )
        perms = [p.permission_key for p in perm_res.scalars().all()]
        output.append({
            "id": c.id,
            "full_name": c.full_name,
            "email": c.email,
            "phone": c.phone,
            "is_active": c.is_active,
            "company_name": c.company.name if c.company else "Default",
            "permissions": perms,
            "created_at": c.created_at
        })
    return output

@router.post("/creators", status_code=status.HTTP_201_CREATED)
async def create_creator(
    req: CreatorCreateRequest,
    request: Request,
    admin: PortalAdmin = Depends(require_portal_admin),
    db: AsyncSession = Depends(get_db)
):
    """Creates a new Test Creator account with assigned granular permissions."""
    email_clean = req.email.lower().strip()
    res = await db.execute(select(TestCreator).where(TestCreator.email == email_clean))
    if res.scalars().first():
        raise HTTPException(status_code=400, detail="Test Creator email already exists")

    # Find or create company
    company_id = None
    if req.company_name:
        c_res = await db.execute(select(Company).where(Company.name == req.company_name.strip()))
        comp = c_res.scalars().first()
        if not comp:
            comp = Company(name=req.company_name.strip())
            db.add(comp)
            await db.flush()
        company_id = comp.id

    creator = TestCreator(
        full_name=req.full_name.strip(),
        email=email_clean,
        hashed_password=get_password_hash(req.password),
        phone=req.phone,
        company_id=company_id,
        is_active=True
    )
    db.add(creator)
    await db.flush()

    # Assign permissions
    for p_key in req.permissions:
        perm = CreatorPermission(
            creator_id=creator.id,
            permission_key=p_key,
            is_granted=True
        )
        db.add(perm)

    await log_audit_event(
        db=db,
        action="CREATOR_CREATED",
        user_id=admin.id,
        user_role="PORTAL_ADMIN",
        target_type="TestCreator",
        target_id=creator.id,
        ip_address=request.client.host if request.client else None,
        details={"creator_email": creator.email, "permissions": req.permissions}
    )
    await db.commit()

    return {"message": "Test Creator created successfully", "creator_id": creator.id}

@router.patch("/creators/{creator_id}")
async def update_creator(
    creator_id: str,
    req: CreatorUpdateRequest,
    request: Request,
    admin: PortalAdmin = Depends(require_portal_admin),
    db: AsyncSession = Depends(get_db)
):
    """Updates status, permissions, or details of a Test Creator."""
    res = await db.execute(select(TestCreator).where(TestCreator.id == creator_id))
    creator = res.scalars().first()
    if not creator:
        raise HTTPException(status_code=404, detail="Test Creator not found")

    if req.full_name is not None:
        creator.full_name = req.full_name
    if req.phone is not None:
        creator.phone = req.phone
    if req.is_active is not None:
        creator.is_active = req.is_active

    if req.permissions is not None:
        # Re-assign permissions
        del_res = await db.execute(select(CreatorPermission).where(CreatorPermission.creator_id == creator_id))
        for old_p in del_res.scalars().all():
            await db.delete(old_p)
        for p_key in req.permissions:
            new_p = CreatorPermission(creator_id=creator_id, permission_key=p_key, is_granted=True)
            db.add(new_p)

    await log_audit_event(
        db=db,
        action="CREATOR_UPDATED",
        user_id=admin.id,
        user_role="PORTAL_ADMIN",
        target_type="TestCreator",
        target_id=creator.id,
        ip_address=request.client.host if request.client else None,
        details={"is_active": req.is_active, "permissions": req.permissions}
    )
    await db.commit()
    return {"message": "Creator updated successfully"}

# ----------------- Global Platform Configuration -----------------

@router.get("/settings")
async def get_platform_settings(
    admin: PortalAdmin = Depends(require_portal_admin),
    db: AsyncSession = Depends(get_db)
):
    """Retrieves all global platform settings."""
    res = await db.execute(select(PlatformSetting))
    settings_list = res.scalars().all()
    return {s.setting_key: s.setting_value_json for s in settings_list}

@router.post("/settings")
async def update_platform_setting(
    req: PlatformSettingUpdate,
    request: Request,
    admin: PortalAdmin = Depends(require_portal_admin),
    db: AsyncSession = Depends(get_db)
):
    """Creates or updates a global platform setting."""
    res = await db.execute(select(PlatformSetting).where(PlatformSetting.setting_key == req.setting_key))
    setting = res.scalars().first()
    if not setting:
        setting = PlatformSetting(
            setting_key=req.setting_key,
            setting_value_json=req.setting_value,
            description=req.description,
            updated_by=admin.id
        )
        db.add(setting)
    else:
        setting.setting_value_json = req.setting_value
        if req.description:
            setting.description = req.description
        setting.updated_by = admin.id

    await log_audit_event(
        db=db,
        action="SETTING_UPDATED",
        user_id=admin.id,
        user_role="PORTAL_ADMIN",
        target_type="PlatformSetting",
        target_id=req.setting_key,
        ip_address=request.client.host if request.client else None,
        details={"key": req.setting_key, "value": req.setting_value}
    )
    await db.commit()
    return {"message": f"Setting '{req.setting_key}' updated successfully"}

# ----------------- External Coding Platforms -----------------

@router.get("/platforms")
async def list_external_platforms(
    admin: PortalAdmin = Depends(require_portal_admin),
    db: AsyncSession = Depends(get_db)
):
    """Lists external coding platform adapters (HackerRank, LeetCode, Codeforces, AtCoder, CodeChef)."""
    res = await db.execute(select(ExternalPlatform))
    platforms = res.scalars().all()
    if not platforms:
        # Seed default platform rows
        defaults = [
            ("Codeforces", "codeforces", True, "https://codeforces.com/api"),
            ("LeetCode", "leetcode", True, "https://leetcode.com/api"),
            ("HackerRank", "hackerrank", True, "https://www.hackerrank.com/api"),
            ("AtCoder", "atcoder", True, "https://atcoder.jp"),
            ("CodeChef", "codechef", True, "https://api.codechef.com")
        ]
        for name, slug, enabled, endpoint in defaults:
            p = ExternalPlatform(name=name, slug=slug, is_enabled=enabled, api_endpoint=endpoint, status="HEALTHY")
            db.add(p)
        await db.commit()
        res = await db.execute(select(ExternalPlatform))
        platforms = res.scalars().all()

    return platforms

@router.patch("/platforms/{slug}")
async def update_external_platform(
    slug: str,
    req: ExternalPlatformUpdate,
    admin: PortalAdmin = Depends(require_portal_admin),
    db: AsyncSession = Depends(get_db)
):
    """Enables/disables an external coding integration or updates its API endpoint/credentials."""
    res = await db.execute(select(ExternalPlatform).where(ExternalPlatform.slug == slug))
    plat = res.scalars().first()
    if not plat:
        raise HTTPException(status_code=404, detail="Platform not found")

    plat.is_enabled = req.is_enabled
    if req.api_endpoint is not None:
        plat.api_endpoint = req.api_endpoint
    if req.api_key is not None:
        plat.api_key = req.api_key
    if req.rate_limit_per_min is not None:
        plat.rate_limit_per_min = req.rate_limit_per_min

    await db.commit()
    return {"message": f"Platform '{plat.name}' updated successfully"}

@router.post("/platforms/{slug}/test-connection")
async def test_platform_connection(
    slug: str,
    admin: PortalAdmin = Depends(require_portal_admin),
    db: AsyncSession = Depends(get_db)
):
    """Runs a live connection probe to the external platform adapter."""
    res = await db.execute(select(ExternalPlatform).where(ExternalPlatform.slug == slug))
    plat = res.scalars().first()
    if not plat:
        raise HTTPException(status_code=404, detail="Platform not found")

    adapter = PlatformAdapterRegistry.get_adapter(
        platform_slug=plat.slug,
        api_endpoint=plat.api_endpoint,
        api_key=plat.api_key
    )
    test_res = await adapter.test_connection()
    plat.status = test_res.get("status", "HEALTHY")
    await db.commit()

    return test_res

# ----------------- Audit Logs -----------------

@router.get("/audit-logs")
async def list_audit_logs(
    limit: int = 100,
    action: Optional[str] = None,
    admin: PortalAdmin = Depends(require_portal_admin),
    db: AsyncSession = Depends(get_db)
):
    """Retrieves immutable system audit trail entries."""
    query = select(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit)
    if action:
        query = query.where(AuditLog.action == action)
    res = await db.execute(query)
    return res.scalars().all()
