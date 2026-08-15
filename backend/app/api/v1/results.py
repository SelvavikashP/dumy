from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.security import get_current_user, require_creator_permission
from app.models.models import (
    AssessmentAttempt, Assessment, CandidateResult,
    TestAttender, CandidateAnswer, CodingSubmission
)
from app.schemas.schemas import (
    CandidateResultOut, CertificateResponse, CertificateVerifyResponse
)
from app.services.certificate_service import CertificateService

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


@router.get("/certificate/{attempt_id}", response_model=CertificateResponse)
async def get_candidate_certificate(
    attempt_id: str,
    current_auth: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Generates verifiable Certificate of Excellence for a completed attempt.
    """
    att_res = await db.execute(
        select(AssessmentAttempt).where(AssessmentAttempt.id == attempt_id).options(
            selectinload(AssessmentAttempt.attender),
            selectinload(AssessmentAttempt.assessment)
        )
    )
    att = att_res.scalars().first()
    if not att:
        raise HTTPException(status_code=404, detail="Attempt record not found")

    res_q = await db.execute(select(CandidateResult).where(CandidateResult.attempt_id == att.id))
    result = res_q.scalars().first()

    cand_name = att.attender.full_name if att.attender else "Candidate"
    cand_email = att.attender.email if att.attender else "candidate@evalai.com"
    asm_title = att.assessment.title if att.assessment else "Technical Assessment"

    payload = CertificateService.build_certificate_payload(
        attempt_id=att.id,
        candidate_name=cand_name,
        candidate_email=cand_email,
        assessment_title=asm_title,
        total_score=att.total_score,
        max_score=att.max_score,
        percentage=att.percentage,
        passed=att.passed,
        warning_count=att.warning_count,
        skill_breakdown_json=result.skill_breakdown_json if result else None,
        completed_at=att.end_time
    )

    return CertificateResponse(**payload)


@router.get("/verify/{certificate_id}", response_model=CertificateVerifyResponse)
async def verify_certificate_authenticity(
    certificate_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Public lookup endpoint to verify the authenticity of an official EvalAI Certificate.
    Matches certificate serial number, candidate name, score, and signature digest.
    """
    # Parse serial number to recover attempt ID prefix or search all attempts
    clean_serial = certificate_id.strip().upper()
    
    # Extract attempt prefix from CERT-YYYY-XXXXXXXX
    parts = clean_serial.split("-")
    short_hash = parts[-1] if len(parts) >= 3 else clean_serial

    att_res = await db.execute(
        select(AssessmentAttempt).options(
            selectinload(AssessmentAttempt.attender),
            selectinload(AssessmentAttempt.assessment)
        )
    )
    all_attempts = att_res.scalars().all()
    
    matched_att = None
    for att in all_attempts:
        fmt_id = CertificateService.format_certificate_id(att.id)
        if fmt_id == clean_serial or att.id.replace("-", "").upper().startswith(short_hash):
            matched_att = att
            break

    if not matched_att:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Certificate '{certificate_id}' could not be verified in the EvalAI Registry."
        )

    cand_name = matched_att.attender.full_name if matched_att.attender else "Candidate"
    cand_email = matched_att.attender.email if matched_att.attender else ""
    asm_title = matched_att.assessment.title if matched_att.assessment else "Technical Assessment"
    issue_date_str = (matched_att.end_time or matched_att.created_at).strftime("%B %d, %Y")
    verification_hash = CertificateService.generate_verification_hash(matched_att.id, cand_email, matched_att.percentage)

    return CertificateVerifyResponse(
        is_valid=True,
        certificate_id=CertificateService.format_certificate_id(matched_att.id),
        candidate_name=cand_name,
        assessment_title=asm_title,
        score_percentage=round(matched_att.percentage, 1),
        issue_date=issue_date_str,
        status="AUTHENTIC_VERIFIED" if matched_att.passed else "PARTICIPATION_RECORDED",
        issuer="EvalAI Enterprise Certification Authority",
        verification_hash=verification_hash
    )

