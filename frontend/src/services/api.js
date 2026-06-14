// API service — axios client and functions for backend communication.
import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL,
  timeout: 30000,
});

// Attach JWT token from localStorage to every outgoing request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Auth ────────────────────────────────────────────────────────────────────

export const register = async (name, email, password) => {
  try {
    const response = await api.post("/auth/register", { name, email, password });
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.detail ||
      error.message ||
      "Registration failed";
    throw new Error(message);
  }
};

export const login = async (email, password) => {
  try {
    const response = await api.post("/auth/login", { email, password });
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.detail ||
      error.message ||
      "Login failed";
    throw new Error(message);
  }
};

// ── Interview ────────────────────────────────────────────────────────────────

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

export const getHistory = async () => {
  try {
    const response = await api.get("/interview/history");
    return response.data;
  } catch (error) {
    const message =
      error.response?.data?.detail ||
      error.message ||
      "Failed to fetch interview history";
    throw new Error(message);
  }
};

export default api;
