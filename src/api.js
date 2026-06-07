import axios from "axios";

export const API_BASE = "https://basirah-backend-1.onrender.com";

export const api = axios.create({
  baseURL: API_BASE
});

// attach token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});