import { useState, useEffect } from "react";
import { fetchLeaderboard, fetchContests } from "../api/api";
import { useAuth } from "../App";

interface LeaderboardEntry { rank: number; user_id: number; username: string; total_score: number; submissions: number; }
interface Contest { contest_id: number; title: string; status: string; }

const rankEmoji = (rank: number) => { if (rank === 1) return "🥇"; if (rank === 2) return "🥈"; if (rank === 3) return "🥉"; return `#${rank}`; };

export default function Leaderboard() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [contests, setContests] = useState<Contest[]>([]);
  const [selectedContest, setSelectedContest] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchContests().then(setContests).catch(() => {}); }, []);

  useEffect(() => {
    setLoading(true);
    fetchLeaderboard(selectedContest).then(setLeaderboard).catch(() => setLeaderboard([])).finally(() => setLoading(false));
  }, [selectedContest]);

  if (loading) return <div className="skeleton-block" />;

  return (
    <div>
      <div className="leaderboard-header">
        <h2>🏆 {selectedContest ? "Contest" : "Global"} Leaderboard</h2>
        <div className="leaderboard-filter">
          <select value={selectedContest || ""} onChange={(e) => setSelectedContest(e.target.value ? parseInt(e.target.value) : undefined)}>
            <option value="">🌍 Global (All Contests)</option>
            {contests.map((c) => <option key={c.contest_id} value={c.contest_id}>{c.title} ({c.status})</option>)}
          </select>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Rank</th><th>User</th><th>Score</th><th>Submissions</th></tr></thead>
          <tbody>
            {leaderboard.length === 0 ? <tr><td colSpan={4}>No submissions yet.</td></tr> :
              leaderboard.map((entry) => (
                <tr key={entry.user_id} className={`${entry.rank <= 3 ? "top-rank" : ""} ${entry.user_id === user?.user_id ? "current-user-row" : ""}`}>
                  <td><span className={`rank-cell ${entry.rank <= 3 ? `rank-${entry.rank}` : ""}`}>{rankEmoji(entry.rank)}</span></td>
                  <td><span className="leaderboard-user">{entry.username}{entry.user_id === user?.user_id && <span className="you-badge">You</span>}</span></td>
                  <td className="green">{entry.total_score}</td>
                  <td>{entry.submissions}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
