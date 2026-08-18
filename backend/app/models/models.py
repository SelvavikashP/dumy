import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from app.core.database import Base

def gen_uuid():
    return str(uuid.uuid4())

def now_utc():
    return datetime.now(timezone.utc)

# ----------------- Core Role Models -----------------

class PortalAdmin(Base):
    __tablename__ = "portal_admin"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=now_utc, nullable=False)
    updated_at = Column(DateTime, default=now_utc, onupdate=now_utc, nullable=False)

class Company(Base):
    __tablename__ = "companies"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    name = Column(String(255), nullable=False)
    domain = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=now_utc, nullable=False)

    creators = relationship("TestCreator", back_populates="company", cascade="all, delete-orphan")
    assessments = relationship("Assessment", back_populates="company", cascade="all, delete-orphan")

class TestCreator(Base):
    __test__ = False
    __tablename__ = "test_creators"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="SET NULL"), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=now_utc, nullable=False)
    updated_at = Column(DateTime, default=now_utc, onupdate=now_utc, nullable=False)

    company = relationship("Company", back_populates="creators")
    permissions = relationship("CreatorPermission", back_populates="creator", cascade="all, delete-orphan")
    assessments = relationship("Assessment", back_populates="creator", cascade="all, delete-orphan")

class CreatorPermission(Base):
    __tablename__ = "creator_permissions"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    creator_id = Column(String(36), ForeignKey("test_creators.id", ondelete="CASCADE"), nullable=False)
    permission_key = Column(String(100), nullable=False)
    is_granted = Column(Boolean, default=True, nullable=False)
    updated_at = Column(DateTime, default=now_utc, onupdate=now_utc, nullable=False)

    creator = relationship("TestCreator", back_populates="permissions")

class TestAttender(Base):
    __test__ = False
    __tablename__ = "test_attenders"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    resume_url = Column(String(500), nullable=True)
    is_verified = Column(Boolean, default=True, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=now_utc, nullable=False)
    updated_at = Column(DateTime, default=now_utc, onupdate=now_utc, nullable=False)

    attempts = relationship("AssessmentAttempt", back_populates="attender", cascade="all, delete-orphan")
    invitations = relationship("AssessmentInvitation", back_populates="attender", cascade="all, delete-orphan")

# ----------------- Assessment & Question Bank -----------------

class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=True)
    creator_id = Column(String(36), ForeignKey("test_creators.id", ondelete="CASCADE"), nullable=False)
    duration_minutes = Column(Integer, default=60, nullable=False)
    passing_percentage = Column(Float, default=60.0, nullable=False)
    difficulty = Column(String(50), default="MEDIUM", nullable=False)
    status = Column(String(50), default="DRAFT", nullable=False) # DRAFT, PUBLISHED, ARCHIVED
    instructions = Column(Text, nullable=True)
    randomize_questions = Column(Boolean, default=False, nullable=False)
    negative_marking = Column(Boolean, default=False, nullable=False)
    negative_marking_value = Column(Float, default=0.25, nullable=False)

    # Proctoring Configuration
    proctoring_level = Column(String(50), default="STANDARD", nullable=False) # OFF, BASIC, STANDARD, STRICT
    camera_required = Column(Boolean, default=True, nullable=False)
    microphone_required = Column(Boolean, default=False, nullable=False)
    fullscreen_required = Column(Boolean, default=True, nullable=False)
    tab_detection_enabled = Column(Boolean, default=True, nullable=False)
    warning_limit = Column(Integer, default=3, nullable=False)
    auto_suspension_enabled = Column(Boolean, default=True, nullable=False)

    # Reattempt rules
    reattempt_policy = Column(String(50), default="MANUAL", nullable=False) # NONE, MANUAL, AUTOMATIC
    max_reattempts = Column(Integer, default=1, nullable=False)
    difficulty_escalation = Column(Boolean, default=False, nullable=False)

    created_at = Column(DateTime, default=now_utc, nullable=False)
    updated_at = Column(DateTime, default=now_utc, onupdate=now_utc, nullable=False)

    creator = relationship("TestCreator", back_populates="assessments")
    company = relationship("Company", back_populates="assessments")
    sections = relationship("AssessmentSection", back_populates="assessment", cascade="all, delete-orphan", order_by="AssessmentSection.section_order")
    questions = relationship("Question", back_populates="assessment", cascade="all, delete-orphan")
    attempts = relationship("AssessmentAttempt", back_populates="assessment", cascade="all, delete-orphan")
    invitations = relationship("AssessmentInvitation", back_populates="assessment", cascade="all, delete-orphan")

