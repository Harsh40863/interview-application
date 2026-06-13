// Results page — fetches and displays all 5 questions with answers, scores, and feedback.
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getResults } from "../services/api";

function Results() {
  const location = useLocation();
  const navigate = useNavigate();

  const sessionId = location.state?.session_id;

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!sessionId) {
      navigate("/");
      return;
    }
    const fetchResults = async () => {
      try {
        const data = await getResults(sessionId);
        setResults(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [sessionId, navigate]);

  if (!sessionId) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500 text-lg">Loading your results...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">{error}</p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const questions = results?.questions ?? [];
  const averageScore =
    questions.length > 0
      ? (questions.reduce((sum, q) => sum + (q.score ?? 0), 0) / questions.length).toFixed(1)
      : 0;

  const scoreColor =
    averageScore >= 8
      ? "text-green-600"
      : averageScore >= 5
      ? "text-yellow-600"
      : "text-red-600";

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Interview Results</h1>
        <p className="text-gray-500 mb-8">
          {results?.topic} · {results?.difficulty}
        </p>

        {/* Overall score card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8 flex items-center gap-6">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Overall Score</p>
            <p className={`text-5xl font-bold ${scoreColor}`}>
              {averageScore} <span className="text-2xl text-gray-400">/ 10</span>
            </p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-sm text-gray-500">Questions answered</p>
            <p className="text-2xl font-semibold text-gray-700">{questions.length} / {results?.total_questions ?? 5}</p>
          </div>
        </div>

        {/* Per-question breakdown */}
        <div className="space-y-6 mb-10">
          {questions.map((q, idx) => (
            <div key={idx} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                  Question {idx + 1}
                </span>
                <span
                  className={`text-lg font-bold ${
                    q.score >= 8
                      ? "text-green-600"
                      : q.score >= 5
                      ? "text-yellow-600"
                      : "text-red-600"
                  }`}
                >
                  {q.score} / 10
                </span>
              </div>

              <p className="text-gray-900 font-medium mb-3">{q.question}</p>

              <div className="bg-gray-50 rounded-md p-3 mb-4">
                <p className="text-xs font-medium text-gray-500 mb-1">Your Answer</p>
                <p className="text-gray-700 text-sm whitespace-pre-wrap">{q.answer}</p>
              </div>

              <div className="mb-3">
                <p className="text-xs font-medium text-gray-500 mb-1">Feedback</p>
                <p className="text-gray-800 text-sm leading-relaxed">{q.feedback}</p>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Improvements</p>
                <p className="text-gray-800 text-sm leading-relaxed">{q.improvements}</p>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => navigate("/")}
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          Start New Interview
        </button>
      </div>
    </div>
  );
}

export default Results;
