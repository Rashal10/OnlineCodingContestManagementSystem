import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchSubmissions } from "../api/api";
import { useAuth } from "../App";

interface Submission {
  submission_id: number;
  problem_title: string;
  contest_title: string;
  score: number;
  language: string;
  submission_time: string;
  contest_id: number;
  problem_id: number;
}

export default function MySubmissions() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchSubmissions({ user_id: user.user_id })
      .then(setSubmissions)
      .catch(() => setSubmissions([]))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <div className="skeleton-block" />;

  const formatTime = (d: string) =>
    new Date(d).toLocaleDateString("en-US", {
      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
    });

  return (
    <div>
      <h2>My Submissions</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Problem</th>
              <th>Contest</th>
              <th>Language</th>
              <th>Score</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {submissions.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  No submissions yet.{" "}
                  <Link to="/contests" style={{ color: "var(--accent)" }}>Join a contest</Link> to get started!
                </td>
              </tr>
            ) : (
              submissions.map((s) => (
                <tr key={s.submission_id}>
                  <td>{s.submission_id}</td>
                  <td>
                    <Link to={`/problems/${s.problem_id}`} className="table-link">
                      {s.problem_title}
                    </Link>
                  </td>
                  <td>
                    <Link to={`/contests/${s.contest_id}`} className="table-link">
                      {s.contest_title}
                    </Link>
                  </td>
                  <td><span className="lang-badge">{s.language}</span></td>
                  <td className={s.score > 0 ? "green" : "red"}>{s.score}</td>
                  <td>{formatTime(s.submission_time)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