class AssessmentSection(Base):
    __tablename__ = "assessment_sections"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    assessment_id = Column(String(36), ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    duration_minutes = Column(Integer, default=20, nullable=False)
    section_order = Column(Integer, default=1, nullable=False)
    created_at = Column(DateTime, default=now_utc, nullable=False)

    assessment = relationship("Assessment", back_populates="sections")
    questions = relationship("Question", back_populates="section", cascade="all, delete-orphan")

class Question(Base):
    __tablename__ = "questions"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    assessment_id = Column(String(36), ForeignKey("assessments.id", ondelete="CASCADE"), nullable=True)
    section_id = Column(String(36), ForeignKey("assessment_sections.id", ondelete="SET NULL"), nullable=True)
    type = Column(String(50), nullable=False) # APTITUDE, MCQ_SINGLE, MCQ_MULTIPLE, CODING, PROGRAMMING_CHALLENGE
    topic = Column(String(100), nullable=True)
    skill = Column(String(100), nullable=True)
    difficulty = Column(String(50), default="MEDIUM", nullable=False) # EASY, MEDIUM, HARD
    problem_statement = Column(Text, nullable=False)
    explanation = Column(Text, nullable=True)
    points = Column(Float, default=1.0, nullable=False)
    negative_points = Column(Float, default=0.0, nullable=False)
    author_id = Column(String(36), nullable=True)
    source = Column(String(50), default="MANUAL", nullable=False) # MANUAL, AI, EXTERNAL
    status = Column(String(50), default="APPROVED", nullable=False) # DRAFT, REVIEW, APPROVED, PUBLISHED
    usage_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=now_utc, nullable=False)

    assessment = relationship("Assessment", back_populates="questions")
    section = relationship("AssessmentSection", back_populates="questions")
    options = relationship("QuestionOption", back_populates="question", cascade="all, delete-orphan", order_by="QuestionOption.option_order")
    coding_problem = relationship("CodingProblem", back_populates="question", uselist=False, cascade="all, delete-orphan")

class QuestionOption(Base):
    __tablename__ = "question_options"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    question_id = Column(String(36), ForeignKey("questions.id", ondelete="CASCADE"), nullable=False)
    option_text = Column(Text, nullable=False)
    is_correct = Column(Boolean, default=False, nullable=False)
    explanation = Column(Text, nullable=True)
    option_order = Column(Integer, default=0, nullable=False)

    question = relationship("Question", back_populates="options")

