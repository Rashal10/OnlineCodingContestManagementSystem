import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import { useToast } from "../components/Toast";
import ConfirmDialog from "../components/ConfirmDialog";
import {
  fetchContests,
  fetchProblems,
  fetchUsers,
  createContest,
  updateContest,
  deleteContest,
  createProblem,
  updateProblem,
  deleteProblem,
  fetchContestProblems,
  addProblemToContest,
  removeProblemFromContest,
  fetchDashboardStats,
} from "../api/api";

interface Contest { contest_id: number; title: string; description: string; start_time: string; end_time: string; duration_minutes: number; status: string; }
interface Problem { problem_id: number; title: string; description: string; difficulty: string; max_score: number; }
interface User { user_id: number; username: string; email: string; role: string; created_at: string; }
interface Stats { totalContests: number; totalProblems: number; totalSubmissions: number; totalUsers: number; }
type Tab = "overview" | "contests" | "problems" | "users";

function toLocalDatetime(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

function fromLocalDatetime(local: string) {
  return new Date(local).toISOString().slice(0, 19).replace("T", " ");
}

export default function AdminPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  if (!user || user.role !== "ADMIN") {
    return (
      <div className="admin-denied">
        <h2>⛔ Access Denied</h2>
        <p>You must be an admin to view this page.</p>
        <button className="btn-primary" onClick={() => navigate("/")}>Go Home</button>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "overview", label: "Overview", icon: "📊" },
    { key: "contests", label: "Contests", icon: "🏆" },
    { key: "problems", label: "Problems", icon: "📝" },
    { key: "users", label: "Users", icon: "👥" },
  ];

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>⚙️ Admin Dashboard</h1>
        <p className="admin-subtitle">Manage your coding contest platform</p>
      </div>
      <div className="admin-tabs">
        {tabs.map((tab) => (
          <button key={tab.key} className={`admin-tab ${activeTab === tab.key ? "active" : ""}`} onClick={() => setActiveTab(tab.key)}>
            <span className="tab-icon">{tab.icon}</span>{tab.label}
          </button>
        ))}
      </div>
      <div className="admin-content">
        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "contests" && <ContestsTab />}
        {activeTab === "problems" && <ProblemsTab />}
        {activeTab === "users" && <UsersTab />}
      </div>
    </div>
  );
}

