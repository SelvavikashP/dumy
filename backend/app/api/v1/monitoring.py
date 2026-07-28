from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.security import require_creator_permission
from app.models.models import (
    AssessmentAttempt, Assessment, ProctoringSession,
    ProctoringEvent, TestAttender
)
from app.schemas.schemas import LiveCandidateStatus

router = APIRouter(prefix="/monitoring", tags=["Live Monitoring"])

@router.get("/live/{assessment_id}", response_model=List[LiveCandidateStatus])
async def get_live_candidates(
    assessment_id: str,
    current_auth: dict = Depends(require_creator_permission("LIVE_MONITORING")),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns real-time telemetry grid of active and recently updated candidates
    for proctoring surveillance.
    """
    asm_res = await db.execute(select(Assessment).where(Assessment.id == assessment_id))
    assessment = asm_res.scalars().first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    att_res = await db.execute(
        select(AssessmentAttempt).where(
            AssessmentAttempt.assessment_id == assessment_id
        ).options(
            selectinload(AssessmentAttempt.attender)
        ).order_by(AssessmentAttempt.updated_at.desc())
    )
    attempts = att_res.scalars().all()

    now = datetime.now(timezone.utc)
    candidates_list = []

    for att in attempts:
        if att.start_time and att.status == "ACTIVE":
            start_tz = att.start_time.replace(tzinfo=timezone.utc) if att.start_time.tzinfo is None else att.start_time
            elapsed = (now - start_tz).total_seconds()
            total_sec = assessment.duration_minutes * 60
            remaining_sec = max(0, int(total_sec - elapsed))
        else:
            remaining_sec = att.time_remaining_seconds

        proc_res = await db.execute(
            select(ProctoringSession).where(ProctoringSession.attempt_id == att.id)
        )
        session = proc_res.scalars().first()

        ev_res = await db.execute(
            select(ProctoringEvent).where(
                ProctoringEvent.attempt_id == att.id
            ).order_by(ProctoringEvent.created_at.desc()).limit(1)
        )
        last_ev = ev_res.scalars().first()

        candidates_list.append(LiveCandidateStatus(
            attempt_id=att.id,
            candidate_name=att.attender.full_name if att.attender else "Candidate",
            candidate_email=att.attender.email if att.attender else "",
            assessment_title=assessment.title,
            status=att.status,
            time_remaining_seconds=remaining_sec,
            current_section="Active Workspace",
            warnings_count=att.warning_count,
            warning_limit=assessment.warning_limit,
            risk_level=session.risk_level if session else "LOW",
            risk_score=session.risk_score if session else 0.0,
            camera_online=session.camera_enabled if session else True,
            last_event={
                "event_type": last_ev.event_type,
                "severity": last_ev.severity,
                "created_at": last_ev.created_at
            } if last_ev else None
        ))

    return candidates_list