class CodingProblem(Base):
    __tablename__ = "coding_problems"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    question_id = Column(String(36), ForeignKey("questions.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    statement = Column(Text, nullable=False)
    input_format = Column(Text, nullable=True)
    output_format = Column(Text, nullable=True)
    constraints = Column(Text, nullable=True)
    examples_json = Column(JSON, default=list, nullable=False) # [{"input": "...", "output": "...", "explanation": "..."}]
    default_code_json = Column(JSON, default=dict, nullable=False) # {"python": "def solution()...", "javascript": "..."}
    reference_solution = Column(Text, nullable=True)
    time_limit_seconds = Column(Float, default=2.0, nullable=False)
    memory_limit_mb = Column(Integer, default=256, nullable=False)
    supported_languages_json = Column(JSON, default=list, nullable=False)
    tags_json = Column(JSON, default=list, nullable=False)
    difficulty = Column(String(50), default="MEDIUM", nullable=False)

    question = relationship("Question", back_populates="coding_problem")
    test_cases = relationship("CodingTestCase", back_populates="coding_problem", cascade="all, delete-orphan")

class CodingTestCase(Base):
    __tablename__ = "coding_test_cases"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    coding_problem_id = Column(String(36), ForeignKey("coding_problems.id", ondelete="CASCADE"), nullable=False)
    input_data = Column(Text, nullable=False)
    expected_output = Column(Text, nullable=False)
    is_hidden = Column(Boolean, default=False, nullable=False)
    points = Column(Float, default=1.0, nullable=False)
    explanation = Column(Text, nullable=True)

    coding_problem = relationship("CodingProblem", back_populates="test_cases")

# ----------------- Invitations, Attempts & Submissions -----------------

class AssessmentInvitation(Base):
    __tablename__ = "assessment_invitations"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    assessment_id = Column(String(36), ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False)
    attender_id = Column(String(36), ForeignKey("test_attenders.id", ondelete="CASCADE"), nullable=True)
    email = Column(String(255), nullable=False)
    invitation_token = Column(String(255), unique=True, index=True, nullable=False)
    status = Column(String(50), default="INVITED", nullable=False) # INVITED, ACCEPTED, EXPIRED
    expires_at = Column(DateTime, nullable=True)
    last_reminder_sent_at = Column(DateTime, nullable=True)
    reminder_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=now_utc, nullable=False)

    assessment = relationship("Assessment", back_populates="invitations")
    attender = relationship("TestAttender", back_populates="invitations")

class AssessmentAttempt(Base):
    __tablename__ = "assessment_attempts"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    assessment_id = Column(String(36), ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False)
    attender_id = Column(String(36), ForeignKey("test_attenders.id", ondelete="CASCADE"), nullable=False)
    invitation_id = Column(String(36), nullable=True)
    attempt_number = Column(Integer, default=1, nullable=False)
    status = Column(String(50), default="NOT_STARTED", nullable=False) # NOT_STARTED, SYSTEM_CHECK, ACTIVE, PAUSED, COMPLETED, SUSPENDED, EXPIRED
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    time_remaining_seconds = Column(Integer, default=3600, nullable=False)
    total_score = Column(Float, default=0.0, nullable=False)
    max_score = Column(Float, default=0.0, nullable=False)
    percentage = Column(Float, default=0.0, nullable=False)
    passed = Column(Boolean, default=False, nullable=False)
    warning_count = Column(Integer, default=0, nullable=False)
    suspension_reason = Column(Text, nullable=True)
    client_system_info_json = Column(JSON, default=dict, nullable=False)
    created_at = Column(DateTime, default=now_utc, nullable=False)
    updated_at = Column(DateTime, default=now_utc, onupdate=now_utc, nullable=False)

    assessment = relationship("Assessment", back_populates="attempts")
    attender = relationship("TestAttender", back_populates="attempts")
    answers = relationship("CandidateAnswer", back_populates="attempt", cascade="all, delete-orphan")
    submissions = relationship("CodingSubmission", back_populates="attempt", cascade="all, delete-orphan")
    proctoring_session = relationship("ProctoringSession", back_populates="attempt", uselist=False, cascade="all, delete-orphan")
    result = relationship("CandidateResult", back_populates="attempt", uselist=False, cascade="all, delete-orphan")

class CandidateAnswer(Base):
    __tablename__ = "candidate_answers"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    attempt_id = Column(String(36), ForeignKey("assessment_attempts.id", ondelete="CASCADE"), nullable=False)
    question_id = Column(String(36), ForeignKey("questions.id", ondelete="CASCADE"), nullable=False)
    selected_options_json = Column(JSON, default=list, nullable=False) # ["opt_id_1", "opt_id_2"]
    text_answer = Column(Text, nullable=True)
    is_marked_for_review = Column(Boolean, default=False, nullable=False)
    is_correct = Column(Boolean, default=False, nullable=False)
    points_awarded = Column(Float, default=0.0, nullable=False)
    time_spent_seconds = Column(Integer, default=0, nullable=False)
    updated_at = Column(DateTime, default=now_utc, onupdate=now_utc, nullable=False)

    attempt = relationship("AssessmentAttempt", back_populates="answers")

class CodingSubmission(Base):
    __tablename__ = "coding_submissions"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    attempt_id = Column(String(36), ForeignKey("assessment_attempts.id", ondelete="CASCADE"), nullable=False)
    coding_problem_id = Column(String(36), ForeignKey("coding_problems.id", ondelete="CASCADE"), nullable=False)
    language = Column(String(50), nullable=False)
    code = Column(Text, nullable=False)
    status = Column(String(50), default="PENDING", nullable=False) # PENDING, RUNNING, ACCEPTED, WRONG_ANSWER, TIME_LIMIT_EXCEEDED, MEMORY_LIMIT_EXCEEDED, COMPILATION_ERROR, RUNTIME_ERROR
    passed_test_cases = Column(Integer, default=0, nullable=False)
    total_test_cases = Column(Integer, default=0, nullable=False)
    execution_time_ms = Column(Float, default=0.0, nullable=False)
    memory_used_mb = Column(Float, default=0.0, nullable=False)
    score_awarded = Column(Float, default=0.0, nullable=False)
    error_message = Column(Text, nullable=True)
    test_results_json = Column(JSON, default=list, nullable=False)
    created_at = Column(DateTime, default=now_utc, nullable=False)

    attempt = relationship("AssessmentAttempt", back_populates="submissions")

# ----------------- Proctoring & Warnings -----------------

class ProctoringSession(Base):
    __tablename__ = "proctoring_sessions"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    attempt_id = Column(String(36), ForeignKey("assessment_attempts.id", ondelete="CASCADE"), unique=True, nullable=False)
    camera_enabled = Column(Boolean, default=True, nullable=False)
    mic_enabled = Column(Boolean, default=False, nullable=False)
    fullscreen_enabled = Column(Boolean, default=True, nullable=False)
    risk_score = Column(Float, default=0.0, nullable=False) # 0.0 to 100.0
    risk_level = Column(String(50), default="LOW", nullable=False) # LOW, MEDIUM, HIGH, CRITICAL
    active_warnings = Column(Integer, default=0, nullable=False)
    is_suspended = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=now_utc, nullable=False)
    updated_at = Column(DateTime, default=now_utc, onupdate=now_utc, nullable=False)

    attempt = relationship("AssessmentAttempt", back_populates="proctoring_session")
    events = relationship("ProctoringEvent", back_populates="session", cascade="all, delete-orphan", order_by="ProctoringEvent.created_at")

