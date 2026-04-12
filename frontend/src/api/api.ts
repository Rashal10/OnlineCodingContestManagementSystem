const API_BASE = 'http://localhost:5001/api';

function handleAuthError(res: Response) {
  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (!window.location.pathname.startsWith('/login')) {
      window.location.href = '/login?expired=1';
    }
  }
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

async function apiRequest(url: string, options?: RequestInit) {
  const res = await fetch(url, options);
  if (!res.ok) {
    handleAuthError(res);
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }
  return res.json();
}

// ─── Auth ───
export const registerUser = (username: string, email: string, password: string) =>
  apiRequest(`${API_BASE}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, email, password }) });

export const loginUser = (email: string, password: string) =>
  apiRequest(`${API_BASE}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });

export const getCurrentUser = () =>
  apiRequest(`${API_BASE}/auth/me`, { headers: getAuthHeaders() });

export const updateProfile = (data: { username?: string; email?: string }) =>
  apiRequest(`${API_BASE}/auth/me`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(data) });

export const changePassword = (currentPassword: string, newPassword: string) =>
  apiRequest(`${API_BASE}/auth/me/password`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify({ currentPassword, newPassword }) });

// ─── Dashboard ───
export const fetchDashboardStats = () => apiRequest(`${API_BASE}/dashboard/stats`);

// ─── Contests ───
export const fetchContests = () => apiRequest(`${API_BASE}/contests`);
export const fetchContestById = (id: number) => apiRequest(`${API_BASE}/contests/${id}`);
export const fetchContestProblems = (contestId: number) => apiRequest(`${API_BASE}/contests/${contestId}/problems`);

export const joinContest = (contestId: number) =>
  apiRequest(`${API_BASE}/submissions/participations`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ contest_id: contestId }) });

export const fetchActiveParticipation = () =>
  apiRequest(`${API_BASE}/contests/me/active-participation`, { headers: getAuthHeaders() });

export const startContest = (contestId: number) =>
  apiRequest(`${API_BASE}/contests/${contestId}/start`, { method: 'POST', headers: getAuthHeaders() });

export const finishContest = (contestId: number) =>
  apiRequest(`${API_BASE}/contests/${contestId}/finish`, { method: 'POST', headers: getAuthHeaders() });

// ─── Admin Contest CRUD ───
export const createContest = (data: any) =>
  apiRequest(`${API_BASE}/contests`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data) });

export const updateContest = (id: number, data: any) =>
  apiRequest(`${API_BASE}/contests/${id}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(data) });

export const deleteContest = (id: number) =>
  apiRequest(`${API_BASE}/contests/${id}`, { method: 'DELETE', headers: getAuthHeaders() });

export const addProblemToContest = (contestId: number, problemId: number) =>
  apiRequest(`${API_BASE}/contests/${contestId}/problems`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ problem_id: problemId }) });

export const removeProblemFromContest = (contestId: number, problemId: number) =>
  apiRequest(`${API_BASE}/contests/${contestId}/problems/${problemId}`, { method: 'DELETE', headers: getAuthHeaders() });

// ─── Problems ───
export const fetchProblems = () => apiRequest(`${API_BASE}/problems`);
export const fetchProblemById = (id: number) => apiRequest(`${API_BASE}/problems/${id}`);

export const createProblem = (data: any) =>
  apiRequest(`${API_BASE}/problems`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data) });

export const updateProblem = (id: number, data: any) =>
  apiRequest(`${API_BASE}/problems/${id}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(data) });

export const deleteProblem = (id: number) =>
  apiRequest(`${API_BASE}/problems/${id}`, { method: 'DELETE', headers: getAuthHeaders() });

// ─── Leaderboard ───
export const fetchLeaderboard = (contestId?: number) =>
  apiRequest(contestId ? `${API_BASE}/leaderboard/${contestId}` : `${API_BASE}/leaderboard`);

// ─── Submissions ───
export function fetchSubmissions(filters?: { user_id?: number; contest_id?: number }) {
  const params = new URLSearchParams();
  if (filters?.user_id) params.set('user_id', String(filters.user_id));
  if (filters?.contest_id) params.set('contest_id', String(filters.contest_id));
  return apiRequest(`${API_BASE}/submissions?${params}`);
}

export const submitSolution = (contestId: number, problemId: number, code: string, language: string) =>
  apiRequest(`${API_BASE}/submissions`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ contest_id: contestId, problem_id: problemId, code, language }) });

// ─── Participations ───
export function fetchParticipations(filters?: { user_id?: number; contest_id?: number }) {
  const params = new URLSearchParams();
  if (filters?.user_id) params.set('user_id', String(filters.user_id));
  if (filters?.contest_id) params.set('contest_id', String(filters.contest_id));
  return apiRequest(`${API_BASE}/submissions/participations?${params}`);
}

// ─── Users (admin) ───
export const fetchUsers = () => apiRequest(`${API_BASE}/auth/users`, { headers: getAuthHeaders() });
