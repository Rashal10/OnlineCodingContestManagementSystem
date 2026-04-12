import { BrowserRouter, Routes, Route, NavLink, Navigate, useNavigate, useLocation } from "react-router-dom";
import { useState, createContext, useContext, useEffect } from "react";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Contests from "./pages/Contests";
import ContestDetail from "./pages/ContestDetail";
import Problems from "./pages/Problems";
import ProblemDetails from "./pages/ProblemDetails";
import Leaderboard from "./pages/Leaderboard";
import Submit from "./pages/Submit";
import MySubmissions from "./pages/MySubmissions";
import AdminPanel from "./pages/AdminPanel";
import Profile from "./pages/Profile";

import { fetchActiveParticipation, finishContest } from "./api/api";
import { ToastProvider, useToast } from "./components/Toast";
import ConfirmDialog from "./components/ConfirmDialog";
import "./index.css";

// ─── Auth Context ───
interface User { user_id: number; username: string; email: string; role: string; }
interface ActiveContest { active_contest_id: number; start_time: string; duration_minutes: number; }
interface AuthContextType { user: User | null; activeContest: ActiveContest | null; login: (user: User, token: string) => void; logout: () => void; refreshActiveContest: () => Promise<void>; isAuthenticated: boolean; }

const AuthContext = createContext<AuthContextType | null>(null);
export const useAuth = () => { const c = useContext(AuthContext); if (!c) throw new Error("useAuth must be used within AuthProvider"); return c; };

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => { const s = localStorage.getItem("user"); return s ? JSON.parse(s) : null; });
  const [activeContest, setActiveContest] = useState<ActiveContest | null>(null);

  const refreshActiveContest = async () => {
    if (!user) { setActiveContest(null); return; }
    try { const res = await fetchActiveParticipation(); setActiveContest(res.active_contest_id ? res : null); } catch { setActiveContest(null); }
  };

  useEffect(() => { refreshActiveContest(); }, [user]);

  const login = (u: User, token: string) => { localStorage.setItem("token", token); localStorage.setItem("user", JSON.stringify(u)); setUser(u); };
  const logout = () => { localStorage.removeItem("token"); localStorage.removeItem("user"); setUser(null); setActiveContest(null); };

  return <AuthContext.Provider value={{ user, activeContest, login, logout, refreshActiveContest, isAuthenticated: !!user }}>{children}</AuthContext.Provider>;
}

// ─── Timer Hook ───
function useContestTimer(startTime: string, durationMinutes: number) {
  const [text, setText] = useState("");
  const [expired, setExpired] = useState(false);
  useEffect(() => {
    const update = () => {
      if (!startTime || !durationMinutes) return;
      const end = new Date(startTime).getTime() + durationMinutes * 60000;
      const diff = end - Date.now();
      if (diff <= 0) { setText("00:00:00"); setExpired(true); return; }
      const h = Math.floor(diff / 3600000); const m = Math.floor((diff % 3600000) / 60000); const s = Math.floor((diff % 60000) / 1000);
      setText(`${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`);
    };
    update(); const id = setInterval(update, 1000); return () => clearInterval(id);
  }, [startTime, durationMinutes]);
  return { text, expired };
}

