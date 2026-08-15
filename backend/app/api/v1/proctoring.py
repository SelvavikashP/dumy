from typing import List, Optional
from datetime import datetime, timezone
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
    ProctoringEventCreate, ProctoringEventResponse,
    SnapshotUploadRequest, SnapshotUploadResponse,
    SnapshotGalleryItem
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

@router.post("/snapshot", response_model=SnapshotUploadResponse)
async def upload_proctoring_snapshot(
    req: SnapshotUploadRequest,
    current_auth: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Receives candidate webcam camera frame snapshot (periodic or violation-triggered),
    processes sentinel risk, attaches base64/URL snapshot, and logs audit trail.
    """
    res = await ProctoringEngineService.process_event(
        db=db,
        attempt_id=req.attempt_id,
        event_type=req.event_type or "PERIODIC_CHECK",
        severity="LOW" if req.event_type == "PERIODIC_CHECK" else "MEDIUM",
        confidence=req.confidence or 1.0,
        metadata=req.metadata or {"source": "webcam_sentinel_snapshot"},
        snapshot_url=req.snapshot_base64
    )

    return SnapshotUploadResponse(
        success=True,
        snapshot_id=res["event_id"] or req.attempt_id,
        event_id=res["event_id"],
        created_at=datetime.now(timezone.utc)
    )

@router.get("/snapshots/{attempt_id}", response_model=List[SnapshotGalleryItem])
async def get_attempt_snapshots(
    attempt_id: str,
    current_auth: dict = Depends(require_test_creator),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieves chronological image evidence feed and proctoring snapshots captured during an attempt.
    """
    att_res = await db.execute(
        select(AssessmentAttempt).where(AssessmentAttempt.id == attempt_id).options(
            selectinload(AssessmentAttempt.attender)
        )
    )
    att = att_res.scalars().first()
    if not att:
        raise HTTPException(status_code=404, detail="Attempt not found")

    events_res = await db.execute(
        select(ProctoringEvent).where(
            ProctoringEvent.attempt_id == attempt_id,
            ProctoringEvent.snapshot_url != None
        ).order_by(ProctoringEvent.created_at.desc())
    )
    events = events_res.scalars().all()

    cand_name = att.attender.full_name if att.attender else "Candidate"
    cand_email = att.attender.email if att.attender else ""

    return [
        SnapshotGalleryItem(
            id=ev.id,
            attempt_id=ev.attempt_id,
            candidate_name=cand_name,
            candidate_email=cand_email,
            event_type=ev.event_type,
            severity=ev.severity,
            snapshot_url=ev.snapshot_url or "",
            timestamp=ev.created_at,
            metadata=ev.metadata_json or {}
        )
        for ev in events
    ]

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

