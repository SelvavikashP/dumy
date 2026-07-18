from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field

# ----------------- Auth & Setup Schemas -----------------

class SetupCheckResponse(BaseModel):
    is_setup_completed: bool
    platform_name: str

class InitialAdminSetupRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    security_confirmation: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    role_hint: Optional[str] = None # PORTAL_ADMIN, TEST_CREATOR, TEST_ATTENDER

class AttenderRegisterRequest(BaseModel):
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    role: str
    user_id: str
    email: str
    full_name: str

class UserProfileResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    phone: Optional[str] = None
    company_name: Optional[str] = None
    permissions: List[str] = []
    created_at: datetime

class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    company_name: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None

# ----------------- Admin Management Schemas -----------------

class CreatorCreateRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None
    company_name: Optional[str] = None
    permissions: List[str] = [
        "CREATE_ASSESSMENT", "EDIT_ASSESSMENT", "DELETE_ASSESSMENT",
        "AI_GENERATION", "CODING_PROBLEMS", "PROCTORING_CONFIGURATION",
        "VIEW_RESULTS", "EXPORT_RESULTS", "MANAGE_CANDIDATES",
        "LIVE_MONITORING", "REATTEMPT_MANAGEMENT"
    ]

class CreatorUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    is_active: Optional[bool] = None
    phone: Optional[str] = None
    permissions: Optional[List[str]] = None

class PlatformSettingUpdate(BaseModel):
    setting_key: str
    setting_value: Any
    description: Optional[str] = None

class ExternalPlatformUpdate(BaseModel):
    is_enabled: bool
    api_endpoint: Optional[str] = None
    api_key: Optional[str] = None
    rate_limit_per_min: Optional[int] = None

# ----------------- Question Bank & Coding Schemas -----------------

class QuestionOptionSchema(BaseModel):
    id: Optional[str] = None
    option_text: str
    is_correct: bool = False
    explanation: Optional[str] = None
    option_order: int = 0

class CodingTestCaseSchema(BaseModel):
    id: Optional[str] = None
    input_data: str
    expected_output: str
    is_hidden: bool = False
    points: float = 1.0
    explanation: Optional[str] = None

class CodingProblemCreate(BaseModel):
    title: str
    statement: str
    input_format: Optional[str] = None
    output_format: Optional[str] = None
    constraints: Optional[str] = None
    examples: List[Dict[str, Any]] = []
    default_code: Dict[str, str] = {}
    reference_solution: Optional[str] = None
    time_limit_seconds: float = 2.0
    memory_limit_mb: int = 256
    supported_languages: List[str] = ["python", "javascript", "cpp", "java"]
    tags: List[str] = []
    difficulty: str = "MEDIUM"
    test_cases: List[CodingTestCaseSchema] = []

class QuestionCreate(BaseModel):
    assessment_id: Optional[str] = None
    section_id: Optional[str] = None
    type: str # APTITUDE, MCQ_SINGLE, MCQ_MULTIPLE, CODING, PROGRAMMING_CHALLENGE
    topic: Optional[str] = None
    skill: Optional[str] = None
    difficulty: str = "MEDIUM"
    problem_statement: str
    explanation: Optional[str] = None
    points: float = 1.0
    negative_points: float = 0.0
    options: List[QuestionOptionSchema] = []
    coding_problem: Optional[CodingProblemCreate] = None

class QuestionResponse(BaseModel):
    id: str
    type: str
    topic: Optional[str]
    skill: Optional[str]
    difficulty: str
    problem_statement: str
    explanation: Optional[str] = None
    points: float
    negative_points: float
    source: str
    status: str
    options: List[QuestionOptionSchema] = []
    coding_problem: Optional[Dict[str, Any]] = None
    created_at: datetime

# ----------------- Assessment & Section Schemas -----------------

class SectionCreate(BaseModel):
    title: str
    description: Optional[str] = None
    duration_minutes: int = 20
    section_order: int = 1
    questions: List[QuestionCreate] = []

class AssessmentCreate(BaseModel):
    title: str
    description: Optional[str] = None
    duration_minutes: int = 60
    passing_percentage: float = 60.0
    difficulty: str = "MEDIUM"
    instructions: Optional[str] = None
    randomize_questions: bool = False
    negative_marking: bool = False
    negative_marking_value: float = 0.25

    # Proctoring
    proctoring_level: str = "STANDARD"
    camera_required: bool = True
    microphone_required: bool = False
    fullscreen_required: bool = True
    tab_detection_enabled: bool = True
    warning_limit: int = 3
    auto_suspension_enabled: bool = True

    # Reattempt
    reattempt_policy: str = "MANUAL"
    max_reattempts: int = 1
    difficulty_escalation: bool = False

    sections: List[SectionCreate] = []

