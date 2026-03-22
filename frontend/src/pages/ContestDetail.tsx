import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchContestById, fetchContestProblems, joinContest, fetchParticipations, startContest } from "../api/api";
import { useAuth } from "../App";

interface Contest {
  contest_id: number;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  status: "UPCOMING" | "ONGOING" | "ENDED";
}

interface Problem {
  problem_id: number;
  title: string;
  difficulty: string;
  max_score: number;
}

function useCountdown(endTime: string) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const update = () => {
      const diff = new Date(endTime).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft("Ended"); return; }

      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);

      if (h > 24) {
        const d = Math.floor(h / 24);
        setTimeLeft(`${d}d ${h % 24}h`);
      } else {
        setTimeLeft(`${h}h ${m}m ${s}s`);
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  return timeLeft;
}

export default function ContestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [contest, setContest] = useState<Contest | null>(null);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [participation, setParticipation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [starting, setStarting] = useState(false);
  const { refreshActiveContest } = useAuth();

  useEffect(() => {
    if (!id) return;

    const cid = parseInt(id);

    Promise.all([
      fetchContestById(cid),
      fetchContestProblems(cid),
      isAuthenticated ? fetchParticipations({ user_id: user?.user_id }) : Promise.resolve([]),
    ])
      .then(([contestData, problemsData, participations]) => {
        setContest(contestData);
        setProblems(problemsData);
        const part = participations.find((p: any) => p.contest_id === cid);
        setParticipation(part || null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id, isAuthenticated, user?.user_id]);

  const handleJoin = async () => {
    if (!isAuthenticated) { navigate("/login"); return; }
    setJoining(true);
    try {
      await joinContest(parseInt(id!));
      setParticipation({ status: 'REGISTERED' });
    } catch (err: any) {
      alert(err.message);
    } finally {
      setJoining(false);
    }
  };

  const handleStartExam = async () => {
    if (!confirm("You are about to start the timer. You will be locked in this environment until you finish or time runs out. Proceed?")) return;
    setStarting(true);
    try {
      await startContest(parseInt(id!));
      await refreshActiveContest();
      setParticipation({ status: 'STARTED' });
    } catch (err: any) {
      alert(err.message);
    } finally {
      setStarting(false);
    }
  };

  const timeLeft = useCountdown(contest?.end_time || "");

  const diffBadge = (d: string) => {
    if (d === "EASY") return "badge-easy";
    if (d === "MEDIUM") return "badge-medium";
    return "badge-hard";
  };

  const statusBadge = (s: string) => {
    if (s === "ONGOING") return "badge-ongoing";
    if (s === "UPCOMING") return "badge-upcoming";
    return "badge-ended";
  };

  if (loading) return <div className="skeleton-block" />;
  if (!contest) return <p>Contest not found</p>;

  return (
    <div className="contest-detail">
      <button onClick={() => navigate("/contests")} className="btn-back">← Back to Contests</button>

      <div className="contest-hero">
        <div className="contest-hero-left">
          <div className="contest-hero-badges">
            <span className={`status-badge ${statusBadge(contest.status)}`}>
              {contest.status}
            </span>
            <span className="problem-count">{problems.length} Problems</span>
          </div>
          <h1>{contest.title}</h1>
          <p className="contest-description">{contest.description}</p>
          <div className="contest-dates">
            <span>📅 {new Date(contest.start_time).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
            <span className="date-separator">→</span>
            <span>📅 {new Date(contest.end_time).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
          </div>
        </div>

        <div className="contest-hero-right">
          {contest.status === "ONGOING" && (
            <div className="countdown-box">
              <span className="countdown-label">Ends in</span>
              <span className="countdown-value">{timeLeft}</span>
            </div>
          )}
          {contest.status === "UPCOMING" && (
            <div className="countdown-box upcoming">
              <span className="countdown-label">Starts in</span>
              <span className="countdown-value">{timeLeft}</span>
            </div>
          )}
          
          {!participation && contest.status !== "ENDED" && (
            <button onClick={handleJoin} disabled={joining} className="btn-primary btn-join">
              {joining ? "Joining..." : "⚡ Join Contest"}
            </button>
          )}

          {participation?.status === 'REGISTERED' && contest.status === 'ONGOING' && (
            <button onClick={handleStartExam} disabled={starting} className="btn-primary btn-join" style={{ background: '#f59e0b', borderColor: '#f59e0b' }}>
              {starting ? "Starting..." : "⏳ Start Exam Timer"}
            </button>
          )}

          {participation?.status === 'REGISTERED' && contest.status === 'UPCOMING' && (
             <span className="joined-badge">✅ Registered (Waiting for start)</span>
          )}

          {participation?.status === 'STARTED' && (
             <span className="joined-badge" style={{ color: '#f59e0b', borderColor: '#f59e0b' }}>🔥 Exam in Progress</span>
          )}

          {participation?.status === 'FINISHED' && (
             <span className="joined-badge" style={{ color: '#a855f7', borderColor: '#a855f7' }}>🎉 Exam Completed</span>
          )}
        </div>
      </div>

      <div className="contest-problems-section">
        <h2>Problems</h2>
        <div className="contest-problems-grid">
          {problems.length === 0 ? (
            <p>No problems have been added to this contest yet.</p>
          ) : (
            problems.map((p, idx) => (
              <div key={p.problem_id} className="problem-card">
                <div className="problem-card-header">
                  <span className="problem-letter">{String.fromCharCode(65 + idx)}</span>
                  <span className={`diff-badge ${diffBadge(p.difficulty)}`}>{p.difficulty}</span>
                </div>
                <h3>{p.title}</h3>
                <div className="problem-card-footer">
                  <span className="problem-score">{p.max_score} pts</span>
                  <div className="problem-card-actions">
                    <button onClick={() => navigate(`/problems/${p.problem_id}`)} className="btn-small btn-outline">
                      View
                    </button>
                    {participation?.status === "STARTED" && (
                      <button
                        onClick={() => navigate(`/submit?contest=${contest.contest_id}&problem=${p.problem_id}`)}
                        className="btn-small btn-accent"
                      >
                        Submit
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