// ─── Layout ───
function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout, isAuthenticated, activeContest, refreshActiveContest } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const timer = useContestTimer(activeContest?.start_time || "", activeContest?.duration_minutes || 0);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => { logout(); navigate("/login"); };

  const handleFinishExam = async () => {
    if (!activeContest) return;
    try { await finishContest(activeContest.active_contest_id); await refreshActiveContest(); showToast("Exam finished!", "success"); navigate(`/contests/${activeContest.active_contest_id}`); }
    catch { showToast("Failed to finish exam", "error"); }
    setShowFinishConfirm(false);
  };

  useEffect(() => {
    if (timer.expired && activeContest) {
      showToast("⏰ Time is up! Exam auto-finished.", "warning", 6000);
      finishContest(activeContest.active_contest_id).then(() => refreshActiveContest()).then(() => navigate(`/contests/${activeContest.active_contest_id}`));
    }
  }, [timer.expired]);

  useEffect(() => { setMobileMenuOpen(false); }, [location.pathname]);

  const isLocked = !!activeContest;

  return (
    <div className="layout">
      {!isLocked && (
        <aside className={`sidebar ${mobileMenuOpen ? "sidebar-open" : ""}`}>
          <div className="brand"><div className="brand-mark" /><div className="brand-text"><span className="brand-title">CodeArena</span><span className="brand-subtitle">Coding Contest</span></div></div>
          <nav className="sidebar-nav">
            <NavLink to="/" end className={({ isActive }) => isActive ? "active" : ""}><span className="nav-icon">📊</span> Dashboard</NavLink>
            <NavLink to="/contests" className={({ isActive }) => isActive ? "active" : ""}><span className="nav-icon">🏆</span> Contests</NavLink>
            <NavLink to="/problems" className={({ isActive }) => isActive ? "active" : ""}><span className="nav-icon">📝</span> Problems</NavLink>
            <NavLink to="/leaderboard" className={({ isActive }) => isActive ? "active" : ""}><span className="nav-icon">🏅</span> Leaderboard</NavLink>
            {isAuthenticated && (<>
              <NavLink to="/submit" className={({ isActive }) => isActive ? "active" : ""}><span className="nav-icon">🚀</span> Submit</NavLink>
              <NavLink to="/submissions" className={({ isActive }) => isActive ? "active" : ""}><span className="nav-icon">📋</span> My Submissions</NavLink>
              <NavLink to="/profile" className={({ isActive }) => isActive ? "active" : ""}><span className="nav-icon">👤</span> Profile</NavLink>
            </>)}
            {isAuthenticated && user?.role === "ADMIN" && (
              <NavLink to="/admin" className={({ isActive }) => isActive ? "active" : ""}><span className="nav-icon">⚙️</span> Admin Panel</NavLink>
            )}
          </nav>
          <div className="sidebar-footer"><div className="status-dot" /><span>System Healthy</span></div>
        </aside>
      )}

      <div className="main">
        {isLocked ? (
          <header className="navbar locked-navbar">
            <div className="locked-warning"><span className="locked-icon">⚠️</span><span>Exam in Progress</span></div>
            <div className="timer-display"><span className="timer-label">Time Remaining</span><span className="timer-value">{timer.text}</span></div>
            <button onClick={() => setShowFinishConfirm(true)} className="btn-finish-exam">Finish Exam</button>
          </header>
        ) : (
          <header className="navbar">
            <div className="navbar-left">
              <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">{mobileMenuOpen ? "✕" : "☰"}</button>
              <h2>CodeArena</h2>
            </div>
            <div className="profile">
              {isAuthenticated ? (<>
                <NavLink to="/profile" className="user-badge"><span className="user-avatar">{user?.username?.charAt(0).toUpperCase()}</span>{user?.username}</NavLink>
                <button onClick={handleLogout} className="btn-logout">Logout</button>
              </>) : <NavLink to="/login" className="btn-login">Login</NavLink>}
            </div>
          </header>
        )}
        <div className="content">{children}</div>
      </div>

      {mobileMenuOpen && <div className="mobile-overlay" onClick={() => setMobileMenuOpen(false)} />}
      <ConfirmDialog open={showFinishConfirm} title="Finish Exam Early" message="Are you sure? You cannot undo this." confirmText="Finish Exam" variant="warning" onConfirm={handleFinishExam} onCancel={() => setShowFinishConfirm(false)} />
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, activeContest } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (activeContest) {
    const p = window.location.pathname;
    if (!p.startsWith('/contests') && !p.startsWith('/problems') && !p.startsWith('/submit')) return <Navigate to={`/contests/${activeContest.active_contest_id}`} replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<Layout><Dashboard /></Layout>} />
            <Route path="/contests" element={<Layout><Contests /></Layout>} />
            <Route path="/contests/:id" element={<Layout><ContestDetail /></Layout>} />
            <Route path="/problems" element={<Layout><Problems /></Layout>} />
            <Route path="/problems/:id" element={<Layout><ProblemDetails /></Layout>} />
            <Route path="/leaderboard" element={<Layout><Leaderboard /></Layout>} />
            <Route path="/submit" element={<ProtectedRoute><Layout><Submit /></Layout></ProtectedRoute>} />
            <Route path="/submissions" element={<ProtectedRoute><Layout><MySubmissions /></Layout></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><Layout><AdminPanel /></Layout></ProtectedRoute>} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
