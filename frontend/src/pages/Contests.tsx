import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchContests, joinContest, fetchParticipations } from "../api/api";
import { useAuth } from "../App";

interface Contest {
  contest_id: number;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  status: "UPCOMING" | "ONGOING" | "ENDED";
}

function TimeLeft({ endTime, startTime, status }: { endTime: string; startTime: string; status: string }) {
  const [text, setText] = useState("");

  useEffect(() => {
    const targetTime = status === "UPCOMING" ? startTime : endTime;
    const update = () => {
      const diff = new Date(targetTime).getTime() - Date.now();
      if (diff <= 0) { setText(status === "UPCOMING" ? "Starting..." : "Ended"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      if (h > 24) setText(`${Math.floor(h / 24)}d ${h % 24}h`);
      else setText(`${h}h ${m}m`);
    };
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, [endTime, startTime, status]);

  if (!text) return null;
  return <span className="countdown-inline">{text}</span>;
}

export default function Contests() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [participations, setParticipations] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<number | null>(null);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    Promise.all([
      fetchContests(),
      isAuthenticated ? fetchParticipations({ user_id: user?.user_id }) : Promise.resolve([]),
    ])
      .then(([contestsData, participationsData]) => {
        setContests(contestsData);
        setParticipations(participationsData.map((p: any) => p.contest_id));
      })
      .catch(() => setContests([]))
      .finally(() => setLoading(false));
  }, [isAuthenticated, user?.user_id]);

  const handleJoin = async (contestId: number) => {
    if (!isAuthenticated) { alert("Please login to join contests"); return; }
    setJoining(contestId);
    try {
      await joinContest(contestId);
      setParticipations([...participations, contestId]);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setJoining(null);
    }
  };

  const statusBadge = (s: string) => {
    if (s === "ONGOING") return "badge-ongoing";
    if (s === "UPCOMING") return "badge-upcoming";
    return "badge-ended";
  };

  if (loading) return <div className="skeleton-block" />;

  return (
    <div>
      <h2>Contests</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Time Remaining</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {contests.length === 0 ? (
              <tr><td colSpan={6}>No contests found.</td></tr>
            ) : (
              contests.map((c) => (
                <tr key={c.contest_id}>
                  <td>
                    <Link to={`/contests/${c.contest_id}`} className="table-link">
                      {c.title}
                    </Link>
                  </td>
                  <td>
                    <span className={`status-badge ${statusBadge(c.status)}`}>{c.status}</span>
                  </td>
                  <td>
                    {c.status !== "ENDED" && (
                      <TimeLeft endTime={c.end_time} startTime={c.start_time} status={c.status} />
                    )}
                    {c.status === "ENDED" && <span className="muted-text">—</span>}
                  </td>
                  <td>{new Date(c.start_time).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}</td>
                  <td>{new Date(c.end_time).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}</td>
                  <td>
                    {participations.includes(c.contest_id) ? (
                      <Link to={`/contests/${c.contest_id}`} className="btn-small btn-accent">Enter →</Link>
                    ) : c.status !== "ENDED" ? (
                      <button onClick={() => handleJoin(c.contest_id)} disabled={joining === c.contest_id} className="btn-small">
                        {joining === c.contest_id ? "Joining..." : "Join"}
                      </button>
                    ) : (
                      <span className="muted-text">Ended</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
