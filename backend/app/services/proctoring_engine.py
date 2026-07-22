from datetime import datetime, timezone
from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.models import (
    AssessmentAttempt, Assessment, ProctoringSession,
    ProctoringEvent, WarningLog
)

class ProctoringEngineService:
    """
    Real-time risk scoring, warning counter, and server-side attempt suspension engine.
    Treats detections as probabilistic risk indicators rather than definitive accusations.
    """

    SEVERITY_WEIGHTS = {
        "LOW": {"risk_inc": 5.0, "issue_warning": False},
        "MEDIUM": {"risk_inc": 15.0, "issue_warning": True},
        "HIGH": {"risk_inc": 30.0, "issue_warning": True},
        "CRITICAL": {"risk_inc": 50.0, "issue_warning": True}
    }

    EVENT_DESCRIPTIONS = {
        "FACE_NOT_DETECTED": "Face was temporarily not detected within the camera frame.",
        "MULTIPLE_FACES": "Multiple persons detected in camera view.",
        "PHONE_DETECTED": "Potential secondary device/phone signal detected.",
        "PROHIBITED_OBJECT": "Potential unauthorized object signal detected.",
        "FULLSCREEN_EXIT": "Candidate exited locked fullscreen mode.",
        "TAB_SWITCH": "Browser tab switched away from assessment room.",
        "WINDOW_BLUR": "Browser window lost focus.",
        "COPY": "Clipboard copy action attempted.",
        "PASTE": "Clipboard paste action attempted.",
        "CUT": "Clipboard cut action attempted.",
        "CAMERA_DISABLED": "Camera video stream was disconnected or disabled.",
        "MICROPHONE_DISABLED": "Microphone audio stream was muted or disabled.",
        "SUSPICIOUS_AUDIO": "Spike in ambient speech/background audio detected."
    }

    @classmethod
    async def process_event(
        cls,
        db: AsyncSession,
        attempt_id: str,
        event_type: str,
        severity: str = "MEDIUM",
        confidence: float = 0.9,
        metadata: Optional[Dict[str, Any]] = None,
        snapshot_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Ingests a proctoring event, calculates updated risk score, issues warnings if threshold reached,
        and applies automatic suspension if allowed.
        """
        # Fetch attempt and assessment
        att_res = await db.execute(select(AssessmentAttempt).where(AssessmentAttempt.id == attempt_id))
        attempt = att_res.scalars().first()
        if not attempt:
            raise ValueError("Attempt not found")

        if attempt.status in ["COMPLETED", "SUSPENDED", "EXPIRED"]:
            return {
                "event_id": "",
                "event_type": event_type,
                "severity": severity,
                "warning_issued": False,
                "active_warnings": attempt.warning_count,
                "warning_limit": 3,
                "is_suspended": attempt.status == "SUSPENDED",
                "message": f"Attempt is already {attempt.status}",
                "risk_level": "CRITICAL" if attempt.status == "SUSPENDED" else "LOW"
            }

        asm_res = await db.execute(select(Assessment).where(Assessment.id == attempt.assessment_id))
        assessment = asm_res.scalars().first()

        # Fetch or create proctoring session
        sess_res = await db.execute(select(ProctoringSession).where(ProctoringSession.attempt_id == attempt_id))
        session = sess_res.scalars().first()
        if not session:
            session = ProctoringSession(
                attempt_id=attempt_id,
                camera_enabled=assessment.camera_required,
                mic_enabled=assessment.microphone_required,
                fullscreen_enabled=assessment.fullscreen_required,
                risk_score=0.0,
                risk_level="LOW",
                active_warnings=0,
                is_suspended=False
            )
            db.add(session)
            await db.flush()

        sev_conf = cls.SEVERITY_WEIGHTS.get(severity.upper(), cls.SEVERITY_WEIGHTS["MEDIUM"])
        issue_warning = sev_conf["issue_warning"]
        risk_inc = sev_conf["risk_inc"] * confidence

        # Update Risk Score
        session.risk_score = min(100.0, session.risk_score + risk_inc)
        if session.risk_score >= 75.0:
            session.risk_level = "CRITICAL"
        elif session.risk_score >= 50.0:
            session.risk_level = "HIGH"
        elif session.risk_score >= 25.0:
            session.risk_level = "MEDIUM"
        else:
            session.risk_level = "LOW"

        # Record event
        event_record = ProctoringEvent(
            session_id=session.id,
            attempt_id=attempt_id,
            event_type=event_type,
            severity=severity.upper(),
            warning_issued=issue_warning,
            confidence=confidence,
            metadata_json=metadata or {},
            snapshot_url=snapshot_url,
            created_at=datetime.now(timezone.utc)
        )
        db.add(event_record)
        await db.flush()

        warning_message = None
        is_suspended = False

        if issue_warning:
            attempt.warning_count += 1
            session.active_warnings = attempt.warning_count
            warning_num = attempt.warning_count
            max_warnings = assessment.warning_limit

            if warning_num < max_warnings:
                warning_message = f"Warning {warning_num} of {max_warnings}: {cls.EVENT_DESCRIPTIONS.get(event_type, 'Security requirement violation detected.')} Please maintain focus within the test environment."
            elif warning_num == max_warnings:
                warning_message = f"Final Warning ({warning_num} of {max_warnings}): Continued violations will automatically suspend your assessment session."
            else:
                warning_message = f"Security threshold exceeded ({warning_num} warnings)."

            # Record Warning Log
            w_log = WarningLog(
                attempt_id=attempt_id,
                event_id=event_record.id,
                warning_number=warning_num,
                message=warning_message,
                created_at=datetime.now(timezone.utc)
            )
            db.add(w_log)

            # Check Auto Suspension
            if assessment.auto_suspension_enabled and attempt.warning_count >= assessment.warning_limit:
                attempt.status = "SUSPENDED"
                attempt.suspension_reason = f"Configured assessment security threshold reached ({attempt.warning_count} warnings logged)."
                session.is_suspended = True
                session.risk_level = "CRITICAL"
                is_suspended = True
                warning_message = "Your assessment attempt has been suspended because the configured security threshold was reached. Your answers and code have been preserved."

        await db.commit()

        return {
            "event_id": event_record.id,
            "event_type": event_type,
            "severity": severity,
            "warning_issued": issue_warning,
            "active_warnings": attempt.warning_count,
            "warning_limit": assessment.warning_limit,
            "is_suspended": is_suspended or (attempt.status == "SUSPENDED"),
            "message": warning_message,
            "risk_level": session.risk_level,
            "risk_score": session.risk_score
        }
