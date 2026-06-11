// API service — axios client and placeholder functions for backend communication.
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000",
  timeout: 15000,
});

export const startInterview = async (topic, difficulty) => {
  try {
    const response = await api.post("/interview/start", { topic, difficulty });
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.detail ||
      error.message ||
      "Failed to start interview";
    throw new Error(message);
  }
};

export const submitAnswer = async (sessionId, question, answer) => {
  try {
    const response = await api.post("/interview/answer", {
      session_id: sessionId,
      question,
      answer,
    });
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.detail ||
      error.message ||
      "Failed to submit answer";
    throw new Error(message);
  }
};

export const getFeedback = async (sessionId) => {
  try {
    const response = await api.get(`/interview/feedback/${sessionId}`);
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.detail ||
      error.message ||
      "Failed to fetch feedback";
    throw new Error(message);
  }
};

export default api;
