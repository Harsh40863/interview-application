// Results page — fetches and displays all questions with answers, scores, and feedback.
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getResults } from "../services/api";

function scoreColor(s) {
  if (s >= 7) return "text-green-600";
  if (s >= 5) return "text-yellow-500";
  return "text-red-500";
}

function scoreBg(s) {
  if (s >= 7) return "bg-green-50 border-green-200";
  if (s >= 5) return "bg-yellow-50 border-yellow-200";
  return "bg-red-50 border-red-200";
}

function QuestionCard({ q, idx }) {
  const [open, setOpen] = useState(idx === 0);
  const color = scoreColor(q.score);
  const bg = scoreBg(q.score);

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${bg}`}>
      {/* Card header — always visible */}
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
        id={`question-toggle-${idx}`}
      >
        <div className="flex items-center gap-3">
          <span className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
            {idx + 1}
          </span>
          <p className="text-sm font-medium text-gray-800 line-clamp-1">{q.question}</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 ml-3">
          <span className={`text-base font-bold ${color}`}>{q.score}<span className="text-xs font-normal text-gray-400">/10</span></span>
          <span className={`text-gray-400 text-sm transition-transform duration-200 ${open ? "rotate-180" : ""}`}>▼</span>
        </div>
      </button>

      {/* Collapsible body */}
      {open && (
        <div className="px-6 pb-6 border-t border-gray-100 pt-4 space-y-4">
          {/* Full question */}
          <p className="text-gray-900 font-medium">{q.question}</p>

          {/* Answer */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Your Answer</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{q.answer || "—"}</p>
          </div>

          {/* Feedback */}
          {q.feedback && (
            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide mb-2">AI Feedback</p>
              <p className="text-sm text-gray-800 leading-relaxed">{q.feedback}</p>
            </div>
          )}

          {/* Improvements */}
          {q.improvements && (
            <div className="bg-amber-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-amber-500 uppercase tracking-wide mb-2">How to Improve</p>
              <p className="text-sm text-gray-800 leading-relaxed">{q.improvements}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const sessionId = location.state?.session_id;

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!sessionId) { navigate("/"); return; }
    (async () => {
      try {
        const data = await getResults(sessionId);
        setResults(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [sessionId, navigate]);

  if (!sessionId) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-gray-500">Loading your results…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-500 mb-4">⚠️ {error}</p>
          <button onClick={() => navigate("/")} className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const questions = results?.questions ?? [];
  const avg = questions.length > 0
    ? (questions.reduce((s, q) => s + (q.score ?? 0), 0) / questions.length).toFixed(1)
    : 0;

  const overallColor = scoreColor(parseFloat(avg));
  const overallBg = avg >= 7 ? "from-green-50 to-white border-green-200"
    : avg >= 5 ? "from-yellow-50 to-white border-yellow-200"
    : "from-red-50 to-white border-red-200";

  const overallLabel = avg >= 7 ? "🎉 Great job!" : avg >= 5 ? "👍 Good effort" : "💪 Keep practicing";

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-3xl mx-auto">

        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Interview Results</h1>
          <p className="text-gray-500 mt-1">{results?.topic} · {results?.difficulty}</p>
        </div>

        {/* Overall score card */}
        <div className={`bg-gradient-to-br ${overallBg} rounded-2xl border p-8 mb-8 flex items-center gap-8`}>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Overall Score</p>
            <p className={`text-6xl font-extrabold ${overallColor}`}>
              {avg}
              <span className="text-2xl text-gray-400 font-normal"> / 10</span>
            </p>
            <p className="text-gray-500 mt-2 font-medium">{overallLabel}</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-sm text-gray-400">Questions answered</p>
            <p className="text-3xl font-bold text-gray-700 mt-1">{questions.length}<span className="text-lg font-normal text-gray-400"> / {results?.total_questions ?? 5}</span></p>
          </div>
        </div>

        {/* Per-question breakdown */}
        <div className="space-y-4 mb-10">
          <h2 className="text-lg font-semibold text-gray-900">Question Breakdown</h2>
          {questions.map((q, idx) => (
            <QuestionCard key={idx} q={q} idx={idx} />
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <button
            id="start-new-interview-btn"
            onClick={() => navigate("/")}
            className="px-8 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all shadow-sm"
          >
            🚀 Start New Interview
          </button>
          <p className="text-sm text-gray-400 mt-3">
            Or <button onClick={() => navigate("/history")} className="text-blue-500 hover:underline">view your full history</button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Results;
