const API_BASE = 'http://localhost:5001/api';

// Helper to get auth headers
function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

// Auth API
export async function registerUser(username: string, email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Registration failed');
  }
  return res.json();
}

export async function loginUser(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Login failed');
  }
  return res.json();
}

export async function getCurrentUser() {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch current user');
  return res.json();
}

// Dashboard API
export async function fetchDashboardStats() {
  const res = await fetch(`${API_BASE}/dashboard/stats`);
  if (!res.ok) throw new Error('Failed to fetch dashboard stats');
  return res.json();
}

// Contest API
export async function fetchContests() {
  const res = await fetch(`${API_BASE}/contests`);
  if (!res.ok) throw new Error('Failed to fetch contests');
  return res.json();
}

export async function fetchContestById(id: number) {
  const res = await fetch(`${API_BASE}/contests/${id}`);
  if (!res.ok) throw new Error('Failed to fetch contest');
  return res.json();
}

export async function fetchContestProblems(contestId: number) {
  const res = await fetch(`${API_BASE}/contests/${contestId}/problems`);
  if (!res.ok) throw new Error('Failed to fetch contest problems');
  return res.json();
}

export async function joinContest(contestId: number) {
  const res = await fetch(`${API_BASE}/submissions/participations`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ contest_id: contestId }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to join contest');
  }
  return res.json();
}

export async function fetchActiveParticipation() {
  const res = await fetch(`${API_BASE}/contests/me/active-participation`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch active participation');
  return res.json();
}

export async function startContest(contestId: number) {
  const res = await fetch(`${API_BASE}/contests/${contestId}/start`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to start contest');
  }
  return res.json();
}

export async function finishContest(contestId: number) {
  const res = await fetch(`${API_BASE}/contests/${contestId}/finish`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to finish contest');
  }
  return res.json();
}

// Problem API
export async function fetchProblems() {
  const res = await fetch(`${API_BASE}/problems`);
  if (!res.ok) throw new Error('Failed to fetch problems');
  return res.json();
}

export async function fetchProblemById(id: number) {
  const res = await fetch(`${API_BASE}/problems/${id}`);
  if (!res.ok) throw new Error('Failed to fetch problem');
  return res.json();
}

// Leaderboard API
export async function fetchLeaderboard(contestId?: number) {
  const url = contestId
    ? `${API_BASE}/leaderboard/${contestId}`
    : `${API_BASE}/leaderboard`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch leaderboard');
  return res.json();
}

// Submission API
export async function fetchSubmissions(filters?: { user_id?: number; contest_id?: number }) {
  const params = new URLSearchParams();
  if (filters?.user_id) params.set('user_id', String(filters.user_id));
  if (filters?.contest_id) params.set('contest_id', String(filters.contest_id));
  const res = await fetch(`${API_BASE}/submissions?${params}`);
  if (!res.ok) throw new Error('Failed to fetch submissions');
  return res.json();
}

export async function submitSolution(contestId: number, problemId: number, code: string, language: string) {
  const res = await fetch(`${API_BASE}/submissions`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ 
      contest_id: contestId, 
      problem_id: problemId, 
      code, 
      language,
    }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to submit solution');
  }
  return res.json();
}

// Participations API
export async function fetchParticipations(filters?: { user_id?: number; contest_id?: number }) {
  const params = new URLSearchParams();
  if (filters?.user_id) params.set('user_id', String(filters.user_id));
  if (filters?.contest_id) params.set('contest_id', String(filters.contest_id));
  const res = await fetch(`${API_BASE}/submissions/participations?${params}`);
  if (!res.ok) throw new Error('Failed to fetch participations');
  return res.json();
}

// Users API (admin only)
export async function fetchUsers() {
  const res = await fetch(`${API_BASE}/users`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
}
