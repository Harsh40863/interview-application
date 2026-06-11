// Results page — displays interview feedback and performance summary.
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const evaluation = location.state?.evaluation;

  useEffect(() => {
    if (!evaluation) {
      navigate("/");
    }
  }, [evaluation, navigate]);

  if (!evaluation) {
    return null;
  }

  const { score, feedback, improvements } = evaluation;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Interview Results</h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-sm font-medium text-gray-500 mb-2">Score</h2>
          <p className="text-4xl font-bold text-blue-600">{score} / 10</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-sm font-medium text-gray-500 mb-2">Feedback</h2>
          <p className="text-gray-900 leading-relaxed">{feedback}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-sm font-medium text-gray-500 mb-2">Improvements</h2>
          <p className="text-gray-900 leading-relaxed">{improvements}</p>
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
