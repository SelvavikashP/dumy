from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import (
    verify_password, get_password_hash, create_access_token,
    create_refresh_token, decode_token, get_current_user
)
from app.core.audit import log_audit_event
from app.models.models import PortalAdmin, TestCreator, TestAttender, CreatorPermission, Company
from app.schemas.schemas import (
    SetupCheckResponse, InitialAdminSetupRequest, LoginRequest,
    AttenderRegisterRequest, TokenResponse, UserProfileResponse,
    ProfileUpdateRequest
)

router = APIRouter(prefix="/auth", tags=["Authentication & Setup"])

@router.get("/setup-check", response_model=SetupCheckResponse)
async def check_setup_status(db: AsyncSession = Depends(get_db)):
    """Checks if the single Portal Admin has been initialized."""
    res = await db.execute(select(PortalAdmin))
    admin = res.scalars().first()
    return SetupCheckResponse(
        is_setup_completed=admin is not None,
        platform_name="AI Recruitment Assessment + Proctored Testing Platform"
    )

@router.post("/setup", response_model=TokenResponse)
async def setup_initial_admin(
    req: InitialAdminSetupRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    One-time setup wizard for the singular Portal Admin account.
    Once created, further admin registration is permanently locked.
    """
    res = await db.execute(select(PortalAdmin))
    existing_admin = res.scalars().first()
    if existing_admin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Portal Admin account has already been initialized. Public admin setup is locked."
        )

    # Create the singular Portal Admin
    admin = PortalAdmin(
        email=req.email.lower().strip(),
        hashed_password=get_password_hash(req.password),
        full_name=req.full_name.strip(),
        is_active=True
    )
    db.add(admin)
    await db.flush()

    # Create default demo company
    company = Company(name="Default TechCorp Enterprise", domain="techcorp.com")
    db.add(company)
    await db.flush()

    await log_audit_event(
        db=db,
        action="PORTAL_ADMIN_INITIALIZED",
        user_id=admin.id,
        user_role="PORTAL_ADMIN",
        target_type="PortalAdmin",
        target_id=admin.id,
        ip_address=request.client.host if request.client else None,
        details={"email": admin.email, "name": admin.full_name}
    )
    await db.commit()

    access_token = create_access_token({"sub": admin.id, "role": "PORTAL_ADMIN", "email": admin.email})
    refresh_token = create_refresh_token({"sub": admin.id, "role": "PORTAL_ADMIN"})

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        role="PORTAL_ADMIN",
        user_id=admin.id,
        email=admin.email,
        full_name=admin.full_name
    )

@router.post("/register", response_model=TokenResponse)
async def register_attender(
    req: AttenderRegisterRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Registers a candidate (Test Attender)."""
    email_clean = req.email.lower().strip()
    res = await db.execute(select(TestAttender).where(TestAttender.email == email_clean))
    if res.scalars().first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    attender = TestAttender(
        email=email_clean,
        hashed_password=get_password_hash(req.password),
        full_name=req.full_name.strip(),
        phone=req.phone,
        is_verified=True,
        is_active=True
    )
    db.add(attender)
    await db.flush()

    await log_audit_event(
        db=db,
        action="CANDIDATE_REGISTERED",
        user_id=attender.id,
        user_role="TEST_ATTENDER",
        target_type="TestAttender",
        target_id=attender.id,
        ip_address=request.client.host if request.client else None
    )
    await db.commit()

    access_token = create_access_token({"sub": attender.id, "role": "TEST_ATTENDER", "email": attender.email})
    refresh_token = create_refresh_token({"sub": attender.id, "role": "TEST_ATTENDER"})

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        role="TEST_ATTENDER",
        user_id=attender.id,
        email=attender.email,
        full_name=attender.full_name
    )

