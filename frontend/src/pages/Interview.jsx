// Interview page — hosts the live interview session with progress tracking across 5 questions.
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getQuestion, submitAnswer } from "../services/api";

function Interview() {
  const location = useLocation();
  const navigate = useNavigate();

  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [question, setQuestion] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(5);

  const sessionId = location.state?.session_id;

  useEffect(() => {
    if (!sessionId) {
      navigate("/");
      return;
    }
    const fetchQuestion = async () => {
      try {
        const data = await getQuestion(sessionId);
        setQuestion(data.question);
        setCurrentIndex(data.current_index ?? 0);
        setTotalQuestions(data.total_questions ?? 5);
      } catch (err) {
        setError(err.message);
      } finally {
        setFetching(false);
      }
    };
    fetchQuestion();
  }, [sessionId, navigate]);

  const handleSubmit = async () => {
    if (!answer.trim()) {
      setError("Please enter your answer before submitting.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const result = await submitAnswer(sessionId, answer);

      if (result.completed) {
        // All 5 questions answered — go to results
        navigate("/results", { state: { session_id: sessionId } });
      } else {
        // More questions remain — update state in place
        setQuestion(result.next_question);
        setCurrentIndex(result.current_index);
        setTotalQuestions(result.total_questions);
        setAnswer("");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!sessionId) {
    return null;
  }

  if (fetching) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500 text-lg">Loading question...</p>
      </div>
    );
  }

  const progressPercent = Math.round((currentIndex / totalQuestions) * 100);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-gray-900">Interview</h1>
          <span className="text-sm font-medium text-gray-500">
            Question {currentIndex + 1} of {totalQuestions}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

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
          <p className="mt-2 text-sm text-gray-400 italic">
            💡 Answer in text — explain your approach, time complexity, and how you would solve it.
          </p>
        </div>

        {error && (
          <p className="text-red-600 text-sm mb-4">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading
            ? currentIndex + 1 === totalQuestions
              ? "Finishing..."
              : "Submitting..."
            : currentIndex + 1 === totalQuestions
            ? "Finish Interview"
            : "Next Question →"}
        </button>
      </div>
    </div>
  );
}

export default Interview;
