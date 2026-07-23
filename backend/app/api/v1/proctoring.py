from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.security import get_current_user, require_test_creator
from app.models.models import (
    AssessmentAttempt, Assessment, ProctoringSession,
    ProctoringEvent, WarningLog
)
from app.schemas.schemas import (
    ProctoringEventCreate, ProctoringEventResponse
)
from app.services.proctoring_engine import ProctoringEngineService

router = APIRouter(prefix="/proctoring", tags=["Proctoring & Violations"])

@router.post("/event", response_model=ProctoringEventResponse)
async def report_proctoring_event(
    req: ProctoringEventCreate,
    current_auth: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Ingests real-time proctoring telemetry from candidate sentinel
    (Face absence, multiple faces, phone signal, fullscreen exit, tab switch, clipboard lock).
    """
    res = await ProctoringEngineService.process_event(
        db=db,
        attempt_id=req.attempt_id,
        event_type=req.event_type,
        severity=req.severity,
        confidence=req.confidence,
        metadata=req.metadata,
        snapshot_url=req.snapshot_url
    )

    return ProctoringEventResponse(
        event_id=res["event_id"],
        event_type=res["event_type"],
        severity=res["severity"],
        warning_issued=res["warning_issued"],
        active_warnings=res["active_warnings"],
        warning_limit=res["warning_limit"],
        is_suspended=res["is_suspended"],
        message=res["message"],
        risk_level=res["risk_level"]
    )

@router.get("/violations/{assessment_id}")
async def list_assessment_violations(
    assessment_id: str,
    current_auth: dict = Depends(require_test_creator),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieves chronological proctoring timeline and incident evidence for recruiters.
    """
    att_res = await db.execute(
        select(AssessmentAttempt).where(
            AssessmentAttempt.assessment_id == assessment_id
        ).options(
            selectinload(AssessmentAttempt.attender)
        )
    )
    attempts = att_res.scalars().all()
    attempt_ids = [a.id for a in attempts]

    if not attempt_ids:
        return []

    events_res = await db.execute(
        select(ProctoringEvent).where(
            ProctoringEvent.attempt_id.in_(attempt_ids)
        ).order_by(ProctoringEvent.created_at.desc())
    )
    events = events_res.scalars().all()

    output = []
    for ev in events:
        att = next((a for a in attempts if a.id == ev.attempt_id), None)
        output.append({
            "id": ev.id,
            "attempt_id": ev.attempt_id,
            "candidate_name": att.attender.full_name if att and att.attender else "Candidate",
            "candidate_email": att.attender.email if att and att.attender else "",
            "event_type": ev.event_type,
            "severity": ev.severity,
            "warning_issued": ev.warning_issued,
            "confidence": ev.confidence,
            "metadata": ev.metadata_json,
            "snapshot_url": ev.snapshot_url,
            "timestamp": ev.created_at
        })
    return output
