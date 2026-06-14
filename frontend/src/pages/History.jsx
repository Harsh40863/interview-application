// History page — displays all past interview sessions for the authenticated user.
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getHistory } from "../services/api";

const DIFFICULTY_COLORS = {
  Easy:   "bg-green-100 text-green-700",
  Medium: "bg-yellow-100 text-yellow-700",
  Hard:   "bg-red-100 text-red-700",
};

const STATUS_COLORS = {
  completed:   "bg-blue-100 text-blue-700",
  in_progress: "bg-orange-100 text-orange-700",
};

function ScoreBadge({ score }) {
  const color =
    score >= 7 ? "text-green-600" : score >= 4 ? "text-yellow-500" : "text-red-500";
  return (
    <span className={`text-2xl font-bold ${color}`}>
      {score ?? "—"}<span className="text-sm font-normal text-gray-400">/10</span>
    </span>
  );
}

function SessionCard({ session }) {
  const [expanded, setExpanded] = useState(false);

  const date = session.created_at
    ? new Date(session.created_at).toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : "Unknown date";

  const difficultyClass = DIFFICULTY_COLORS[session.difficulty] || "bg-gray-100 text-gray-600";
  const statusClass     = STATUS_COLORS[session.status]          || "bg-gray-100 text-gray-600";
  const statusLabel     = session.status === "completed" ? "Completed" : "In Progress";

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-200 hover:shadow-md">
      {/* Card header */}
      <div className="p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          {/* Left: topic + badges */}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-gray-900 truncate">{session.topic}</h2>
            <p className="text-sm text-gray-400 mt-0.5">{date}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${difficultyClass}`}>
                {session.difficulty}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}`}>
                {statusLabel}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                {session.questions?.length ?? 0}/{session.total_questions} questions
              </span>
            </div>
          </div>

          {/* Right: average score */}
          <div className="text-center flex-shrink-0">
            <p className="text-xs text-gray-400 mb-1">Avg Score</p>
            <ScoreBadge score={session.average_score} />
          </div>
        </div>

        {/* Expand / collapse */}
        {session.questions?.length > 0 && (
          <button
            onClick={() => setExpanded((p) => !p)}
            className="mt-4 flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
            id={`expand-${session.session_id}`}
          >
            {expanded ? "▲ Hide details" : "▼ View details"}
          </button>
        )}
      </div>

      {/* Expanded Q&A list */}
      {expanded && session.questions?.length > 0 && (
        <div className="border-t border-gray-100 divide-y divide-gray-50">
          {session.questions.map((q, idx) => {
            const scoreColor =
              q.score >= 7 ? "text-green-600" : q.score >= 4 ? "text-yellow-500" : "text-red-500";
            return (
              <div key={idx} className="px-6 py-5 bg-gray-50">
                {/* Question */}
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center mt-0.5">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{q.question}</p>

                    {/* Answer */}
                    <div className="mt-2 bg-white rounded-lg border border-gray-200 p-3">
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Your Answer</p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{q.answer || "—"}</p>
                    </div>

                    {/* Score + feedback */}
                    <div className="mt-2 flex flex-wrap gap-4 items-start">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-400 font-medium">Score:</span>
                        <span className={`text-sm font-bold ${scoreColor}`}>{q.score}/10</span>
                      </div>
                    </div>

                    {q.feedback && (
                      <div className="mt-2 bg-blue-50 rounded-lg p-3">
                        <p className="text-xs text-blue-500 font-medium uppercase tracking-wide mb-1">Feedback</p>
                        <p className="text-sm text-gray-700">{q.feedback}</p>
                      </div>
                    )}

                    {q.improvements && (
                      <div className="mt-2 bg-amber-50 rounded-lg p-3">
                        <p className="text-xs text-amber-500 font-medium uppercase tracking-wide mb-1">How to Improve</p>
                        <p className="text-sm text-gray-700">{q.improvements}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function History() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await getHistory();
        setSessions(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-3xl mx-auto">
        {/* Page header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Interview History</h1>
            <p className="text-gray-500 mt-1">Review all your past mock interview sessions</p>
          </div>
          <button
            id="start-new-interview-btn"
            onClick={() => navigate("/")}
            className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Start New Interview
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
            <p className="text-sm">Loading your history…</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-4 text-sm flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && sessions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No interviews yet</h2>
            <p className="text-gray-400 mb-6">Start your first mock interview to see your history here.</p>
            <button
              onClick={() => navigate("/")}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Start Your First Interview
            </button>
          </div>
        )}

        {/* Session cards */}
        {!loading && !error && sessions.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-400">{sessions.length} session{sessions.length !== 1 ? "s" : ""} found</p>
            {sessions.map((session) => (
              <SessionCard key={session.session_id} session={session} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
