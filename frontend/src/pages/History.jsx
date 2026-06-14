// History page — displays all past interview sessions for the authenticated user.
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getHistory } from "../services/api";

const DIFFICULTY_COLORS = {
  Easy:   "bg-green-100 text-green-700",
  Medium: "bg-yellow-100 text-yellow-700",
  Hard:   "bg-red-100 text-red-700",
};

const STATUS_META = {
  completed:   { label: "Completed",   cls: "bg-blue-100 text-blue-700" },
  in_progress: { label: "In Progress", cls: "bg-orange-100 text-orange-700" },
};

function scoreColor(s) {
  if (s >= 7) return "text-green-600";
  if (s >= 5) return "text-yellow-500";
  return "text-red-500";
}

function ScoreBadge({ score }) {
  return (
    <span className={`text-2xl font-bold ${scoreColor(score)}`}>
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

  const diffCls    = DIFFICULTY_COLORS[session.difficulty] || "bg-gray-100 text-gray-600";
  const statusMeta = STATUS_META[session.status] || { label: session.status, cls: "bg-gray-100 text-gray-600" };
  const hasQs      = (session.questions?.length ?? 0) > 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200">

      {/* ── Card header ──────────────────────────────────────── */}
      <div className="p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">

          {/* Left — topic + meta */}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-gray-900 truncate">{session.topic}</h2>
            <p className="text-sm text-gray-400 mt-0.5">{date}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${diffCls}`}>
                {session.difficulty}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusMeta.cls}`}>
                {statusMeta.label}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                {session.questions?.length ?? 0}/{session.total_questions} questions
              </span>
            </div>
          </div>

          {/* Right — average score */}
          <div className="text-center flex-shrink-0">
            <p className="text-xs text-gray-400 mb-1">Avg Score</p>
            <ScoreBadge score={session.average_score} />
          </div>
        </div>

        {/* Expand toggle */}
        {hasQs && (
          <button
            id={`expand-${session.session_id}`}
            onClick={() => setExpanded((p) => !p)}
            className="mt-4 flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            <span
              className="inline-block transition-transform duration-300"
              style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
            >
              ▼
            </span>
            {expanded ? "Hide details" : "View details"}
          </button>
        )}
      </div>

      {/* ── Smooth collapsible Q&A ────────────────────────────── */}
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: expanded && hasQs ? "2000px" : "0px", opacity: expanded ? 1 : 0 }}
      >
        <div className="border-t border-gray-100 divide-y divide-gray-50">
          {session.questions?.map((q, idx) => (
            <div key={idx} className="px-6 py-5 bg-gray-50">
              <div className="flex items-start gap-3">
                {/* Color-coded number badge */}
                <span className={`flex-shrink-0 w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center mt-0.5 ${q.score >= 7 ? "bg-green-500" : q.score >= 5 ? "bg-yellow-400" : "bg-red-400"}`}>
                  {idx + 1}
                </span>

                <div className="flex-1 min-w-0 space-y-2">
                  {/* Question + score inline */}
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-800">{q.question}</p>
                    <span className={`flex-shrink-0 text-sm font-bold ${scoreColor(q.score)}`}>
                      {q.score}/10
                    </span>
                  </div>

                  {/* Answer */}
                  <div className="bg-white rounded-lg border border-gray-200 p-3">
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Your Answer</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{q.answer || "—"}</p>
                  </div>

                  {/* Feedback */}
                  {q.feedback && (
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-xs text-blue-500 font-medium uppercase tracking-wide mb-1">AI Feedback</p>
                      <p className="text-sm text-gray-700 leading-relaxed">{q.feedback}</p>
                    </div>
                  )}

                  {/* Improvements */}
                  {q.improvements && (
                    <div className="bg-amber-50 rounded-lg p-3">
                      <p className="text-xs text-amber-500 font-medium uppercase tracking-wide mb-1">How to Improve</p>
                      <p className="text-sm text-gray-700 leading-relaxed">{q.improvements}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
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
            className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all"
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
            <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
              <span className="text-5xl">📋</span>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">No interviews yet</h2>
            <p className="text-gray-400 max-w-xs mb-8 leading-relaxed">
              Complete your first mock interview to start building your practice history.
            </p>
            <button
              onClick={() => navigate("/")}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all"
            >
              🚀 Start Your First Interview
            </button>
          </div>
        )}

        {/* Session cards */}
        {!loading && !error && sessions.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-400 font-medium">
              {sessions.length} session{sessions.length !== 1 ? "s" : ""} found
            </p>
            {sessions.map((session) => (
              <SessionCard key={session.session_id} session={session} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