class ProctoringEvent(Base):
    __tablename__ = "proctoring_events"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    session_id = Column(String(36), ForeignKey("proctoring_sessions.id", ondelete="CASCADE"), nullable=False)
    attempt_id = Column(String(36), nullable=False)
    event_type = Column(String(100), nullable=False)
    # FACE_NOT_DETECTED, MULTIPLE_FACES, PHONE_DETECTED, PROHIBITED_OBJECT, PERSON_DETECTED,
    # FULLSCREEN_EXIT, TAB_SWITCH, WINDOW_BLUR, COPY, PASTE, CUT, CAMERA_DISABLED, MICROPHONE_DISABLED, SUSPICIOUS_AUDIO
    severity = Column(String(50), default="MEDIUM", nullable=False) # LOW, MEDIUM, HIGH, CRITICAL
    warning_issued = Column(Boolean, default=False, nullable=False)
    confidence = Column(Float, default=0.9, nullable=False)
    metadata_json = Column(JSON, default=dict, nullable=False)
    snapshot_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=now_utc, nullable=False)

    session = relationship("ProctoringSession", back_populates="events")

class WarningLog(Base):
    __tablename__ = "warning_logs"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    attempt_id = Column(String(36), ForeignKey("assessment_attempts.id", ondelete="CASCADE"), nullable=False)
    event_id = Column(String(36), nullable=True)
    warning_number = Column(Integer, nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=now_utc, nullable=False)

class ReattemptRequest(Base):
    __tablename__ = "reattempt_requests"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    attempt_id = Column(String(36), ForeignKey("assessment_attempts.id", ondelete="CASCADE"), nullable=False)
    attender_id = Column(String(36), ForeignKey("test_attenders.id", ondelete="CASCADE"), nullable=False)
    assessment_id = Column(String(36), ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False)
    reason = Column(Text, nullable=False)
    status = Column(String(50), default="PENDING", nullable=False) # PENDING, APPROVED, REJECTED
    escalated_difficulty = Column(Boolean, default=False, nullable=False)
    approved_by_creator_id = Column(String(36), nullable=True)
    created_at = Column(DateTime, default=now_utc, nullable=False)
    updated_at = Column(DateTime, default=now_utc, onupdate=now_utc, nullable=False)

