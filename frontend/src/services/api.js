// API service — axios client and functions for backend communication.
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000",
  timeout: 30000,
});

export const getQuestion = async (sessionId) => {
  try {
    const response = await api.get(`/interview/question/${sessionId}`);
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.detail ||
      error.message ||
      "Failed to get question";
    throw new Error(message);
  }
};

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

export const submitAnswer = async (sessionId, answer) => {
  try {
    const response = await api.post("/interview/answer", {
      session_id: sessionId,
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

export const getResults = async (sessionId) => {
  try {
    const response = await api.get(`/interview/results/${sessionId}`);
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.detail ||
      error.message ||
      "Failed to fetch results";
    throw new Error(message);
  }
};

export default api;
