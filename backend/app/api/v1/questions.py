from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.security import require_test_creator
from app.core.audit import log_audit_event
from app.models.models import Question, QuestionOption, CodingProblem, CodingTestCase
from app.schemas.schemas import QuestionCreate, QuestionResponse

router = APIRouter(prefix="/questions", tags=["Question Bank"])

@router.get("", response_model=List[QuestionResponse])
async def list_questions(
    type_filter: Optional[str] = None,
    topic_filter: Optional[str] = None,
    difficulty_filter: Optional[str] = None,
    status_filter: Optional[str] = None,
    limit: int = 100,
    current_auth: dict = Depends(require_test_creator),
    db: AsyncSession = Depends(get_db)
):
    """Lists repository questions with filtering support."""
    query = (
        select(Question)
        .options(
            selectinload(Question.options),
            selectinload(Question.coding_problem).selectinload(CodingProblem.test_cases)
        )
        .order_by(Question.created_at.desc())
        .limit(limit)
    )
    if type_filter:
        query = query.where(Question.type == type_filter.upper())
    if topic_filter:
        query = query.where(Question.topic.ilike(f"%{topic_filter}%"))
    if difficulty_filter:
        query = query.where(Question.difficulty == difficulty_filter.upper())
    if status_filter:
        query = query.where(Question.status == status_filter.upper())

    res = await db.execute(query)
    questions = res.scalars().all()

    output = []
    for q in questions:
        opts = [
            {"id": o.id, "option_text": o.option_text, "is_correct": o.is_correct, "explanation": o.explanation, "option_order": o.option_order}
            for o in q.options
        ]
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

        output.append(QuestionResponse(
            id=q.id,
            type=q.type,
            topic=q.topic,
            skill=q.skill,
            difficulty=q.difficulty,
            problem_statement=q.problem_statement,
            explanation=q.explanation,
            points=q.points,
            negative_points=q.negative_points,
            source=q.source,
            status=q.status,
            options=opts,
            coding_problem=cp_data,
            created_at=q.created_at
        ))
    return output

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_question(
    req: QuestionCreate,
    request: Request,
    current_auth: dict = Depends(require_test_creator),
    db: AsyncSession = Depends(get_db)
):
    """Creates a standalone or assessment-linked question."""
    q = Question(
        assessment_id=req.assessment_id,
        section_id=req.section_id,
        type=req.type,
        topic=req.topic,
        skill=req.skill,
        difficulty=req.difficulty,
        problem_statement=req.problem_statement,
        explanation=req.explanation,
        points=req.points,
        negative_points=req.negative_points,
        author_id=current_auth["user_id"],
        source="MANUAL",
        status="APPROVED"
    )
    db.add(q)
    await db.flush()

    for idx, opt in enumerate(req.options):
        o = QuestionOption(
            question_id=q.id,
            option_text=opt.option_text,
            is_correct=opt.is_correct,
            explanation=opt.explanation,
            option_order=idx
        )
        db.add(o)

    if req.coding_problem:
        cp_data = req.coding_problem
        cp = CodingProblem(
            question_id=q.id,
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

        for tc in cp_data.test_cases:
            t = CodingTestCase(
                coding_problem_id=cp.id,
                input_data=tc.input_data,
                expected_output=tc.expected_output,
                is_hidden=tc.is_hidden,
                points=tc.points,
                explanation=tc.explanation
            )
            db.add(t)

    await db.commit()
    return {"message": "Question created successfully", "question_id": q.id}