class CandidateResult(Base):
    __tablename__ = "candidate_results"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    attempt_id = Column(String(36), ForeignKey("assessment_attempts.id", ondelete="CASCADE"), unique=True, nullable=False)
    attender_id = Column(String(36), ForeignKey("test_attenders.id", ondelete="CASCADE"), nullable=False)
    assessment_id = Column(String(36), ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False)
    total_score = Column(Float, default=0.0, nullable=False)
    aptitude_score = Column(Float, default=0.0, nullable=False)
    mcq_score = Column(Float, default=0.0, nullable=False)
    coding_score = Column(Float, default=0.0, nullable=False)
    accuracy_percentage = Column(Float, default=0.0, nullable=False)
    passed = Column(Boolean, default=False, nullable=False)
    recruiter_verdict = Column(String(50), default="PENDING", nullable=False) # PENDING, SHORTLISTED, REJECTED, ON_HOLD
    recruiter_notes = Column(Text, nullable=True)
    skill_breakdown_json = Column(JSON, default=dict, nullable=False)
    created_at = Column(DateTime, default=now_utc, nullable=False)

    attempt = relationship("AssessmentAttempt", back_populates="result")

# ----------------- External Coding Platforms -----------------

class ExternalPlatform(Base):
    __tablename__ = "external_platforms"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    name = Column(String(100), nullable=False) # HackerRank, LeetCode, Codeforces, AtCoder, CodeChef
    slug = Column(String(100), unique=True, index=True, nullable=False)
    is_enabled = Column(Boolean, default=True, nullable=False)
    api_endpoint = Column(String(500), nullable=True)
    api_key = Column(String(255), nullable=True)
    rate_limit_per_min = Column(Integer, default=60, nullable=False)
    status = Column(String(50), default="HEALTHY", nullable=False)
    updated_at = Column(DateTime, default=now_utc, onupdate=now_utc, nullable=False)

    references = relationship("ExternalProblemReference", back_populates="platform", cascade="all, delete-orphan")

class ExternalProblemReference(Base):
    __tablename__ = "external_problem_references"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    platform_id = Column(String(36), ForeignKey("external_platforms.id", ondelete="CASCADE"), nullable=False)
    external_problem_id = Column(String(100), nullable=False)
    external_url = Column(String(500), nullable=False)
    title = Column(String(255), nullable=False)
    difficulty = Column(String(50), default="MEDIUM", nullable=False)
    tags_json = Column(JSON, default=list, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=now_utc, nullable=False)

    platform = relationship("ExternalPlatform", back_populates="references")

# ----------------- AI, Audit Logs & Platform Settings -----------------

class AIGeneration(Base):
    __tablename__ = "ai_generations"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    creator_id = Column(String(36), nullable=False)
    prompt = Column(Text, nullable=False)
    generated_type = Column(String(50), nullable=False) # FULL_ASSESSMENT, QUESTION, CODING_PROBLEM
    raw_response = Column(JSON, nullable=False)
    status = Column(String(50), default="COMPLETED", nullable=False)
    created_at = Column(DateTime, default=now_utc, nullable=False)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    action = Column(String(100), nullable=False)
    user_id = Column(String(36), nullable=True)
    user_role = Column(String(50), nullable=True)
    target_type = Column(String(100), nullable=True)
    target_id = Column(String(36), nullable=True)
    ip_address = Column(String(100), nullable=True)
    details = Column(JSON, default=dict, nullable=False)
    status = Column(String(50), default="SUCCESS", nullable=False)
    created_at = Column(DateTime, default=now_utc, nullable=False)

class PlatformSetting(Base):
    __tablename__ = "platform_settings"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    setting_key = Column(String(100), unique=True, index=True, nullable=False)
    setting_value_json = Column(JSON, nullable=False)
    description = Column(Text, nullable=True)
    updated_by = Column(String(36), nullable=True)
    updated_at = Column(DateTime, default=now_utc, onupdate=now_utc, nullable=False)

class EmailVerificationToken(Base):
    __tablename__ = "email_verification_tokens"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    email = Column(String(255), index=True, nullable=False)
    user_id = Column(String(36), nullable=True)
    otp_code = Column(String(10), nullable=False)
    token_type = Column(String(50), default="REGISTRATION_OTP", nullable=False) # REGISTRATION_OTP, VERIFICATION, PASSWORD_RESET
    is_used = Column(Boolean, default=False, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=now_utc, nullable=False)

