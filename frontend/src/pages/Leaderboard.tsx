import { useState, useEffect } from "react";
import { fetchLeaderboard } from "../api/api";
import { useAuth } from "../App";

interface LeaderboardEntry {
  rank: number;
  user_id: number;
  username: string;
  total_score: number;
  submissions: number;
}

const rankEmoji = (rank: number) => {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank}`;
};

export default function Leaderboard() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard()
      .then(setLeaderboard)
      .catch(() => setLeaderboard([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="skeleton-block" />;

  return (
    <div>
      <h2>🏆 Global Leaderboard</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>User</th>
              <th>Score</th>
              <th>Submissions</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.length === 0 ? (
              <tr><td colSpan={4}>No submissions yet.</td></tr>
            ) : (
              leaderboard.map((entry) => (
                <tr
                  key={entry.user_id}
                  className={`${entry.rank <= 3 ? "top-rank" : ""} ${entry.user_id === user?.user_id ? "current-user-row" : ""}`}
                >
                  <td>
                    <span className={`rank-cell ${entry.rank <= 3 ? `rank-${entry.rank}` : ""}`}>
                      {rankEmoji(entry.rank)}
                    </span>
                  </td>
                  <td>
                    <span className="leaderboard-user">
                      {entry.username}
                      {entry.user_id === user?.user_id && <span className="you-badge">You</span>}
                    </span>
                  </td>
                  <td className="green">{entry.total_score}</td>
                  <td>{entry.submissions}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
