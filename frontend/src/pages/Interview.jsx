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
        navigate("/results", { state: { session_id: sessionId } });
      } else {
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

  if (!sessionId) return null;

  if (fetching) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-gray-500">Loading your first question…</p>
      </div>
    );
  }

  const progressPercent = Math.round((currentIndex / totalQuestions) * 100);
  const isLastQuestion = currentIndex + 1 === totalQuestions;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-2xl mx-auto">

        {/* Header row */}
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-bold text-gray-900">Mock Interview</h1>
          <span className="text-sm font-semibold text-gray-500 bg-white border border-gray-200 px-3 py-1 rounded-full">
            {currentIndex + 1} / {totalQuestions}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-8 overflow-hidden">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Question card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-7 mb-6">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-3">
            Question {currentIndex + 1}
          </p>
          <p className="text-lg font-medium text-gray-900 leading-relaxed">{question}</p>
        </div>

        {/* Answer area */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-7 mb-6">
          <label htmlFor="answer" className="block text-sm font-semibold text-gray-700 mb-3">
            Your Answer
          </label>
          <textarea
            id="answer"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={9}
            disabled={loading}
            placeholder="Type your answer here… explain your approach, time complexity, and how you would solve it."
            className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white outline-none transition resize-y text-gray-900 placeholder-gray-400 disabled:opacity-60"
          />
          <p className="mt-2 text-xs text-gray-400">
            💡 Be specific — explain trade-offs, complexity, and edge cases where relevant.
          </p>
        </div>

        {error && (
          <div className="mb-5 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            <span>⚠️</span> {error}
          </div>
        )}

        <button
          id="submit-answer-btn"
          onClick={handleSubmit}
          disabled={loading || !answer.trim()}
          className="w-full py-3.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Evaluating your answer…
            </>
          ) : isLastQuestion ? (
            "Finish Interview ✓"
          ) : (
            "Next Question →"
          )}
        </button>
      </div>
    </div>
  );
}

export default Interview;
