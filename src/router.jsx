import { Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";

import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import App from "./App.jsx";

export default function Router() {
  const [token, setToken] = useState(localStorage.getItem("token"));

  // Keep token state in sync if localStorage changes (e.g. logout in another tab)
  useEffect(() => {
    const syncToken = () => setToken(localStorage.getItem("token"));
    window.addEventListener("storage", syncToken);
    return () => window.removeEventListener("storage", syncToken);
  }, []);

  const isAuth = () => !!token;

  return (
    <Routes>
      {/* DEFAULT ENTRY */}
      <Route
        path="/"
        element={isAuth() ? <Navigate to="/dashboard" /> : <Navigate to="/login" />}
      />

      {/* LOGIN */}
      <Route
        path="/login"
        element={<Login setToken={setToken} />}
      />

      {/* REGISTER */}
      <Route path="/register" element={<Register />} />

      {/* DASHBOARD - passes setToken so App can handle logout */}
      <Route
        path="/dashboard"
        element={isAuth() ? <App setToken={setToken} /> : <Navigate to="/login" />}
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
