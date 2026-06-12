import { Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import App from "./App.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";

export default function Router() {
  const [token, setToken] = useState(localStorage.getItem("token"));

  useEffect(() => {
    const syncToken = () => setToken(localStorage.getItem("token"));
    window.addEventListener("storage", syncToken);
    return () => window.removeEventListener("storage", syncToken);
  }, []);

  const isAuth = () => !!token;

  return (
    <Routes>
      <Route path="/" element={isAuth() ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
      <Route path="/login" element={<Login setToken={setToken} />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={isAuth() ? <App setToken={setToken} /> : <Navigate to="/login" />} />
      <Route path="/dashboard/*" element={isAuth() ? <App setToken={setToken} /> : <Navigate to="/login" />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}