class AssessmentResponse(BaseModel):
    id: str
    title: str
    description: Optional[str]
    duration_minutes: int
    passing_percentage: float
    difficulty: str
    status: str
    instructions: Optional[str]
    negative_marking: bool
    negative_marking_value: float
    proctoring_level: str
    camera_required: bool
    microphone_required: bool
    fullscreen_required: bool
    tab_detection_enabled: bool
    warning_limit: int
    auto_suspension_enabled: bool
    reattempt_policy: str
    max_reattempts: int
    difficulty_escalation: bool
    created_at: datetime
    sections: List[Dict[str, Any]] = []
    questions_count: int = 0
    total_points: float = 0.0

# ----------------- Code Execution & Judge Schemas -----------------

class CodeRunRequest(BaseModel):
    language: str # python, javascript, cpp, java, c, go, rust
    code: str
    custom_input: Optional[str] = ""
    coding_problem_id: Optional[str] = None

class CodeRunResult(BaseModel):
    status: str # SUCCESS, COMPILATION_ERROR, RUNTIME_ERROR, TIME_LIMIT_EXCEEDED, WRONG_ANSWER
    stdout: str
    stderr: Optional[str] = None
    execution_time_ms: float
    memory_used_mb: float
    sample_tests_passed: Optional[int] = 0
    sample_tests_total: Optional[int] = 0
    test_case_results: List[Dict[str, Any]] = []

class CodeSubmitRequest(BaseModel):
    attempt_id: str
    coding_problem_id: str
    language: str
    code: str

class CodeSubmissionResponse(BaseModel):
    submission_id: str
    status: str
    passed_test_cases: int
    total_test_cases: int
    score_awarded: float
    execution_time_ms: float
    memory_used_mb: float
    error_message: Optional[str] = None
    test_results: List[Dict[str, Any]] = []

# ----------------- AI Assessment Generator Schemas -----------------

class AIAssessmentGenerateRequest(BaseModel):
    prompt: str
    job_role: Optional[str] = "Full Stack Software Engineer"
    experience_level: Optional[str] = "Mid-Level"
    duration_minutes: int = 60
    difficulty: str = "MEDIUM"
    skills: List[str] = ["Python", "Algorithms", "Aptitude", "SQL"]
    aptitude_count: int = 3
    mcq_count: int = 3
    coding_count: int = 1

class AIAssessmentDraftResponse(BaseModel):
    title: str
    description: str
    duration_minutes: int
    difficulty: str
    sections: List[Dict[str, Any]]
    validation_summary: Dict[str, Any]

# ----------------- Proctoring & Attempt Lifecycle Schemas -----------------

class SystemCheckSubmit(BaseModel):
    camera_ready: bool
    mic_ready: bool
    browser_ready: bool
    fullscreen_ready: bool
    network_ready: bool
    browser_info: Dict[str, Any] = {}

class ProctoringEventCreate(BaseModel):
    attempt_id: str
    event_type: str
    severity: str = "MEDIUM" # LOW, MEDIUM, HIGH, CRITICAL
    confidence: float = 0.9
    metadata: Dict[str, Any] = {}
    snapshot_url: Optional[str] = None

class ProctoringEventResponse(BaseModel):
    event_id: str
    event_type: str
    severity: str
    warning_issued: bool
    active_warnings: int
    warning_limit: int
    is_suspended: bool
    message: Optional[str] = None
    risk_level: str

class AutosaveAnswerRequest(BaseModel):
    question_id: str
    selected_options: List[str] = []
    text_answer: Optional[str] = None
    is_marked_for_review: bool = False
    time_spent_seconds: int = 0

class AutosaveCodeRequest(BaseModel):
    coding_problem_id: str
    language: str
    code: str

class AttemptStartResponse(BaseModel):
    attempt_id: str
    assessment_id: str
    status: str
    duration_seconds: int
    time_remaining_seconds: int
    start_time: datetime
    proctoring_config: Dict[str, Any]
    assessment_data: Dict[str, Any]

class LiveCandidateStatus(BaseModel):
    attempt_id: str
    candidate_name: str
    candidate_email: str
    assessment_title: str
    status: str
    time_remaining_seconds: int
    current_section: Optional[str]
    warnings_count: int
    warning_limit: int
    risk_level: str # LOW, MEDIUM, HIGH, CRITICAL
    risk_score: float
    camera_online: bool
    last_event: Optional[Dict[str, Any]]

class CandidateResultOut(BaseModel):
    attempt_id: str
    candidate_name: str
    candidate_email: str
    assessment_title: str
    total_score: float
    max_score: float
    percentage: float
    passed: bool
    aptitude_score: float
    mcq_score: float
    coding_score: float
    accuracy_percentage: float
    recruiter_verdict: str
    warnings_count: int
    is_suspended: bool
    suspension_reason: Optional[str] = None
    skill_breakdown: Dict[str, Any] = {}
    completed_at: Optional[datetime] = None
