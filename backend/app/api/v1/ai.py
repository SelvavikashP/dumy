from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import require_creator_permission
from app.core.audit import log_audit_event
from app.models.models import AIGeneration
from app.schemas.schemas import (
    AIAssessmentGenerateRequest, AIAssessmentDraftResponse
)
from app.services.ai_service import AIService
from app.services.ai_validator import AIValidatorService

router = APIRouter(prefix="/ai", tags=["AI Assessment Generator"])

@router.post("/generate-assessment", response_model=AIAssessmentDraftResponse)
async def generate_assessment_draft(
    req: AIAssessmentGenerateRequest,
    request: Request,
    current_auth: dict = Depends(require_creator_permission("AI_GENERATION")),
    db: AsyncSession = Depends(get_db)
):
    """
    Generates a complete multi-section assessment draft using AI.
    Questions enter the DRAFT -> REVIEW -> APPROVED -> PUBLISHED lifecycle.
    """
    user = current_auth["user"]
    draft = await AIService.generate_assessment(
        prompt=req.prompt,
        job_role=req.job_role or "Software Engineer",
        experience_level=req.experience_level or "Mid-Level",
        duration_minutes=req.duration_minutes,
        difficulty=req.difficulty,
        skills=req.skills,
        aptitude_count=req.aptitude_count,
        mcq_count=req.mcq_count,
        coding_count=req.coding_count
    )

    # Persist generation record
    gen_log = AIGeneration(
        creator_id=user.id,
        prompt=req.prompt,
        generated_type="FULL_ASSESSMENT",
        raw_response=draft,
        status="COMPLETED"
    )
    db.add(gen_log)

    await log_audit_event(
        db=db,
        action="AI_ASSESSMENT_GENERATED",
        user_id=user.id,
        user_role=current_auth["role"],
        target_type="AssessmentDraft",
        ip_address=request.client.host if request.client else None,
        details={"prompt": req.prompt, "role": req.job_role}
    )
    await db.commit()

    return AIAssessmentDraftResponse(
        title=draft["title"],
        description=draft["description"],
        duration_minutes=draft["duration_minutes"],
        difficulty=draft["difficulty"],
        sections=draft["sections"],
        validation_summary=draft["validation_summary"]
    )

@router.post("/validate-question")
async def validate_question_endpoint(
    question_payload: dict,
    current_auth: dict = Depends(require_creator_permission("AI_GENERATION"))
):
    """Validates structural correctness and runs reference solutions against test cases."""
    return await AIValidatorService.validate_question(question_payload)
