"""
Cryptographic Verified Certificate Generation and Public Verification Service.
Generates unique Certificate IDs, HMAC-SHA256 signature verification digests,
skill breakdowns, and verification metadata.
"""

import hmac
import hashlib
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
from app.core.config import settings

class CertificateService:
    CERTIFICATE_ISSUER = "EvalAI Enterprise Certification Authority"

    @classmethod
    def generate_verification_hash(cls, attempt_id: str, candidate_email: str, score_percentage: float) -> str:
        """Generates a cryptographic HMAC-SHA256 verification digest for the certificate."""
        message = f"{attempt_id}:{candidate_email}:{score_percentage:.2f}".encode("utf-8")
        secret = settings.SECRET_KEY.encode("utf-8")
        return hmac.new(secret, message, hashlib.sha256).hexdigest()[:24].upper()

    @classmethod
    def format_certificate_id(cls, attempt_id: str) -> str:
        """Formats a clean standard certificate serial number."""
        clean_id = attempt_id.replace("-", "").upper()[:8]
        year = datetime.now(timezone.utc).year
        return f"CERT-{year}-{clean_id}"

    @classmethod
    def build_certificate_payload(
        cls,
        attempt_id: str,
        candidate_name: str,
        candidate_email: str,
        assessment_title: str,
        total_score: float,
        max_score: float,
        percentage: float,
        passed: bool,
        warning_count: int,
        skill_breakdown_json: Optional[Dict[str, Any]] = None,
        completed_at: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """Builds a complete verified certificate document payload."""
        cert_id = cls.format_certificate_id(attempt_id)
        verification_hash = cls.generate_verification_hash(attempt_id, candidate_email, percentage)
        
        issue_date_str = (completed_at or datetime.now(timezone.utc)).strftime("%B %d, %Y")
        
        # Calculate proctoring integrity score (100 - warnings * 10, min 50)
        integrity_score = max(50.0, min(100.0, 100.0 - (warning_count * 10.0)))

        # Format skill breakdown
        skills: List[Dict[str, Any]] = []
        if skill_breakdown_json and isinstance(skill_breakdown_json, dict):
            for cat, sc in skill_breakdown_json.items():
                val = float(sc) if isinstance(sc, (int, float)) else 85.0
                skills.append({
                    "category": str(cat).replace("_", " ").title(),
                    "score_percentage": round(val, 1),
                    "status": "Proficient" if val >= 70.0 else "Competent"
                })
        else:
            skills = [
                {"category": "Core Aptitude & Logic", "score_percentage": round(percentage, 1), "status": "Proficient"},
                {"category": "Domain Specialization", "score_percentage": round(percentage, 1), "status": "Proficient"}
            ]

        verification_url = f"/verify/{cert_id}"

        return {
            "certificate_id": cert_id,
            "attempt_id": attempt_id,
            "candidate_name": candidate_name,
            "candidate_email": candidate_email,
            "assessment_title": assessment_title,
            "score_percentage": round(percentage, 1),
            "total_score": round(total_score, 1),
            "max_score": round(max_score, 1),
            "passed": passed,
            "issue_date": issue_date_str,
            "verification_url": verification_url,
            "verification_hash": verification_hash,
            "proctoring_integrity_score": integrity_score,
            "skill_breakdown": skills,
            "issuer": cls.CERTIFICATE_ISSUER
        }
