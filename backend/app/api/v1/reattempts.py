from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import get_current_user, require_creator_permission
from app.models.models import (
    ReattemptRequest, AssessmentAttempt, Assessment, TestAttender
)

router = APIRouter(prefix="/reattempts", tags=["Reattempts & Difficulty Escalation"])

@router.post("/request", status_code=status.HTTP_201_CREATED)
async def request_reattempt(
    attempt_id: str,
    reason: str,
    current_auth: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Submits a candidate reattempt request with contextual justification."""
    att_res = await db.execute(select(AssessmentAttempt).where(AssessmentAttempt.id == attempt_id))
    attempt = att_res.scalars().first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")

    asm_res = await db.execute(select(Assessment).where(Assessment.id == attempt.assessment_id))
    assessment = asm_res.scalars().first()
    if assessment.reattempt_policy == "NONE":
        raise HTTPException(status_code=400, detail="Reattempts are disabled for this assessment")

    # Check if automatic reattempt is enabled
    is_auto = (assessment.reattempt_policy == "AUTOMATIC")

    req = ReattemptRequest(
        attempt_id=attempt.id,
        attender_id=attempt.attender_id,
        assessment_id=assessment.id,
        reason=reason.strip(),
        status="APPROVED" if is_auto else "PENDING",
        escalated_difficulty=assessment.difficulty_escalation
    )
    db.add(req)
    await db.commit()

    return {
        "message": "Reattempt granted automatically" if is_auto else "Reattempt request submitted for recruiter review",
        "status": req.status
    }

@router.get("/requests/{assessment_id}")
async def list_reattempt_requests(
    assessment_id: str,
    current_auth: dict = Depends(require_creator_permission("REATTEMPT_MANAGEMENT")),
    db: AsyncSession = Depends(get_db)
):
    """Lists candidate reattempt requests for an assessment."""
    res = await db.execute(
        select(ReattemptRequest).where(ReattemptRequest.assessment_id == assessment_id).order_by(ReattemptRequest.created_at.desc())
    )
    requests = res.scalars().all()
    output = []
    for r in requests:
        attender_res = await db.execute(select(TestAttender).where(TestAttender.id == r.attender_id))
        attender = attender_res.scalars().first()
        output.append({
            "id": r.id,
            "attempt_id": r.attempt_id,
            "candidate_name": attender.full_name if attender else "Candidate",
            "candidate_email": attender.email if attender else "",
            "reason": r.reason,
            "status": r.status,
            "escalated_difficulty": r.escalated_difficulty,
            "created_at": r.created_at
        })
    return output

@router.post("/approve/{request_id}")
async def approve_reattempt(
    request_id: str,
    escalate_difficulty: bool = False,
    current_auth: dict = Depends(require_creator_permission("REATTEMPT_MANAGEMENT")),
    db: AsyncSession = Depends(get_db)
):
    """Approves a candidate reattempt, creating a new distinct attempt record without overwriting past history."""
    r_res = await db.execute(select(ReattemptRequest).where(ReattemptRequest.id == request_id))
    req = r_res.scalars().first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    req.status = "APPROVED"
    req.escalated_difficulty = escalate_difficulty
    req.approved_by_creator_id = current_auth["user_id"]

    await db.commit()
    return {"message": "Reattempt approved successfully. Candidate can now start a new attempt."}