function OverviewTab() {
  const [stats, setStats] = useState<Stats | null>(null);
  useEffect(() => { fetchDashboardStats().then(setStats).catch(() => {}); }, []);
  if (!stats) return <div className="skeleton-block" />;
  const cards = [
    { label: "Total Contests", value: stats.totalContests, icon: "🏆", color: "#f59e0b" },
    { label: "Total Problems", value: stats.totalProblems, icon: "📝", color: "#6366f1" },
    { label: "Total Submissions", value: stats.totalSubmissions, icon: "🚀", color: "#10b981" },
    { label: "Total Users", value: stats.totalUsers, icon: "👥", color: "#ec4899" },
  ];
  return (
    <div className="admin-overview">
      <div className="admin-stats-grid">
        {cards.map((c) => (
          <div key={c.label} className="admin-stat-card" style={{ borderColor: c.color }}>
            <span className="admin-stat-icon">{c.icon}</span>
            <div><span className="admin-stat-value">{c.value}</span><span className="admin-stat-label">{c.label}</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContestsTab() {
  const { showToast } = useToast();
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingContest, setEditingContest] = useState<Contest | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Contest | null>(null);
  const [managingProblems, setManagingProblems] = useState<Contest | null>(null);

  const loadContests = () => { setLoading(true); fetchContests().then(setContests).catch(() => {}).finally(() => setLoading(false)); };
  useEffect(() => { loadContests(); }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try { await deleteContest(deleteTarget.contest_id); showToast("Contest deleted successfully", "success"); loadContests(); }
    catch (err: any) { showToast(err.message, "error"); }
    setDeleteTarget(null);
  };

  if (loading) return <div className="skeleton-block" />;

  return (
    <div>
      <div className="admin-section-header">
        <h2>Contest Management</h2>
        <button className="btn-primary" onClick={() => { setEditingContest(null); setShowForm(true); }}>+ Create Contest</button>
      </div>

      {showForm && <ContestForm contest={editingContest} onSave={() => { setShowForm(false); loadContests(); }} onCancel={() => setShowForm(false)} />}
      {managingProblems && <ContestProblemManager contest={managingProblems} onClose={() => setManagingProblems(null)} />}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>ID</th><th>Title</th><th>Status</th><th>Duration</th><th>Start</th><th>End</th><th>Actions</th></tr></thead>
          <tbody>
            {contests.length === 0 ? <tr><td colSpan={7}>No contests yet. Create one!</td></tr> : contests.map((c) => (
              <tr key={c.contest_id}>
                <td>{c.contest_id}</td>
                <td className="admin-contest-title">{c.title}</td>
                <td><span className={`status-badge badge-${c.status.toLowerCase()}`}>{c.status}</span></td>
                <td>{c.duration_minutes || 120}m</td>
                <td>{new Date(c.start_time).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                <td>{new Date(c.end_time).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
                <td>
                  <div className="admin-actions">
                    <button className="btn-small btn-outline" onClick={() => { setEditingContest(c); setShowForm(true); }}>✏️ Edit</button>
                    <button className="btn-small btn-accent" onClick={() => setManagingProblems(c)}>📝 Problems</button>
                    <button className="btn-small btn-danger" onClick={() => setDeleteTarget(c)}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ConfirmDialog open={!!deleteTarget} title="Delete Contest" message={`Are you sure you want to delete "${deleteTarget?.title}"? This will also delete all related participations and submissions.`} confirmText="Delete" variant="danger" onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}

function ContestForm({ contest, onSave, onCancel }: { contest: Contest | null; onSave: () => void; onCancel: () => void }) {
  const { showToast } = useToast();
  const isEdit = !!contest;
  const [title, setTitle] = useState(contest?.title || "");
  const [description, setDescription] = useState(contest?.description || "");
  const [startTime, setStartTime] = useState(contest ? toLocalDatetime(contest.start_time) : "");
  const [endTime, setEndTime] = useState(contest ? toLocalDatetime(contest.end_time) : "");
  const [durationMinutes, setDurationMinutes] = useState(contest?.duration_minutes || 120);
  const [status, setStatus] = useState(contest?.status || "UPCOMING");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !startTime || !endTime) { showToast("Please fill all required fields", "error"); return; }
    if (new Date(endTime) <= new Date(startTime)) { showToast("End time must be after start time", "error"); return; }
    setSaving(true);
    try {
      const data = { title, description, start_time: fromLocalDatetime(startTime), end_time: fromLocalDatetime(endTime), duration_minutes: durationMinutes, status };
      if (isEdit) { await updateContest(contest!.contest_id, data); showToast("Contest updated!", "success"); }
      else { await createContest(data); showToast("Contest created!", "success"); }
      onSave();
    } catch (err: any) { showToast(err.message, "error"); } finally { setSaving(false); }
  };

  return (
    <div className="admin-form-overlay">
      <div className="admin-form-card">
        <div className="admin-form-header">
          <h3>{isEdit ? "✏️ Edit Contest" : "🏆 Create New Contest"}</h3>
          <button className="admin-form-close" onClick={onCancel}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="admin-form">
          <div className="form-group"><label>Contest Title *</label><input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Weekly Challenge #2" required /></div>
          <div className="form-group"><label>Description *</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the contest, rules, and prizes..." rows={4} required /></div>
          <div className="form-row">
            <div className="form-group"><label>Start Time *</label><input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} required /></div>
            <div className="form-group"><label>End Time *</label><input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} required /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Exam Duration (minutes)</label><input type="number" value={durationMinutes} onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 120)} min={10} max={600} /><span className="form-hint">Individual timer when user starts exam</span></div>
            <div className="form-group"><label>Status</label><select value={status} onChange={(e) => setStatus(e.target.value)}><option value="UPCOMING">UPCOMING</option><option value="ONGOING">ONGOING</option><option value="ENDED">ENDED</option></select></div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Saving..." : isEdit ? "Update Contest" : "Create Contest"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ContestProblemManager({ contest, onClose }: { contest: Contest; onClose: () => void }) {
  const { showToast } = useToast();
  const [assignedProblems, setAssignedProblems] = useState<Problem[]>([]);
  const [allProblems, setAllProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try { const [assigned, all] = await Promise.all([fetchContestProblems(contest.contest_id), fetchProblems()]); setAssignedProblems(assigned); setAllProblems(all); }
    catch { showToast("Failed to load problems", "error"); }
    setLoading(false);
  };
  useEffect(() => { loadData(); }, [contest.contest_id]);

  const assignedIds = new Set(assignedProblems.map((p) => p.problem_id));
  const unassigned = allProblems.filter((p) => !assignedIds.has(p.problem_id));

  const handleAdd = async (problemId: number) => {
    try { await addProblemToContest(contest.contest_id, problemId); showToast("Problem added to contest", "success"); loadData(); }
    catch (err: any) { showToast(err.message, "error"); }
  };
  const handleRemove = async (problemId: number) => {
    try { await removeProblemFromContest(contest.contest_id, problemId); showToast("Problem removed", "success"); loadData(); }
    catch (err: any) { showToast(err.message, "error"); }
  };
  const diffBadge = (d: string) => d === "EASY" ? "badge-easy" : d === "MEDIUM" ? "badge-medium" : "badge-hard";

  return (
    <div className="admin-form-overlay">
      <div className="admin-form-card admin-form-wide">
        <div className="admin-form-header"><h3>📝 Manage Problems — {contest.title}</h3><button className="admin-form-close" onClick={onClose}>×</button></div>
        {loading ? <div className="skeleton-block" /> : (
          <div className="problem-manager-grid">
            <div className="problem-manager-section">
              <h4>✅ Assigned ({assignedProblems.length})</h4>
              {assignedProblems.length === 0 ? <p className="empty-text">No problems assigned yet</p> : (
                <div className="problem-manager-list">{assignedProblems.map((p) => (
                  <div key={p.problem_id} className="problem-manager-item assigned">
                    <div><span className="problem-manager-title">{p.title}</span><span className={`diff-badge ${diffBadge(p.difficulty)}`}>{p.difficulty}</span><span className="problem-manager-score">{p.max_score} pts</span></div>
                    <button className="btn-small btn-danger" onClick={() => handleRemove(p.problem_id)}>Remove</button>
                  </div>
                ))}</div>
              )}
            </div>
            <div className="problem-manager-section">
              <h4>📋 Available ({unassigned.length})</h4>
              {unassigned.length === 0 ? <p className="empty-text">All problems are assigned</p> : (
                <div className="problem-manager-list">{unassigned.map((p) => (
                  <div key={p.problem_id} className="problem-manager-item">
                    <div><span className="problem-manager-title">{p.title}</span><span className={`diff-badge ${diffBadge(p.difficulty)}`}>{p.difficulty}</span><span className="problem-manager-score">{p.max_score} pts</span></div>
                    <button className="btn-small btn-accent" onClick={() => handleAdd(p.problem_id)}>+ Add</button>
                  </div>
                ))}</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ProblemsTab() {
  const { showToast } = useToast();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProblem, setEditingProblem] = useState<Problem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Problem | null>(null);

  const loadProblems = () => { setLoading(true); fetchProblems().then(setProblems).catch(() => {}).finally(() => setLoading(false)); };
  useEffect(() => { loadProblems(); }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try { await deleteProblem(deleteTarget.problem_id); showToast("Problem deleted", "success"); loadProblems(); }
    catch (err: any) { showToast(err.message, "error"); }
    setDeleteTarget(null);
  };
  const diffBadge = (d: string) => d === "EASY" ? "badge-easy" : d === "MEDIUM" ? "badge-medium" : "badge-hard";
  if (loading) return <div className="skeleton-block" />;

  return (
    <div>
      <div className="admin-section-header"><h2>Problem Management</h2><button className="btn-primary" onClick={() => { setEditingProblem(null); setShowForm(true); }}>+ Create Problem</button></div>
      {showForm && <ProblemForm problem={editingProblem} onSave={() => { setShowForm(false); loadProblems(); }} onCancel={() => setShowForm(false)} />}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>ID</th><th>Title</th><th>Difficulty</th><th>Max Score</th><th>Actions</th></tr></thead>
          <tbody>
            {problems.length === 0 ? <tr><td colSpan={5}>No problems yet.</td></tr> : problems.map((p) => (
              <tr key={p.problem_id}>
                <td>{p.problem_id}</td><td>{p.title}</td>
                <td><span className={`diff-badge ${diffBadge(p.difficulty)}`}>{p.difficulty}</span></td>
                <td>{p.max_score}</td>
                <td><div className="admin-actions">
                  <button className="btn-small btn-outline" onClick={() => { setEditingProblem(p); setShowForm(true); }}>✏️ Edit</button>
                  <button className="btn-small btn-danger" onClick={() => setDeleteTarget(p)}>🗑️</button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ConfirmDialog open={!!deleteTarget} title="Delete Problem" message={`Delete "${deleteTarget?.title}"? This removes it from all contests.`} confirmText="Delete" variant="danger" onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}

function ProblemForm({ problem, onSave, onCancel }: { problem: Problem | null; onSave: () => void; onCancel: () => void }) {
  const { showToast } = useToast();
  const isEdit = !!problem;
  const [title, setTitle] = useState(problem?.title || "");
  const [description, setDescription] = useState(problem?.description || "");
  const [difficulty, setDifficulty] = useState(problem?.difficulty || "EASY");
  const [maxScore, setMaxScore] = useState(problem?.max_score || 100);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) { showToast("Fill all fields", "error"); return; }
    setSaving(true);
    try {
      const data = { title, description, difficulty, max_score: maxScore };
      if (isEdit) { await updateProblem(problem!.problem_id, data); showToast("Problem updated!", "success"); }
      else { await createProblem(data); showToast("Problem created!", "success"); }
      onSave();
    } catch (err: any) { showToast(err.message, "error"); } finally { setSaving(false); }
  };

  return (
    <div className="admin-form-overlay">
      <div className="admin-form-card">
        <div className="admin-form-header"><h3>{isEdit ? "✏️ Edit Problem" : "📝 Create Problem"}</h3><button className="admin-form-close" onClick={onCancel}>×</button></div>
        <form onSubmit={handleSubmit} className="admin-form">
          <div className="form-group"><label>Title *</label><input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Two Sum" required /></div>
          <div className="form-group"><label>Description *</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Full problem statement..." rows={10} required /><span className="form-hint">Include examples and constraints.</span></div>
          <div className="form-row">
            <div className="form-group"><label>Difficulty</label><select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}><option value="EASY">EASY</option><option value="MEDIUM">MEDIUM</option><option value="HARD">HARD</option></select></div>
            <div className="form-group"><label>Max Score</label><input type="number" value={maxScore} onChange={(e) => setMaxScore(parseInt(e.target.value) || 100)} min={10} max={1000} /></div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Saving..." : isEdit ? "Update" : "Create"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetchUsers().then(setUsers).catch(() => setUsers([])).finally(() => setLoading(false)); }, []);
  if (loading) return <div className="skeleton-block" />;

  return (
    <div>
      <div className="admin-section-header"><h2>User Management</h2><span className="admin-count">{users.length} users</span></div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>ID</th><th>Username</th><th>Email</th><th>Role</th><th>Joined</th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.user_id}>
                <td>{u.user_id}</td>
                <td><span className="admin-user-name"><span className="user-avatar">{u.username.charAt(0).toUpperCase()}</span>{u.username}</span></td>
                <td>{u.email}</td>
                <td><span className={`role-badge ${u.role === "ADMIN" ? "role-admin" : "role-user"}`}>{u.role}</span></td>
                <td>{new Date(u.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