@router.post("/login", response_model=TokenResponse)
async def login(
    req: LoginRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Universal login for Portal Admin, Test Creator, and Test Attender.
    """
    email_clean = req.email.lower().strip()
    user = None
    role = None

    # Check Portal Admin
    admin_res = await db.execute(select(PortalAdmin).where(PortalAdmin.email == email_clean))
    admin = admin_res.scalars().first()
    if admin and verify_password(req.password, admin.hashed_password):
        user = admin
        role = "PORTAL_ADMIN"

    # Check Test Creator if not admin
    if not user:
        creator_res = await db.execute(select(TestCreator).where(TestCreator.email == email_clean))
        creator = creator_res.scalars().first()
        if creator and verify_password(req.password, creator.hashed_password):
            user = creator
            role = "TEST_CREATOR"

    # Check Test Attender if not creator
    if not user:
        attender_res = await db.execute(select(TestAttender).where(TestAttender.email == email_clean))
        attender = attender_res.scalars().first()
        if attender and verify_password(req.password, attender.hashed_password):
            user = attender
            role = "TEST_ATTENDER"

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if hasattr(user, "is_active") and not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is disabled")

    await log_audit_event(
        db=db,
        action="USER_LOGIN",
        user_id=user.id,
        user_role=role,
        target_type=role,
        target_id=user.id,
        ip_address=request.client.host if request.client else None
    )
    await db.commit()

    access_token = create_access_token({"sub": user.id, "role": role, "email": user.email})
    refresh_token = create_refresh_token({"sub": user.id, "role": role})

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        role=role,
        user_id=user.id,
        email=user.email,
        full_name=user.full_name
    )

@router.get("/me", response_model=UserProfileResponse)
async def get_profile(
    current_auth: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    user = current_auth["user"]
    role = current_auth["role"]
    permissions = []
    company_name = None

    if role == "TEST_CREATOR":
        perm_res = await db.execute(
            select(CreatorPermission).where(
                CreatorPermission.creator_id == user.id,
                CreatorPermission.is_granted == True
            )
        )
        permissions = [p.permission_key for p in perm_res.scalars().all()]
        if user.company_id:
            c_res = await db.execute(select(Company).where(Company.id == user.company_id))
            comp = c_res.scalars().first()
            if comp:
                company_name = comp.name
    elif role == "PORTAL_ADMIN":
        permissions = [
            "ALL", "CREATE_ASSESSMENT", "EDIT_ASSESSMENT", "DELETE_ASSESSMENT",
            "AI_GENERATION", "CODING_PROBLEMS", "PROCTORING_CONFIGURATION",
            "VIEW_RESULTS", "EXPORT_RESULTS", "MANAGE_CANDIDATES",
            "LIVE_MONITORING", "REATTEMPT_MANAGEMENT", "GLOBAL_CONFIG"
        ]

    return UserProfileResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=role,
        phone=getattr(user, "phone", None),
        company_name=company_name,
        permissions=permissions,
        created_at=user.created_at
    )

@router.put("/profile")
async def update_profile(
    req: ProfileUpdateRequest,
    request: Request,
    current_auth: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Updates the authenticated user's personal details and/or password.
    """
    user = current_auth["user"]
    role = current_auth["role"]

    # 1. Update basic info
    if req.full_name and req.full_name.strip():
        user.full_name = req.full_name.strip()

    if req.phone is not None and hasattr(user, "phone"):
        user.phone = req.phone.strip() if req.phone else None

    # 2. Update company name for Test Creator
    if req.company_name and role == "TEST_CREATOR":
        comp_name = req.company_name.strip()
        if user.company_id:
            c_res = await db.execute(select(Company).where(Company.id == user.company_id))
            comp = c_res.scalars().first()
            if comp:
                comp.name = comp_name
        else:
            comp = Company(name=comp_name)
            db.add(comp)
            await db.flush()
            user.company_id = comp.id

    # 3. Password change
    if req.new_password:
        if not req.current_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is required to set a new password."
            )
        if not verify_password(req.current_password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password verification failed."
            )
        if len(req.new_password) < 6:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New password must be at least 6 characters long."
            )
        user.hashed_password = get_password_hash(req.new_password)

    await log_audit_event(
        db=db,
        action="PROFILE_UPDATED",
        user_id=user.id,
        user_role=role,
        target_type=role,
        target_id=user.id,
        ip_address=request.client.host if request.client else None,
        details={"updated_name": user.full_name, "password_changed": bool(req.new_password)}
    )
    await db.commit()

    # Issue updated access token
    new_token = create_access_token({"sub": user.id, "role": role, "email": user.email})

    return {
        "message": "Profile updated successfully!",
        "access_token": new_token,
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": role,
            "phone": getattr(user, "phone", None)
        }
    }

