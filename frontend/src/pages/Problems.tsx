import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchProblems } from "../api/api";

interface Problem {
  problem_id: number;
  title: string;
  description: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  max_score: number;
}

export default function Problems() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProblems()
      .then(setProblems)
      .catch(() => setProblems([]))
      .finally(() => setLoading(false));
  }, []);

  const difficultyClass = (d: string) => {
    if (d === "EASY") return "green";
    if (d === "MEDIUM") return "blue";
    return "red";
  };

  if (loading) return <p>Loading problems...</p>;

  return (
    <div>
      <h2>Problems</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Title</th>
              <th>Difficulty</th>
              <th>Max Score</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {problems.length === 0 ? (
              <tr>
                <td colSpan={5}>No problems found.</td>
              </tr>
            ) : (
              problems.map((p) => (
                <tr key={p.problem_id}>
                  <td>{p.problem_id}</td>
                  <td>{p.title}</td>
                  <td className={difficultyClass(p.difficulty)}>{p.difficulty}</td>
                  <td>{p.max_score}</td>
                  <td>
                    <button
                      onClick={() => navigate(`/problems/${p.problem_id}`)}
                      className="btn-small"
                    >
                      View
                    </button>
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
