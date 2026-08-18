from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.security import require_test_attender
from app.models.models import (
    TestAttender, Assessment, AssessmentInvitation, AssessmentAttempt,
    CandidateResult, AssessmentSection
)
from app.schemas.schemas import SystemCheckSubmit

router = APIRouter(prefix="/attenders", tags=["Candidate Operations"])

@router.get("/assessments")
async def list_assigned_assessments(
    attender: TestAttender = Depends(require_test_attender),
    db: AsyncSession = Depends(get_db)
):
    """Lists assessments assigned or available to the candidate."""
    inv_res = await db.execute(
        select(AssessmentInvitation).where(
            (AssessmentInvitation.email == attender.email) | (AssessmentInvitation.attender_id == attender.id)
        )
    )
    invitations = inv_res.scalars().all()
    assessment_ids = {inv.assessment_id for inv in invitations}

    pub_res = await db.execute(select(Assessment).where(Assessment.status == "PUBLISHED"))
    for p in pub_res.scalars().all():
        assessment_ids.add(p.id)

    assessments_out = []
    if not assessment_ids:
        return []

    asm_query = await db.execute(
        select(Assessment)
        .where(Assessment.id.in_(assessment_ids))
        .options(selectinload(Assessment.sections))
        .order_by(Assessment.created_at.asc())
    )
    for asm in asm_query.scalars().all():

        # Check existing attempts
        att_res = await db.execute(
            select(AssessmentAttempt).where(
                AssessmentAttempt.assessment_id == asm.id,
                AssessmentAttempt.attender_id == attender.id
            ).order_by(AssessmentAttempt.attempt_number.desc())
        )
        latest_attempt = att_res.scalars().first()

        assessments_out.append({
            "id": asm.id,
            "title": asm.title,
            "description": asm.description,
            "duration_minutes": asm.duration_minutes,
            "passing_percentage": asm.passing_percentage,
            "difficulty": asm.difficulty,
            "proctoring_level": asm.proctoring_level,
            "camera_required": asm.camera_required,
            "microphone_required": asm.microphone_required,
            "fullscreen_required": asm.fullscreen_required,
            "sections_count": len(asm.sections) if asm.sections else 0,
            "latest_attempt": {
                "id": latest_attempt.id,
                "status": latest_attempt.status,
                "score": latest_attempt.total_score,
                "percentage": latest_attempt.percentage,
                "passed": latest_attempt.passed
            } if latest_attempt else None
        })

    return assessments_out
