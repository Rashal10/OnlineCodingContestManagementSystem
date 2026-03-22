// CodeArena App — Main routing and auth context
import { BrowserRouter, Routes, Route, NavLink, Navigate, useNavigate } from "react-router-dom";
import { useState, createContext, useContext } from "react";

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

import { fetchActiveParticipation } from "./api/api";
import "./index.css";

// Auth Context
interface User {
  user_id: number;
  username: string;
  email: string;
  role: string;
}

interface ActiveContest {
  active_contest_id: number;
  start_time: string;
  duration_minutes: number;
}

interface AuthContextType {
  user: User | null;
  activeContest: ActiveContest | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  refreshActiveContest: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });
  const [activeContest, setActiveContest] = useState<ActiveContest | null>(null);

  const refreshActiveContest = async () => {
    if (!user) {
      setActiveContest(null);
      return;
    }
    try {
      const res = await fetchActiveParticipation();
      setActiveContest(res.active_contest_id ? res : null);
    } catch (e) {
      setActiveContest(null);
    }
  };

  useEffect(() => {
    refreshActiveContest();
  }, [user]);

  const login = (user: User, token: string) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setActiveContest(null);
  };

  return (
    <AuthContext.Provider value={{ user, activeContest, login, logout, refreshActiveContest, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

import { finishContest } from "./api/api";
import { useEffect } from "react";

function useContestTimer(startTime: string, durationMinutes: number) {
  const [text, setText] = useState("");
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const update = () => {
      if (!startTime || !durationMinutes) return;
      const start = new Date(startTime).getTime();
      const end = start + durationMinutes * 60000;
      const diff = end - Date.now();

      if (diff <= 0) {
        setText("00:00:00");
        setExpired(true);
        return;
      }
      
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setText(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [startTime, durationMinutes]);

  return { text, expired };
}

function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout, isAuthenticated, activeContest, refreshActiveContest } = useAuth();
  const navigate = useNavigate();
  const timer = useContestTimer(activeContest?.start_time || "", activeContest?.duration_minutes || 0);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleFinishExam = async () => {
    if (!activeContest) return;
    if (confirm("Are you sure you want to finish the exam early? You cannot undo this.")) {
      try {
        await finishContest(activeContest.active_contest_id);
        await refreshActiveContest();
        navigate(`/contests/${activeContest.active_contest_id}`);
      } catch (err) {
        alert("Failed to finish exam");
      }
    }
  };

  useEffect(() => {
    if (timer.expired && activeContest) {
      alert("Time is up! Your exam has been automatically finished.");
      refreshActiveContest().then(() => {
        navigate(`/contests/${activeContest.active_contest_id}`);
      });
    }
  }, [timer.expired, activeContest]);

  const isLocked = !!activeContest;

  return (
    <div className="layout">
      {!isLocked && (
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-mark" />
            <div className="brand-text">
              <span className="brand-title">CodeArena</span>
              <span className="brand-subtitle">Coding Contest</span>
            </div>
          </div>
          <nav className="sidebar-nav">
            <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
              <span className="nav-icon">📊</span> Dashboard
            </NavLink>
            <NavLink to="/contests" className={({ isActive }) => (isActive ? "active" : "")}>
              <span className="nav-icon">🏆</span> Contests
            </NavLink>
            <NavLink to="/problems" className={({ isActive }) => (isActive ? "active" : "")}>
              <span className="nav-icon">📝</span> Problems
            </NavLink>
            <NavLink to="/leaderboard" className={({ isActive }) => (isActive ? "active" : "")}>
              <span className="nav-icon">🏅</span> Leaderboard
            </NavLink>
            {isAuthenticated && (
              <>
                <NavLink to="/submit" className={({ isActive }) => (isActive ? "active" : "")}>
                  <span className="nav-icon">🚀</span> Submit
                </NavLink>
                <NavLink to="/submissions" className={({ isActive }) => (isActive ? "active" : "")}>
                  <span className="nav-icon">📋</span> My Submissions
                </NavLink>
              </>
            )}
          </nav>
          <div className="sidebar-footer">
            <div className="status-dot" />
            <span>System Healthy</span>
          </div>
        </aside>
      )}

      <div className="main">
        {isLocked ? (
          <header className="navbar locked-navbar">
            <div className="locked-warning">
              <span className="locked-icon">⚠️</span>
              <span>Exam in Progress — You cannot leave this environment</span>
            </div>
            <div className="timer-display">
              <span className="timer-label">Time Remaining</span>
              <span className="timer-value">{timer.text}</span>
            </div>
            <button onClick={handleFinishExam} className="btn-finish-exam">
              Finish Exam
            </button>
          </header>
        ) : (
          <header className="navbar">
            <h2>CodeArena</h2>
            <div className="profile">
              {isAuthenticated ? (
                <>
                  <span className="user-badge">
                    <span className="user-avatar">{user?.username?.charAt(0).toUpperCase()}</span>
                    {user?.username}
                  </span>
                  <button onClick={handleLogout} className="btn-logout">Logout</button>
                </>
              ) : (
                <NavLink to="/login" className="btn-login">Login</NavLink>
              )}
            </div>
          </header>
        )}
        <div className="content">{children}</div>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, activeContest } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  // Route Guard: If locked in an exam, restrict navigation
  if (activeContest) {
    const p = window.location.pathname;
    if (!p.startsWith('/contests') && !p.startsWith('/problems') && !p.startsWith('/submit')) {
      return <Navigate to={`/contests/${activeContest.active_contest_id}`} replace />;
    }
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
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

          <Route path="/submit" element={
            <ProtectedRoute><Layout><Submit /></Layout></ProtectedRoute>
          } />
          <Route path="/submissions" element={
            <ProtectedRoute><Layout><MySubmissions /></Layout></ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
