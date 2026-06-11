// Interview page — hosts the live interview session UI and question flow.
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { submitAnswer } from "../services/api";

function Interview() {
  const location = useLocation();
  const navigate = useNavigate();
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const sessionId = location.state?.session_id;
  const question = location.state?.question;

  useEffect(() => {
    if (!sessionId || !question) {
      navigate("/");
    }
  }, [sessionId, question, navigate]);

  const handleSubmit = async () => {
    if (!answer.trim()) {
      setError("Please enter your answer before submitting.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const evaluation = await submitAnswer(sessionId, question, answer);
      navigate("/results", { state: { evaluation } });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!sessionId || !question) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Interview</h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-sm font-medium text-gray-500 mb-2">Question</h2>
          <p className="text-lg text-gray-900">{question}</p>
        </div>

        <div className="mb-6">
          <label htmlFor="answer" className="block text-sm font-medium text-gray-700 mb-2">
            Your Answer
          </label>
          <textarea
            id="answer"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={8}
            placeholder="Type your answer here..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
          />
        </div>

        {error && (
          <p className="text-red-600 text-sm mb-4">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Submitting..." : "Submit Answer"}
        </button>
      </div>
    </div>
  );
}

export default Interview;
