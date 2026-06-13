// Home page — landing page with a call-to-action to start a mock interview.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { startInterview } from "../services/api";

const TOPICS = ["Python", "DSA", "System Design", "JavaScript", "Database"];
const DIFFICULTIES = ["Easy", "Medium", "Hard"];

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">
        AI Mock Interviewer
      </h1>

      <div className="w-full max-w-md space-y-4 mb-6">
        <div>
          <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-1">
            Topic
          </label>
          <select
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {TOPICS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-1">
            Difficulty
          </label>
          <select
            id="difficulty"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <p className="text-red-600 text-sm mb-4 text-center max-w-md">{error}</p>
      )}

      <button
        onClick={handleStartInterview}
        disabled={loading}
        className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Starting..." : "Start Interview"}
      </button>
    </div>
  );
}

export default Home;
