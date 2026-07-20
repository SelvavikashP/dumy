import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.security import require_test_creator, require_creator_permission
from app.core.audit import log_audit_event
from app.models.models import (
    Assessment, AssessmentSection, Question, QuestionOption,
    CodingProblem, CodingTestCase, AssessmentInvitation,
    TestAttender
)
from app.schemas.schemas import AssessmentCreate, AssessmentResponse

router = APIRouter(prefix="/assessments", tags=["Assessments"])

@router.get("", response_model=List[AssessmentResponse])
async def list_assessments(
    status_filter: Optional[str] = None,
    current_auth: dict = Depends(require_test_creator),
    db: AsyncSession = Depends(get_db)
):
    """Lists assessments accessible to the authenticated creator or admin."""
    query = select(Assessment).options(
        selectinload(Assessment.sections).selectinload(AssessmentSection.questions),
        selectinload(Assessment.questions)
    ).order_by(Assessment.created_at.desc())

    if current_auth["role"] == "TEST_CREATOR":
        query = query.where(Assessment.creator_id == current_auth["user_id"])
    if status_filter:
        query = query.where(Assessment.status == status_filter.upper())

    res = await db.execute(query)
    assessments = res.scalars().all()

    output = []
    for a in assessments:
        q_count = len(a.questions) if a.questions else 0
        total_pts = sum(q.points for q in a.questions) if a.questions else 0.0
        sec_list = []
        for s in a.sections:
            sec_list.append({
                "id": s.id,
                "title": s.title,
                "description": s.description,
                "duration_minutes": s.duration_minutes,
                "section_order": s.section_order,
                "questions_count": len(s.questions) if s.questions else 0
            })

        output.append(AssessmentResponse(
            id=a.id,
            title=a.title,
            description=a.description,
            duration_minutes=a.duration_minutes,
            passing_percentage=a.passing_percentage,
            difficulty=a.difficulty,
            status=a.status,
            instructions=a.instructions,
            negative_marking=a.negative_marking,
            negative_marking_value=a.negative_marking_value,
            proctoring_level=a.proctoring_level,
            camera_required=a.camera_required,
            microphone_required=a.microphone_required,
            fullscreen_required=a.fullscreen_required,
            tab_detection_enabled=a.tab_detection_enabled,
            warning_limit=a.warning_limit,
            auto_suspension_enabled=a.auto_suspension_enabled,
            reattempt_policy=a.reattempt_policy,
            max_reattempts=a.max_reattempts,
            difficulty_escalation=a.difficulty_escalation,
            created_at=a.created_at,
            sections=sec_list,
            questions_count=q_count,
            total_points=total_pts
        ))
    return output

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_assessment(
    req: AssessmentCreate,
    request: Request,
    current_auth: dict = Depends(require_creator_permission("CREATE_ASSESSMENT")),
    db: AsyncSession = Depends(get_db)
):
    """Creates a complete new assessment with nested sections and question bank items."""
    user = current_auth["user"]
    assessment = Assessment(
        title=req.title.strip(),
        description=req.description,
        company_id=getattr(user, "company_id", None),
        creator_id=user.id,
        duration_minutes=req.duration_minutes,
        passing_percentage=req.passing_percentage,
        difficulty=req.difficulty,
        status="DRAFT",
        instructions=req.instructions,
        randomize_questions=req.randomize_questions,
        negative_marking=req.negative_marking,
        negative_marking_value=req.negative_marking_value,
        proctoring_level=req.proctoring_level,
        camera_required=req.camera_required,
        microphone_required=req.microphone_required,
        fullscreen_required=req.fullscreen_required,
        tab_detection_enabled=req.tab_detection_enabled,
        warning_limit=req.warning_limit,
        auto_suspension_enabled=req.auto_suspension_enabled,
        reattempt_policy=req.reattempt_policy,
        max_reattempts=req.max_reattempts,
        difficulty_escalation=req.difficulty_escalation
    )
    db.add(assessment)
    await db.flush()

    for sec_idx, sec_data in enumerate(req.sections):
        section = AssessmentSection(
            assessment_id=assessment.id,
            title=sec_data.title,
            description=sec_data.description,
            duration_minutes=sec_data.duration_minutes,
            section_order=sec_idx + 1
        )
        db.add(section)
        await db.flush()

        for q_data in sec_data.questions:
            question = Question(
                assessment_id=assessment.id,
                section_id=section.id,
                type=q_data.type,
                topic=q_data.topic,
                skill=q_data.skill,
                difficulty=q_data.difficulty,
                problem_statement=q_data.problem_statement,
                explanation=q_data.explanation,
                points=q_data.points,
                negative_points=q_data.negative_points,
                author_id=user.id,
                source="MANUAL",
                status="APPROVED"
            )
            db.add(question)
            await db.flush()

            for opt_idx, opt_data in enumerate(q_data.options):
                opt = QuestionOption(
                    question_id=question.id,
                    option_text=opt_data.option_text,
                    is_correct=opt_data.is_correct,
                    explanation=opt_data.explanation,
                    option_order=opt_idx
                )
                db.add(opt)

            if q_data.coding_problem:
                cp_data = q_data.coding_problem
                cp = CodingProblem(
                    question_id=question.id,
                    title=cp_data.title,
                    statement=cp_data.statement,
                    input_format=cp_data.input_format,
                    output_format=cp_data.output_format,
                    constraints=cp_data.constraints,
                    examples_json=cp_data.examples,
                    default_code_json=cp_data.default_code,
                    reference_solution=cp_data.reference_solution,
                    time_limit_seconds=cp_data.time_limit_seconds,
                    memory_limit_mb=cp_data.memory_limit_mb,
                    supported_languages_json=cp_data.supported_languages,
                    tags_json=cp_data.tags,
                    difficulty=cp_data.difficulty
                )
                db.add(cp)
                await db.flush()

                for tc_data in cp_data.test_cases:
                    tc = CodingTestCase(
                        coding_problem_id=cp.id,
                        input_data=tc_data.input_data,
                        expected_output=tc_data.expected_output,
                        is_hidden=tc_data.is_hidden,
                        points=tc_data.points,
                        explanation=tc_data.explanation
                    )
                    db.add(tc)

    await log_audit_event(
        db=db,
        action="ASSESSMENT_CREATED",
        user_id=user.id,
        user_role=current_auth["role"],
        target_type="Assessment",
        target_id=assessment.id,
        ip_address=request.client.host if request.client else None,
        details={"title": assessment.title, "sections_count": len(req.sections)}
    )
    await db.commit()

    return {"message": "Assessment created successfully", "assessment_id": assessment.id}

