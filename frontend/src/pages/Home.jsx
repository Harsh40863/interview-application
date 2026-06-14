// Home page — landing page with hero section and interview configuration form.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { startInterview } from "../services/api";

const TOPICS = ["Python", "DSA", "System Design", "JavaScript", "Database"];
const DIFFICULTIES = ["Easy", "Medium", "Hard"];

const DIFFICULTY_META = {
  Easy:   { emoji: "🟢", desc: "Fundamentals & concepts" },
  Medium: { emoji: "🟡", desc: "Applied problem solving" },
  Hard:   { emoji: "🔴", desc: "Advanced & system-level" },
};

function Home() {
  const navigate = useNavigate();
  const [topic, setTopic] = useState(TOPICS[0]);
  const [difficulty, setDifficulty] = useState(DIFFICULTIES[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleStartInterview = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await startInterview(topic, difficulty);
      navigate("/interview", {
        state: {
          session_id: data.session_id,
          question: data.question,
        },
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          <h1 className="text-5xl font-extrabold text-gray-900 leading-tight mb-4">
            AI Mock Interviewer
          </h1>
          <p className="text-xl text-gray-500 max-w-xl mx-auto">
            Practice technical interviews with AI — get instant feedback, scores, and personalized tips to improve fast.
          </p>

          {/* Stats row */}
          <div className="flex justify-center gap-10 mt-10 text-center">
            {[["5", "Questions per session"], ["AI", "Powered feedback"], ["10", "Score out of"]].map(([val, label]) => (
              <div key={label}>
                <p className="text-3xl font-bold text-gray-900">{val}</p>
                <p className="text-sm text-gray-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Config card */}
      <div className="max-w-lg mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Configure your interview</h2>

          {/* Topic */}
          <div className="mb-5">
            <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-2">
              Topic
            </label>
            <select
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white outline-none transition text-gray-900"
            >
              {TOPICS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Difficulty */}
          <div className="mb-7">
            <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
            <div className="grid grid-cols-3 gap-3">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  type="button"
                  id={`difficulty-${d.toLowerCase()}`}
                  onClick={() => setDifficulty(d)}
                  className={`py-3 rounded-xl border text-sm font-medium transition-all ${
                    difficulty === d
                      ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                      : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div>{DIFFICULTY_META[d].emoji}</div>
                  <div className="mt-0.5">{d}</div>
                  <div className="text-xs text-gray-400 font-normal mt-0.5">{DIFFICULTY_META[d].desc}</div>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              <span>⚠️</span> {error}
            </div>
          )}

          <button
            id="start-interview-btn"
            onClick={handleStartInterview}
            disabled={loading}
            className="w-full py-3.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Preparing your interview…
              </>
            ) : (
              <>Start Interview →</>
            )}
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-5">
          5 adaptive questions · AI-scored · Instant feedback
        </p>
      </div>
    </div>
  );
}

export default Home;
