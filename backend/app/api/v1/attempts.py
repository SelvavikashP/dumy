from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.security import get_current_user
from app.core.audit import log_audit_event
from app.models.models import (
    AssessmentAttempt, Assessment, TestAttender, CandidateAnswer,
    ProctoringSession, AssessmentSection, Question, QuestionOption,
    CodingProblem, CodingTestCase, CodingSubmission
)
from app.schemas.schemas import (
    AttemptStartResponse, AutosaveAnswerRequest, AutosaveCodeRequest
)
from app.services.scoring_engine import ScoringEngineService

router = APIRouter(prefix="/attempts", tags=["Assessment Attempts & Lifecycle"])

@router.post("/start/{assessment_id}", response_model=AttemptStartResponse)
async def start_assessment_attempt(
    assessment_id: str,
    request: Request,
    current_auth: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Initializes a server-authoritative assessment attempt.
    Enforces server start timestamp, duration, and proctoring session initialization.
    """
    user_id = current_auth["user_id"]
    res = await db.execute(
        select(Assessment).where(Assessment.id == assessment_id).options(
            selectinload(Assessment.sections).selectinload(AssessmentSection.questions).selectinload(Question.options),
            selectinload(Assessment.sections).selectinload(AssessmentSection.questions).selectinload(Question.coding_problem).selectinload(CodingProblem.test_cases)
        )
    )
    assessment = res.scalars().first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    # Check for active existing attempt
    active_res = await db.execute(
        select(AssessmentAttempt).where(
            AssessmentAttempt.assessment_id == assessment.id,
            AssessmentAttempt.attender_id == user_id,
            AssessmentAttempt.status == "ACTIVE"
        )
    )
    existing_active = active_res.scalars().first()
    if existing_active:
        attempt = existing_active
    else:
        cnt_res = await db.execute(
            select(AssessmentAttempt).where(
                AssessmentAttempt.assessment_id == assessment.id,
                AssessmentAttempt.attender_id == user_id
            )
        )
        past_attempts = cnt_res.scalars().all()
        attempt_number = len(past_attempts) + 1

        if len(past_attempts) >= assessment.max_reattempts and assessment.reattempt_policy == "NONE":
            raise HTTPException(status_code=403, detail="Maximum attempts reached for this assessment")

        now = datetime.now(timezone.utc)
        total_seconds = assessment.duration_minutes * 60
        attempt = AssessmentAttempt(
            assessment_id=assessment.id,
            attender_id=user_id,
            attempt_number=attempt_number,
            status="ACTIVE",
            start_time=now,
            time_remaining_seconds=total_seconds,
            total_score=0.0,
            max_score=0.0
        )
        db.add(attempt)
        await db.flush()

        proc_sess = ProctoringSession(
            attempt_id=attempt.id,
            camera_enabled=assessment.camera_required,
            mic_enabled=assessment.microphone_required,
            fullscreen_enabled=assessment.fullscreen_required,
            risk_score=0.0,
            risk_level="LOW",
            active_warnings=0,
            is_suspended=False
        )
        db.add(proc_sess)

        await log_audit_event(
            db=db,
            action="ATTEMPT_STARTED",
            user_id=user_id,
            user_role=current_auth["role"],
            target_type="AssessmentAttempt",
            target_id=attempt.id,
            ip_address=request.client.host if request.client else None
        )
        await db.commit()

    # Calculate remaining time from server start_time
    now = datetime.now(timezone.utc)
    if attempt.start_time:
        start_tz = attempt.start_time.replace(tzinfo=timezone.utc) if attempt.start_time.tzinfo is None else attempt.start_time
        elapsed = (now - start_tz).total_seconds()
        total_sec = assessment.duration_minutes * 60
        remaining_sec = max(0, int(total_sec - elapsed))
    else:
        remaining_sec = assessment.duration_minutes * 60

    if remaining_sec <= 0 and attempt.status == "ACTIVE":
        attempt.status = "EXPIRED"
        await db.commit()
        raise HTTPException(status_code=400, detail="Assessment time has expired")

    # Build sanitized assessment data for candidate
    sections_data = []
    for sec in assessment.sections:
        questions_data = []
        for q in sec.questions:
            opts = [{"id": o.id, "option_text": o.option_text, "option_order": o.option_order} for o in q.options]
            cp_data = None
            if q.coding_problem:
                cp = q.coding_problem
                cp_data = {
                    "id": cp.id,
                    "title": cp.title,
                    "statement": cp.statement,
                    "input_format": cp.input_format,
                    "output_format": cp.output_format,
                    "constraints": cp.constraints,
                    "examples": cp.examples_json,
                    "default_code": cp.default_code_json,
                    "time_limit_seconds": cp.time_limit_seconds,
                    "memory_limit_mb": cp.memory_limit_mb,
                    "supported_languages": cp.supported_languages_json,
                    "tags": cp.tags_json,
                    "difficulty": cp.difficulty,
                    "sample_test_cases": [
                        {"id": tc.id, "input_data": tc.input_data, "expected_output": tc.expected_output, "points": tc.points}
                        for tc in cp.test_cases if not tc.is_hidden
                    ]
                }

            questions_data.append({
                "id": q.id,
                "type": q.type,
                "topic": q.topic,
                "skill": q.skill,
                "difficulty": q.difficulty,
                "problem_statement": q.problem_statement,
                "points": q.points,
                "negative_points": q.negative_points,
                "options": opts,
                "coding_problem": cp_data
            })

        sections_data.append({
            "id": sec.id,
            "title": sec.title,
            "description": sec.description,
            "duration_minutes": sec.duration_minutes,
            "section_order": sec.section_order,
            "questions": questions_data
        })

    return AttemptStartResponse(
        attempt_id=attempt.id,
        assessment_id=assessment.id,
        status=attempt.status,
        duration_seconds=assessment.duration_minutes * 60,
        time_remaining_seconds=remaining_sec,
        start_time=attempt.start_time,
        proctoring_config={
            "proctoring_level": assessment.proctoring_level,
            "camera_required": assessment.camera_required,
            "microphone_required": assessment.microphone_required,
            "fullscreen_required": assessment.fullscreen_required,
            "tab_detection_enabled": assessment.tab_detection_enabled,
            "warning_limit": assessment.warning_limit,
            "auto_suspension_enabled": assessment.auto_suspension_enabled
        },
        assessment_data={
            "id": assessment.id,
            "title": assessment.title,
            "instructions": assessment.instructions,
            "negative_marking": assessment.negative_marking,
            "sections": sections_data
        }
    )

@router.get("/{attempt_id}/state")
async def get_attempt_state(
    attempt_id: str,
    current_auth: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(AssessmentAttempt).where(AssessmentAttempt.id == attempt_id))
    attempt = res.scalars().first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")

    asm_res = await db.execute(select(Assessment).where(Assessment.id == attempt.assessment_id))
    assessment = asm_res.scalars().first()

    now = datetime.now(timezone.utc)
    if attempt.start_time and attempt.status == "ACTIVE":
        start_tz = attempt.start_time.replace(tzinfo=timezone.utc) if attempt.start_time.tzinfo is None else attempt.start_time
        elapsed = (now - start_tz).total_seconds()
        total_sec = assessment.duration_minutes * 60
        remaining_sec = max(0, int(total_sec - elapsed))
        if remaining_sec <= 0:
            attempt.status = "EXPIRED"
            await db.commit()
    else:
        remaining_sec = attempt.time_remaining_seconds

    ans_res = await db.execute(select(CandidateAnswer).where(CandidateAnswer.attempt_id == attempt_id))
    answers = ans_res.scalars().all()
    saved_answers = {
        a.question_id: {
            "selected_options": a.selected_options_json,
            "text_answer": a.text_answer,
            "is_marked_for_review": a.is_marked_for_review
        }
        for a in answers
    }

    sub_res = await db.execute(select(CodingSubmission).where(CodingSubmission.attempt_id == attempt_id))
    submissions = sub_res.scalars().all()
    saved_code = {s.coding_problem_id: {"code": s.code, "language": s.language, "status": s.status} for s in submissions}

    return {
        "attempt_id": attempt.id,
        "status": attempt.status,
        "time_remaining_seconds": remaining_sec,
        "warning_count": attempt.warning_count,
        "warning_limit": assessment.warning_limit,
        "suspension_reason": attempt.suspension_reason,
        "saved_answers": saved_answers,
        "saved_code": saved_code
    }

@router.post("/{attempt_id}/autosave-answer")
async def autosave_answer(
    attempt_id: str,
    req: AutosaveAnswerRequest,
    current_auth: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    att_res = await db.execute(select(AssessmentAttempt).where(AssessmentAttempt.id == attempt_id))
    attempt = att_res.scalars().first()
    if not attempt or attempt.status != "ACTIVE":
        raise HTTPException(status_code=400, detail="Cannot save answer: attempt is not active")

    ans_res = await db.execute(
        select(CandidateAnswer).where(
            CandidateAnswer.attempt_id == attempt_id,
            CandidateAnswer.question_id == req.question_id
        )
    )
    answer = ans_res.scalars().first()
    if not answer:
        answer = CandidateAnswer(
            attempt_id=attempt_id,
            question_id=req.question_id,
            selected_options_json=req.selected_options,
            text_answer=req.text_answer,
            is_marked_for_review=req.is_marked_for_review,
            time_spent_seconds=req.time_spent_seconds
        )
        db.add(answer)
    else:
        answer.selected_options_json = req.selected_options
        answer.text_answer = req.text_answer
        answer.is_marked_for_review = req.is_marked_for_review
        answer.time_spent_seconds += req.time_spent_seconds

    await db.commit()
    return {"status": "SAVED"}

@router.post("/{attempt_id}/submit")
async def submit_assessment_attempt(
    attempt_id: str,
    request: Request,
    current_auth: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    att_res = await db.execute(select(AssessmentAttempt).where(AssessmentAttempt.id == attempt_id))
    attempt = att_res.scalars().first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")

    attempt.status = "COMPLETED"
    attempt.end_time = datetime.now(timezone.utc)

    score_res = await ScoringEngineService.evaluate_attempt(db, attempt_id)

    await log_audit_event(
        db=db,
        action="ATTEMPT_COMPLETED",
        user_id=current_auth["user_id"],
        user_role=current_auth["role"],
        target_type="AssessmentAttempt",
        target_id=attempt.id,
        ip_address=request.client.host if request.client else None,
        details=score_res
    )
    await db.commit()

    return {
        "message": "Assessment submitted successfully",
        "results": score_res
    }
