from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, List
import jwt
import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.core.database import get_db

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login"
)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        pw_bytes = plain_password.encode("utf-8")[:72]
        hash_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(pw_bytes, hash_bytes)
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    pw_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pw_bytes, salt).decode("utf-8")

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: Dict[str, Any]) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_token(token: str) -> Dict[str, Any]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials or token expired",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    payload = decode_token(token)
    user_id: str = payload.get("sub")
    role: str = payload.get("role")
    if user_id is None or role is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )

    from app.models.models import PortalAdmin, TestCreator, TestAttender
    user = None
    if role == "PORTAL_ADMIN":
        res = await db.execute(select(PortalAdmin).where(PortalAdmin.id == user_id))
        user = res.scalars().first()
    elif role == "TEST_CREATOR":
        res = await db.execute(select(TestCreator).where(TestCreator.id == user_id))
        user = res.scalars().first()
    elif role == "TEST_ATTENDER":
        res = await db.execute(select(TestAttender).where(TestAttender.id == user_id))
        user = res.scalars().first()

    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User account not found")
    if hasattr(user, "is_active") and not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is disabled")

    return {"user": user, "role": role, "user_id": user_id, "email": user.email}

async def require_portal_admin(current_auth: dict = Depends(get_current_user)):
    if current_auth["role"] != "PORTAL_ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted: Portal Admin privilege required"
        )
    return current_auth["user"]

async def require_test_creator(current_auth: dict = Depends(get_current_user)):
    if current_auth["role"] not in ["TEST_CREATOR", "PORTAL_ADMIN"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted: Test Creator or Admin privilege required"
        )
    return current_auth

async def require_test_attender(current_auth: dict = Depends(get_current_user)):
    if current_auth["role"] != "TEST_ATTENDER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted: Candidate / Test Attender account required"
        )
    return current_auth["user"]

def require_creator_permission(permission_name: str):
    async def permission_checker(current_auth: dict = Depends(require_test_creator), db: AsyncSession = Depends(get_db)):
        if current_auth["role"] == "PORTAL_ADMIN":
            return current_auth
        
        from app.models.models import CreatorPermission
        res = await db.execute(
            select(CreatorPermission).where(
                CreatorPermission.creator_id == current_auth["user_id"],
                CreatorPermission.permission_key == permission_name,
                CreatorPermission.is_granted == True
            )
        )
        perm = res.scalars().first()
        if not perm:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Test Creator lacks required permission: {permission_name}"
            )
        return current_auth
    return permission_checker

