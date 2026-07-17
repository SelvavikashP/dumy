import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.models import AuditLog

async def log_audit_event(
    db: AsyncSession,
    action: str,
    user_id: Optional[str] = None,
    user_role: Optional[str] = None,
    target_type: Optional[str] = None,
    target_id: Optional[str] = None,
    ip_address: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
    status: str = "SUCCESS"
):
    """
    Persists an immutable audit log entry in the database.
    """
    try:
        entry = AuditLog(
            id=str(uuid.uuid4()),
            action=action,
            user_id=user_id,
            user_role=user_role,
            target_type=target_type,
            target_id=target_id,
            ip_address=ip_address,
            details=details or {},
            status=status,
            created_at=datetime.now(timezone.utc)
        )
        db.add(entry)
        await db.flush()
    except Exception as e:
        print(f"[Audit Log Warning] Failed to write audit event: {e}")
