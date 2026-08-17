const BACKEND_URL = (import.meta as any).env?.VITE_API_BASE_URL ? (import.meta as any).env.VITE_API_BASE_URL.replace(/\/$/, '') : '';
const API_BASE = `${BACKEND_URL}/api/v1`;

export class ApiError extends Error {
  status: number;
  data: any;
  constructor(message: string, status: number, data: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('auth_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorDetail = `Request failed with status ${res.status}`;
    let errorData = null;
    try {
      errorData = await res.json();
      if (errorData && errorData.detail) {
        errorDetail = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
      }
    } catch {
      // not json
    }
    throw new ApiError(errorDetail, res.status, errorData);
  }

  return res.json();
}

export const api = {
  // Auth & Setup
  checkSetup: () => request<{ is_setup_completed: boolean; platform_name: string }>('/auth/setup-check'),
  setupInitialAdmin: (data: any) => request<any>('/auth/setup', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  register: (data: any) => request<any>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  sendVerificationOTP: (email: string, token_type = 'REGISTRATION_OTP') =>
    request<any>('/auth/send-verification-otp', { method: 'POST', body: JSON.stringify({ email, token_type }) }),
  verifyEmailOTP: (email: string, otp_code: string, token_type = 'REGISTRATION_OTP') =>
    request<any>('/auth/verify-email-otp', { method: 'POST', body: JSON.stringify({ email, otp_code, token_type }) }),
  getProfile: () => request<any>('/auth/me'),
  updateProfile: (data: any) => request<any>('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),

  // Portal Admin
  getAdminOverview: () => request<any>('/admin/overview'),
  listCreators: () => request<any[]>('/admin/creators'),
  createCreator: (data: any) => request<any>('/admin/creators', { method: 'POST', body: JSON.stringify(data) }),
  updateCreator: (id: string, data: any) => request<any>(`/admin/creators/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  getPlatformSettings: () => request<Record<string, any>>('/admin/settings'),
  updatePlatformSetting: (data: any) => request<any>('/admin/settings', { method: 'POST', body: JSON.stringify(data) }),
  getEmailSettings: () => request<any>('/admin/email-settings'),
  updateEmailSettings: (data: any) => request<any>('/admin/email-settings', { method: 'POST', body: JSON.stringify(data) }),
  sendTestEmail: (data: { to_email: string; subject?: string; custom_message?: string }) =>
    request<any>('/admin/test-email', { method: 'POST', body: JSON.stringify(data) }),
  listPlatforms: () => request<any[]>('/admin/platforms'),
  updatePlatform: (slug: string, data: any) => request<any>(`/admin/platforms/${slug}`, { method: 'PATCH', body: JSON.stringify(data) }),
  testPlatformConnection: (slug: string) => request<any>(`/admin/platforms/${slug}/test-connection`, { method: 'POST' }),
  listAuditLogs: (limit = 100, action?: string) => request<any[]>(`/admin/audit-logs?limit=${limit}${action ? `&action=${action}` : ''}`),
  listAllUsers: () => request<{ admins: any[]; teachers: any[]; students: any[]; total_users: number }>('/admin/users/all'),
  deleteUser: (userType: string, userId: string) => request<any>(`/admin/users/${userType}/${userId}`, { method: 'DELETE' }),
  exportUsersExcel: async () => {
    const token = localStorage.getItem('auth_token');
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(`${API_BASE}/admin/users/export-excel`, { headers });
    if (!res.ok) {
      throw new Error(`Export failed with status ${res.status}`);
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EvalAI_User_Logins_Report_${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },


  // Assessments
  listAssessments: (status?: string) => request<any[]>(`/assessments${status ? `?status_filter=${status}` : ''}`),
  createAssessment: (data: any) => request<any>('/assessments', { method: 'POST', body: JSON.stringify(data) }),
  getAssessment: (id: string) => request<any>(`/assessments/${id}`),
  publishAssessment: (id: string) => request<any>(`/assessments/${id}/publish`, { method: 'PATCH' }),
  inviteCandidates: (id: string, emails: string[]) => request<any>(`/assessments/${id}/invite`, { method: 'POST', body: JSON.stringify(emails) }),
  listAssessmentInvitations: (assessmentId: string) => request<any[]>(`/assessments/${assessmentId}/invitations`),
  sendAssessmentReminders: (assessmentId: string, invitation_ids?: string[]) =>
    request<any>(`/assessments/${assessmentId}/send-reminders`, { method: 'POST', body: JSON.stringify({ invitation_ids }) }),
  remindCandidate: (assessmentId: string, invitationId: string) =>
    request<any>(`/assessments/${assessmentId}/remind/${invitationId}`, { method: 'POST' }),

  // Question Bank
  listQuestions: (params?: { type?: string; topic?: string; difficulty?: string; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.type) q.set('type_filter', params.type);
    if (params?.topic) q.set('topic_filter', params.topic);
    if (params?.difficulty) q.set('difficulty_filter', params.difficulty);
    return request<any[]>(`/questions?${q.toString()}`);
  },
  createQuestion: (data: any) => request<any>('/questions', { method: 'POST', body: JSON.stringify(data) }),

  // Code Judge & Execution
  runCode: (data: { language: string; code: string; custom_input?: string; coding_problem_id?: string }) =>
    request<any>('/coding/run', { method: 'POST', body: JSON.stringify(data) }),
  submitCode: (data: { attempt_id: string; coding_problem_id: string; language: string; code: string }) =>
    request<any>('/coding/submit', { method: 'POST', body: JSON.stringify(data) }),
  getCodingTemplates: (params?: { category?: string; difficulty?: string }) => {
    const q = new URLSearchParams();
    if (params?.category) q.set('category', params.category);
    if (params?.difficulty) q.set('difficulty', params.difficulty);
    return request<any[]>(`/coding/templates?${q.toString()}`);
  },
  getCodingTemplate: (templateId: string) => request<any>(`/coding/templates/${templateId}`),
  getCodeSnippet: (language: string) => request<any>(`/coding/snippets/${language}`),

  // AI Assessment Generator
  generateAIAssessment: (data: any) => request<any>('/ai/generate-assessment', { method: 'POST', body: JSON.stringify(data) }),

  // External Platforms query
  searchExternalProblems: (platform: string, query: string) =>
    request<any[]>(`/platforms/search?platform=${platform}&query=${encodeURIComponent(query)}`),

  // Candidate / Attender
  listAssignedAssessments: () => request<any[]>('/attenders/assessments'),
  startAttempt: (assessmentId: string) => request<any>(`/attempts/start/${assessmentId}`, { method: 'POST' }),
  getAttemptState: (attemptId: string) => request<any>(`/attempts/${attemptId}/state`),
  autosaveAnswer: (attemptId: string, data: any) => request<any>(`/attempts/${attemptId}/autosave-answer`, { method: 'POST', body: JSON.stringify(data) }),
  submitAttempt: (attemptId: string) => request<any>(`/attempts/${attemptId}/submit`, { method: 'POST' }),

  // Proctoring & Warnings
  reportProctoringEvent: (data: { attempt_id: string; event_type: string; severity?: string; confidence?: number; metadata?: any; snapshot_url?: string }) =>
    request<any>('/proctoring/event', { method: 'POST', body: JSON.stringify(data) }),
  uploadProctoringSnapshot: (data: { attempt_id: string; snapshot_base64: string; event_type?: string; confidence?: number; metadata?: any }) =>
    request<any>('/proctoring/snapshot', { method: 'POST', body: JSON.stringify(data) }),
  getAttemptSnapshots: (attemptId: string) => request<any[]>(`/proctoring/snapshots/${attemptId}`),
  listViolations: (assessmentId: string) => request<any[]>(`/proctoring/violations/${assessmentId}`),

  // Live Monitoring & Results
  getLiveMonitoring: (assessmentId: string) => request<any[]>(`/monitoring/live/${assessmentId}`),
  getAssessmentResults: (assessmentId: string) => request<any[]>(`/results/assessment/${assessmentId}`),
  getCandidateResult: (attemptId: string) => request<any>(`/results/candidate/${attemptId}`),
  getCertificate: (attemptId: string) => request<any>(`/results/certificate/${attemptId}`),
  verifyCertificate: (certificateId: string) => request<any>(`/results/verify/${certificateId}`),
  updateVerdict: (attemptId: string, verdict: string, notes?: string) =>
    request<any>(`/results/verdict/${attemptId}?verdict=${verdict}${notes ? `&notes=${encodeURIComponent(notes)}` : ''}`, { method: 'PATCH' }),

  // Reattempts
  requestReattempt: (attemptId: string, reason: string) =>
    request<any>(`/reattempts/request?attempt_id=${attemptId}&reason=${encodeURIComponent(reason)}`, { method: 'POST' }),
  listReattempts: (assessmentId: string) => request<any[]>(`/reattempts/requests/${assessmentId}`),
  approveReattempt: (requestId: string, escalate = false) =>
    request<any>(`/reattempts/approve/${requestId}?escalate_difficulty=${escalate}`, { method: 'POST' }),
};

