import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { fetchContests, fetchContestProblems, submitSolution, fetchParticipations } from "../api/api";

interface Problem {
  problem_id: number;
  title: string;
  difficulty: string;
  max_score: number;
}

interface Contest {
  contest_id: number;
  title: string;
  status: string;
}

export default function Submit() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [contests, setContests] = useState<Contest[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [participations, setParticipations] = useState<number[]>([]);

  const [selectedContest, setSelectedContest] = useState<number>(0);
  const [selectedProblem, setSelectedProblem] = useState<number>(0);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("cpp");

  const [loading, setLoading] = useState(true);
  const [loadingProblems, setLoadingProblems] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load contests and participations on mount
  useEffect(() => {
    const contestId = searchParams.get("contest");

    Promise.all([fetchContests(), fetchParticipations()])
      .then(([contestsData, participationsData]) => {
        const ongoingContests = contestsData.filter((c: Contest) => c.status === "ONGOING");
        setContests(ongoingContests);

        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const userParticipations = participationsData
          .filter((p: any) => p.user_id === user.user_id)
          .map((p: any) => p.contest_id);
        setParticipations(userParticipations);

        if (contestId) {
          const cid = parseInt(contestId);
          setSelectedContest(cid);
        }
      })
      .catch(() => setError("Failed to load data"))
      .finally(() => setLoading(false));
  }, [searchParams]);

  // Load problems when contest changes
  useEffect(() => {
    if (!selectedContest) {
      setProblems([]);
      setSelectedProblem(0);
      return;
    }

    setLoadingProblems(true);
    setSelectedProblem(0);

    fetchContestProblems(selectedContest)
      .then((data) => {
        setProblems(data);
        const problemParam = searchParams.get("problem");
        if (problemParam) {
          const pid = parseInt(problemParam);
          if (data.some((p: Problem) => p.problem_id === pid)) {
            setSelectedProblem(pid);
          }
        }
      })
      .catch(() => setProblems([]))
      .finally(() => setLoadingProblems(false));
  }, [selectedContest]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedContest || !selectedProblem) {
      setError("Please select both a contest and a problem");
      return;
    }

    if (!code.trim()) {
      setError("Please enter your code");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setError("You must be logged in to submit");
      navigate("/login");
      return;
    }

    setSubmitting(true);

    try {
      const result = await submitSolution(selectedContest, selectedProblem, code, language);
      setSuccess(`Solution submitted! Score: ${result.score}`);
      setCode("");
    } catch (err: any) {
      setError(err.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p>Loading...</p>;

  const joinedContests = contests.filter((c) => participations.includes(c.contest_id));

  return (
    <div className="submit-page">
      <h1>Submit Solution</h1>

      {joinedContests.length === 0 && (
        <div className="error-message" style={{ marginBottom: 20 }}>
          You haven't joined any ongoing contests yet.{" "}
          <a href="/contests" style={{ color: "var(--accent)" }}>
            Go to Contests →
          </a>
        </div>
      )}

      <form onSubmit={handleSubmit} className="submit-form">
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="contest">Contest</label>
            <select
              id="contest"
              value={selectedContest}
              onChange={(e) => setSelectedContest(parseInt(e.target.value))}
              required
            >
              <option value={0}>Select a contest</option>
              {joinedContests.map((c) => (
                <option key={c.contest_id} value={c.contest_id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="problem">Problem</label>
            <select
              id="problem"
              value={selectedProblem}
              onChange={(e) => setSelectedProblem(parseInt(e.target.value))}
              disabled={!selectedContest || loadingProblems}
              required
            >
              <option value={0}>
                {!selectedContest
                  ? "Select a contest first"
                  : loadingProblems
                    ? "Loading problems..."
                    : "Select a problem"}
              </option>
              {problems.map((p) => (
                <option key={p.problem_id} value={p.problem_id}>
                  {p.title} • {p.difficulty} • {p.max_score} pts
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="language">Language</label>
            <select id="language" value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="cpp">C++</option>
              <option value="c">C</option>
              <option value="java">Java</option>
              <option value="python">Python</option>
              <option value="javascript">JavaScript</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="code">Code</label>
          <textarea
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Paste your solution code here..."
            rows={18}
            required
          />
        </div>

        <div className="form-actions">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={submitting || !selectedContest || !selectedProblem}
          >
            {submitting ? "Submitting..." : "Submit Solution"}
          </button>
        </div>
      </form>
    </div>
  );
}