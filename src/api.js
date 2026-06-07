import axios from "axios";

const api = axios.create({
  baseURL: "https://basirah-backend-1.onrender.com",
});

export default api;