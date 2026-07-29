from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.security import get_current_user, require_creator_permission
from app.models.models import (
    AssessmentAttempt, Assessment, CandidateResult,
    TestAttender, CandidateAnswer, CodingSubmission
)
from app.schemas.schemas import CandidateResultOut

router = APIRouter(prefix="/results", tags=["Assessment Results & Reports"])

@router.get("/assessment/{assessment_id}", response_model=List[CandidateResultOut])
async def get_assessment_results(
    assessment_id: str,
    current_auth: dict = Depends(require_creator_permission("VIEW_RESULTS")),
    db: AsyncSession = Depends(get_db)
):
    att_res = await db.execute(
        select(AssessmentAttempt).where(AssessmentAttempt.assessment_id == assessment_id).options(
            selectinload(AssessmentAttempt.attender),
            selectinload(AssessmentAttempt.assessment)
        )
    )
    attempts = att_res.scalars().all()
    output = []

    for att in attempts:
        res_q = await db.execute(select(CandidateResult).where(CandidateResult.attempt_id == att.id))
        result = res_q.scalars().first()

        output.append(CandidateResultOut(
            attempt_id=att.id,
            candidate_name=att.attender.full_name if att.attender else "Candidate",
            candidate_email=att.attender.email if att.attender else "",
            assessment_title=att.assessment.title if att.assessment else "",
            total_score=att.total_score,
            max_score=att.max_score,
            percentage=att.percentage,
            passed=att.passed,
            aptitude_score=result.aptitude_score if result else 0.0,
            mcq_score=result.mcq_score if result else 0.0,
            coding_score=result.coding_score if result else 0.0,
            accuracy_percentage=result.accuracy_percentage if result else 0.0,
            recruiter_verdict=result.recruiter_verdict if result else "PENDING",
            warnings_count=att.warning_count,
            is_suspended=att.status == "SUSPENDED",
            suspension_reason=att.suspension_reason,
            skill_breakdown=result.skill_breakdown_json if result else {},
            completed_at=att.end_time
        ))

    return output

@router.get("/candidate/{attempt_id}")
async def get_candidate_detailed_result(
    attempt_id: str,
    current_auth: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    att_res = await db.execute(
        select(AssessmentAttempt).where(AssessmentAttempt.id == attempt_id).options(
            selectinload(AssessmentAttempt.attender),
            selectinload(AssessmentAttempt.assessment)
        )
    )
    att = att_res.scalars().first()
    if not att:
        raise HTTPException(status_code=404, detail="Attempt not found")

    res_q = await db.execute(select(CandidateResult).where(CandidateResult.attempt_id == att.id))
    result = res_q.scalars().first()

    sub_res = await db.execute(select(CodingSubmission).where(CodingSubmission.attempt_id == att.id))
    submissions = [
        {
            "problem_id": s.coding_problem_id,
            "language": s.language,
            "status": s.status,
            "passed_test_cases": s.passed_test_cases,
            "total_test_cases": s.total_test_cases,
            "score_awarded": s.score_awarded,
            "execution_time_ms": s.execution_time_ms,
            "error_message": s.error_message
        }
        for s in sub_res.scalars().all()
    ]

    return {
        "attempt_id": att.id,
        "candidate_name": att.attender.full_name if att.attender else "Candidate",
        "candidate_email": att.attender.email if att.attender else "",
        "assessment_title": att.assessment.title if att.assessment else "",
        "status": att.status,
        "total_score": att.total_score,
        "max_score": att.max_score,
        "percentage": att.percentage,
        "passed": att.passed,
        "aptitude_score": result.aptitude_score if result else 0.0,
        "mcq_score": result.mcq_score if result else 0.0,
        "coding_score": result.coding_score if result else 0.0,
        "accuracy_percentage": result.accuracy_percentage if result else 0.0,
        "recruiter_verdict": result.recruiter_verdict if result else "PENDING",
        "warnings_count": att.warning_count,
        "is_suspended": att.status == "SUSPENDED",
        "suspension_reason": att.suspension_reason,
        "skill_breakdown": result.skill_breakdown_json if result else {},
        "coding_submissions": submissions,
        "completed_at": att.end_time
    }

@router.patch("/verdict/{attempt_id}")
async def update_candidate_verdict(
    attempt_id: str,
    verdict: str,
    notes: Optional[str] = None,
    current_auth: dict = Depends(require_creator_permission("MANAGE_CANDIDATES")),
    db: AsyncSession = Depends(get_db)
):
    res_q = await db.execute(select(CandidateResult).where(CandidateResult.attempt_id == attempt_id))
    result = res_q.scalars().first()
    if not result:
        raise HTTPException(status_code=404, detail="Candidate result not found")

    result.recruiter_verdict = verdict.upper()
    if notes:
        result.recruiter_notes = notes

    await db.commit()
    return {"message": f"Verdict updated to {verdict.upper()}"}