@router.get("/{assessment_id}")
async def get_assessment_details(
    assessment_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Retrieves full assessment breakdown with sections and questions."""
    res = await db.execute(
        select(Assessment).where(Assessment.id == assessment_id).options(
            selectinload(Assessment.sections).selectinload(AssessmentSection.questions).selectinload(Question.options),
            selectinload(Assessment.sections).selectinload(AssessmentSection.questions).selectinload(Question.coding_problem).selectinload(CodingProblem.test_cases)
        )
    )
    assessment = res.scalars().first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    sections_out = []
    for s in assessment.sections:
        q_list = []
        for q in s.questions:
            opts = [{"id": o.id, "option_text": o.option_text, "is_correct": o.is_correct, "explanation": o.explanation} for o in q.options]
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
                    "test_cases": [
                        {"id": tc.id, "input_data": tc.input_data, "expected_output": tc.expected_output, "is_hidden": tc.is_hidden, "points": tc.points}
                        for tc in cp.test_cases
                    ]
                }

            q_list.append({
                "id": q.id,
                "type": q.type,
                "topic": q.topic,
                "skill": q.skill,
                "difficulty": q.difficulty,
                "problem_statement": q.problem_statement,
                "explanation": q.explanation,
                "points": q.points,
                "negative_points": q.negative_points,
                "options": opts,
                "coding_problem": cp_data
            })

        sections_out.append({
            "id": s.id,
            "title": s.title,
            "description": s.description,
            "duration_minutes": s.duration_minutes,
            "section_order": s.section_order,
            "questions": q_list
        })

    return {
        "id": assessment.id,
        "title": assessment.title,
        "description": assessment.description,
        "duration_minutes": assessment.duration_minutes,
        "passing_percentage": assessment.passing_percentage,
        "difficulty": assessment.difficulty,
        "status": assessment.status,
        "instructions": assessment.instructions,
        "negative_marking": assessment.negative_marking,
        "negative_marking_value": assessment.negative_marking_value,
        "proctoring_level": assessment.proctoring_level,
        "camera_required": assessment.camera_required,
        "microphone_required": assessment.microphone_required,
        "fullscreen_required": assessment.fullscreen_required,
        "tab_detection_enabled": assessment.tab_detection_enabled,
        "warning_limit": assessment.warning_limit,
        "auto_suspension_enabled": assessment.auto_suspension_enabled,
        "reattempt_policy": assessment.reattempt_policy,
        "max_reattempts": assessment.max_reattempts,
        "difficulty_escalation": assessment.difficulty_escalation,
        "created_at": assessment.created_at,
        "sections": sections_out
    }

@router.patch("/{assessment_id}/publish")
async def publish_assessment(
    assessment_id: str,
    request: Request,
    current_auth: dict = Depends(require_creator_permission("EDIT_ASSESSMENT")),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(Assessment).where(Assessment.id == assessment_id))
    assessment = res.scalars().first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    assessment.status = "PUBLISHED"
    await log_audit_event(
        db=db,
        action="ASSESSMENT_PUBLISHED",
        user_id=current_auth["user_id"],
        user_role=current_auth["role"],
        target_type="Assessment",
        target_id=assessment.id,
        ip_address=request.client.host if request.client else None
    )
    await db.commit()
    return {"message": "Assessment published successfully"}

@router.post("/{assessment_id}/invite")
async def invite_candidates(
    assessment_id: str,
    emails: List[str],
    request: Request,
    current_auth: dict = Depends(require_creator_permission("MANAGE_CANDIDATES")),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(Assessment).where(Assessment.id == assessment_id))
    assessment = res.scalars().first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    invited_count = 0
    for em in emails:
        clean_email = em.lower().strip()
        att_res = await db.execute(select(TestAttender).where(TestAttender.email == clean_email))
        attender = att_res.scalars().first()

        inv = AssessmentInvitation(
            assessment_id=assessment.id,
            attender_id=attender.id if attender else None,
            email=clean_email,
            invitation_token=str(uuid.uuid4()),
            status="INVITED"
        )
        db.add(inv)
        invited_count += 1

    await log_audit_event(
        db=db,
        action="CANDIDATES_INVITED",
        user_id=current_auth["user_id"],
        user_role=current_auth["role"],
        target_type="Assessment",
        target_id=assessment.id,
        ip_address=request.client.host if request.client else None,
        details={"emails_count": len(emails)}
    )
    await db.commit()
    return {"message": f"Successfully invited {invited_count} candidate(s)"}
