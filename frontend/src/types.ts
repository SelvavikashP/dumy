export type UserRole = 'PORTAL_ADMIN' | 'TEST_CREATOR' | 'TEST_ATTENDER';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  company_name?: string;
  permissions: string[];
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  role: UserRole;
  user_id: string;
  email: string;
  full_name: string;
}

export interface QuestionOption {
  id?: string;
  option_text: string;
  is_correct?: boolean;
  explanation?: string;
  option_order?: number;
}

export interface CodingTestCase {
  id?: string;
  input_data: string;
  expected_output: string;
  is_hidden: boolean;
  points: number;
  explanation?: string;
}

export interface CodingProblem {
  id?: string;
  title: string;
  statement: string;
  input_format?: string;
  output_format?: string;
  constraints?: string;
  examples?: Array<{ input: string; output: string; explanation?: string }>;
  default_code?: Record<string, string>;
  reference_solution?: string;
  time_limit_seconds?: number;
  memory_limit_mb?: number;
  supported_languages?: string[];
  tags?: string[];
  difficulty: string;
  test_cases?: CodingTestCase[];
  sample_test_cases?: CodingTestCase[];
}

export interface Question {
  id?: string;
  type: 'APTITUDE' | 'MCQ_SINGLE' | 'MCQ_MULTIPLE' | 'CODING' | 'PROGRAMMING_CHALLENGE';
  topic?: string;
  skill?: string;
  difficulty: string;
  problem_statement: string;
  explanation?: string;
  points: number;
  negative_points?: number;
  source?: string;
  status?: string;
  options?: QuestionOption[];
  coding_problem?: CodingProblem;
}

export interface AssessmentSection {
  id?: string;
  title: string;
  description?: string;
  duration_minutes: number;
  section_order: number;
  questions?: Question[];
  questions_count?: number;
}

export interface Assessment {
  id: string;
  title: string;
  description?: string;
  duration_minutes: number;
  passing_percentage: number;
  difficulty: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  instructions?: string;
  negative_marking: boolean;
  negative_marking_value: number;
  proctoring_level: 'OFF' | 'BASIC' | 'STANDARD' | 'STRICT';
  camera_required: boolean;
  microphone_required: boolean;
  fullscreen_required: boolean;
  tab_detection_enabled: boolean;
  warning_limit: number;
  auto_suspension_enabled: boolean;
  reattempt_policy: 'NONE' | 'MANUAL' | 'AUTOMATIC';
  max_reattempts: number;
  difficulty_escalation: boolean;
  created_at: string;
  sections?: AssessmentSection[];
  questions_count?: number;
  total_points?: number;
  latest_attempt?: {
    id: string;
    status: string;
    score: number;
    percentage: number;
    passed: boolean;
  };
}

export interface CodeRunResult {
  status: string;
  stdout: string;
  stderr?: string;
  execution_time_ms: number;
  memory_used_mb: number;
  sample_tests_passed?: number;
  sample_tests_total?: number;
  test_case_results?: Array<{
    input: string;
    expected_output: string;
    actual_output: string;
    status: string;
    passed: boolean;
    error?: string;
    execution_time_ms?: number;
  }>;
}

export interface LiveCandidate {
  attempt_id: string;
  candidate_name: string;
  candidate_email: string;
  assessment_title: string;
  status: string;
  time_remaining_seconds: number;
  current_section?: string;
  warnings_count: number;
  warning_limit: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  risk_score: number;
  camera_online: boolean;
  last_event?: {
    event_type: string;
    severity: string;
    created_at: string;
  };
}

export interface CandidateResult {
  attempt_id: string;
  candidate_name: string;
  candidate_email: string;
  assessment_title: string;
  total_score: number;
  max_score: number;
  percentage: number;
  passed: boolean;
  aptitude_score: number;
  mcq_score: number;
  coding_score: number;
  accuracy_percentage: number;
  recruiter_verdict: string;
  warnings_count: number;
  is_suspended: boolean;
  suspension_reason?: string;
  skill_breakdown: Record<string, { earned: number; total: number; questions: number }>;
  completed_at?: string;
}
