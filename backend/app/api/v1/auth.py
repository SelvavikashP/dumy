from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.config import settings
from app.core.database import get_db
from app.core.security import (
    verify_password, get_password_hash, create_access_token,
    create_refresh_token, decode_token, get_current_user
)
from app.core.audit import log_audit_event
from app.models.models import (
    PortalAdmin, TestCreator, TestAttender, CreatorPermission,
    Company, EmailVerificationToken
)
from app.schemas.schemas import (
    SetupCheckResponse, InitialAdminSetupRequest, LoginRequest,
    AttenderRegisterRequest, TokenResponse, UserProfileResponse,
    ProfileUpdateRequest, SendOTPRequest, VerifyOTPRequest, OTPResponse
)
from app.services.email_service import EmailService

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
    """Registers a candidate (Student) or assessment creator (Teacher) and sends verification OTP."""
    email_clean = req.email.lower().strip()
    role_requested = (req.role or "TEST_ATTENDER").upper().strip()

    # Check if already registered in Attenders or Creators
    res_att = await db.execute(select(TestAttender).where(TestAttender.email == email_clean))
    res_cre = await db.execute(select(TestCreator).where(TestCreator.email == email_clean))
    if res_att.scalars().first() or res_cre.scalars().first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    if role_requested == "TEST_CREATOR":
        user_record = TestCreator(
            email=email_clean,
            hashed_password=get_password_hash(req.password),
            full_name=req.full_name.strip(),
            phone=req.phone,
            is_verified=False,
            is_active=True
        )
        db.add(user_record)
        await db.flush()

        # Add default creator permissions
        perm = CreatorPermission(
            creator_id=user_record.id,
            can_create_assessments=True,
            can_view_results=True,
            can_manage_question_bank=True
        )
        db.add(perm)
        user_role = "TEST_CREATOR"
        audit_action = "CREATOR_REGISTERED"
    else:
        user_record = TestAttender(
            email=email_clean,
            hashed_password=get_password_hash(req.password),
            full_name=req.full_name.strip(),
            phone=req.phone,
            is_verified=False,
            is_active=True
        )
        db.add(user_record)
        await db.flush()
        user_role = "TEST_ATTENDER"
        audit_action = "CANDIDATE_REGISTERED"

    # Generate 6-digit OTP
    otp_code = EmailService.generate_otp(6)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)
    
    token_record = EmailVerificationToken(
        email=email_clean,
        user_id=user_record.id,
        otp_code=otp_code,
        token_type="REGISTRATION_OTP",
        is_used=False,
        expires_at=expires_at
    )
    db.add(token_record)

    await log_audit_event(
        db=db,
        action=audit_action,
        user_id=user_record.id,
        user_role=user_role,
        target_type="TestCreator" if user_role == "TEST_CREATOR" else "TestAttender",
        target_id=user_record.id,
        ip_address=request.client.host if request.client else None
    )
    await db.commit()

    # Dispatch Verification Email asynchronously via Gmail SMTP / Fallback
    is_smtp_live = False
    try:
        email_res = await EmailService.send_verification_otp(
            email=email_clean,
            full_name=user_record.full_name,
            otp_code=otp_code,
            expire_minutes=settings.OTP_EXPIRE_MINUTES,
            db=db
        )
        is_smtp_live = email_res.get("mode") == "LIVE_SMTP"
    except Exception as e:
        print(f"[!] Warning: Email dispatch exception during register: {e}")

    access_token = create_access_token({"sub": user_record.id, "role": user_role, "email": user_record.email})
    refresh_token = create_refresh_token({"sub": user_record.id, "role": user_role})

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        role=user_role,
        user_id=user_record.id,
        email=user_record.email,
        full_name=user_record.full_name,
        otp_hint=otp_code if not is_smtp_live else None,
        is_smtp_live=is_smtp_live
    )

@router.post("/send-verification-otp", response_model=OTPResponse)
async def send_verification_otp(
    req: SendOTPRequest,
    db: AsyncSession = Depends(get_db)
):
    """Generates and dispatches a fresh 6-digit email verification OTP."""
    email_clean = req.email.lower().strip()
    res = await db.execute(select(TestAttender).where(TestAttender.email == email_clean))
    attender = res.scalars().first()
    if not attender:
        # Check if creator
        c_res = await db.execute(select(TestCreator).where(TestCreator.email == email_clean))
        creator = c_res.scalars().first()
        full_name = creator.full_name if creator else "User"
        user_id = creator.id if creator else None
    else:
        full_name = attender.full_name
        user_id = attender.id

    otp_code = EmailService.generate_otp(6)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)

    token_record = EmailVerificationToken(
        email=email_clean,
        user_id=user_id,
        otp_code=otp_code,
        token_type=req.token_type or "REGISTRATION_OTP",
        is_used=False,
        expires_at=expires_at
    )
    db.add(token_record)
    await db.commit()

    email_res = await EmailService.send_verification_otp(
        email=email_clean,
        full_name=full_name,
        otp_code=otp_code,
        expire_minutes=settings.OTP_EXPIRE_MINUTES,
        db=db
    )

    msg = f"Verification code successfully sent to {email_clean}."
    if email_res.get("mode") == "SIMULATED":
        msg = f"Verification OTP code [{otp_code}] generated for {email_clean}. (Configure Gmail SMTP in Admin Settings for live email delivery)."

    return OTPResponse(
        success=True,
        message=msg,
        email=email_clean,
        is_verified=attender.is_verified if attender else True,
        expires_in_minutes=settings.OTP_EXPIRE_MINUTES
    )

@router.post("/verify-email-otp", response_model=OTPResponse)
async def verify_email_otp(
    req: VerifyOTPRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Validates the 6-digit OTP code and marks the candidate/user as verified."""
    email_clean = req.email.lower().strip()
    otp_clean = req.otp_code.strip()

    # Query without raw SQLite datetime comparison to prevent timezone string mismatch
    res = await db.execute(
        select(EmailVerificationToken)
        .where(
            EmailVerificationToken.email == email_clean,
            EmailVerificationToken.otp_code == otp_clean,
            EmailVerificationToken.is_used == False
        )
        .order_by(EmailVerificationToken.created_at.desc())
    )
    tokens = res.scalars().all()

    if not tokens:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid 6-digit verification code. Please double-check your code."
        )

    token = tokens[0]

    # Verify expiration in Python
    now_utc = datetime.now(timezone.utc)
    exp = token.expires_at
    if exp:
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        if exp < now_utc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Verification code has expired. Please click 'Resend OTP' for a new code."
            )

    # Mark token as used
    token.is_used = True

    # Mark user as verified
    att_res = await db.execute(select(TestAttender).where(TestAttender.email == email_clean))
    attender = att_res.scalars().first()
    if attender:
        attender.is_verified = True
        user_id = attender.id
    else:
        c_res = await db.execute(select(TestCreator).where(TestCreator.email == email_clean))
        creator = c_res.scalars().first()
        if creator:
            creator.is_verified = True
            user_id = creator.id
        else:
            user_id = None

    await log_audit_event(
        db=db,
        action="EMAIL_VERIFIED_OTP",
        user_id=user_id,
        user_role="TEST_ATTENDER" if attender else "USER",
        target_type="TestAttender",
        target_id=user_id,
        ip_address=request.client.host if request.client else None,
        details={"email": email_clean, "verified_at": now_utc.isoformat()}
    )
    await db.commit()

    return OTPResponse(
        success=True,
        message="Email successfully verified!",
        email=email_clean,
        is_verified=True,
        expires_in_minutes=0
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

