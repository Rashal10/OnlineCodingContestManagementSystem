import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchDashboardStats, fetchContests, fetchSubmissions, fetchParticipations } from "../api/api";
import { useAuth } from "../App";

interface DashboardStats {
  totalContests: number;
  totalProblems: number;
  totalSubmissions: number;
  totalUsers: number;
}

interface Contest {
  contest_id: number;
  title: string;
  status: string;
  end_time: string;
  start_time: string;
}

interface Submission {
  submission_id: number;
  problem_title: string;
  contest_title: string;
  score: number;
  language: string;
  submission_time: string;
}

function TimeLeft({ endTime }: { endTime: string }) {
  const [text, setText] = useState("");

  useEffect(() => {
    const update = () => {
      const diff = new Date(endTime).getTime() - Date.now();
      if (diff <= 0) { setText("Ended"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      if (h > 24) {
        setText(`${Math.floor(h / 24)}d ${h % 24}h left`);
      } else {
        setText(`${h}h ${m}m left`);
      }
    };
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, [endTime]);

  return <span className="countdown-inline">{text}</span>;
}

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [contests, setContests] = useState<Contest[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const promises: Promise<any>[] = [
      fetchDashboardStats(),
      fetchContests(),
    ];

    if (isAuthenticated && user) {
      promises.push(fetchSubmissions({ user_id: user.user_id }));
    }

    Promise.all(promises)
      .then(([statsData, contestsData, subsData]) => {
        setStats(statsData);
        setContests(contestsData);
        if (subsData) setSubmissions(subsData.slice(0, 5));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAuthenticated, user]);

  if (loading) return <div className="skeleton-block" />;
  if (!stats) return <p>Failed to load dashboard.</p>;

  const ongoingContests = contests.filter((c) => c.status === "ONGOING");
  const upcomingContests = contests.filter((c) => c.status === "UPCOMING");

  return (
    <div className="dashboard">
      <div className="welcome-section">
        <h1>
          {isAuthenticated ? `Welcome back, ${user?.username}` : "Welcome to CodeArena"} 👋
        </h1>
        <p>{isAuthenticated ? "Ready for your next challenge?" : "Sign in to start competing."}</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-icon">🏆</span>
          <div className="stat-info">
            <span className="stat-value">{stats.totalContests}</span>
            <span className="stat-label">Contests</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">📝</span>
          <div className="stat-info">
            <span className="stat-value">{stats.totalProblems}</span>
            <span className="stat-label">Problems</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">🚀</span>
          <div className="stat-info">
            <span className="stat-value">{stats.totalSubmissions}</span>
            <span className="stat-label">Submissions</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">👥</span>
          <div className="stat-info">
            <span className="stat-value">{stats.totalUsers}</span>
            <span className="stat-label">Users</span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Active & Upcoming Contests */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>🔥 Active Contests</h2>
            <Link to="/contests" className="section-link">View all →</Link>
          </div>
          {ongoingContests.length === 0 && upcomingContests.length === 0 ? (
            <p className="empty-text">No active contests right now.</p>
          ) : (
            <div className="mini-contest-list">
              {ongoingContests.map((c) => (
                <Link to={`/contests/${c.contest_id}`} key={c.contest_id} className="mini-contest-card">
                  <div className="mini-contest-info">
                    <span className="status-badge badge-ongoing">LIVE</span>
                    <span className="mini-contest-title">{c.title}</span>
                  </div>
                  <TimeLeft endTime={c.end_time} />
                </Link>
              ))}
              {upcomingContests.map((c) => (
                <Link to={`/contests/${c.contest_id}`} key={c.contest_id} className="mini-contest-card">
                  <div className="mini-contest-info">
                    <span className="status-badge badge-upcoming">UPCOMING</span>
                    <span className="mini-contest-title">{c.title}</span>
                  </div>
                  <TimeLeft endTime={c.start_time} />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Submissions */}
        {isAuthenticated && (
          <div className="dashboard-section">
            <div className="section-header">
              <h2>📋 Recent Submissions</h2>
              <Link to="/submissions" className="section-link">View all →</Link>
            </div>
            {submissions.length === 0 ? (
              <p className="empty-text">No submissions yet. <Link to="/contests">Join a contest</Link> to get started!</p>
            ) : (
              <div className="submissions-mini-list">
                {submissions.map((s) => (
                  <div key={s.submission_id} className="submission-mini-row">
                    <div className="submission-mini-info">
                      <span className="submission-problem">{s.problem_title}</span>
                      <span className="submission-contest">{s.contest_title}</span>
                    </div>
                    <div className="submission-mini-meta">
                      <span className="submission-lang">{s.language}</span>
                      <span className={`submission-score ${s.score > 0 ? "green" : ""}`}>{s.score} pts</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
