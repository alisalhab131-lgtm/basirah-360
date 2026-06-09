import { Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";

import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import App from "./App.jsx";

export default function Router() {
  const [token, setToken] = useState(localStorage.getItem("token"));

  const isAuth = () => !!token;

  return (
    <Routes>
      {/* DEFAULT ENTRY */}
      <Route
        path="/"
        element={
          isAuth() ? <Navigate to="/dashboard" /> : <Navigate to="/login" />
        }
      />

      {/* LOGIN */}
      <Route
        path="/login"
        element={<Login setToken={setToken} />}
      />

      {/* REGISTER */}
      <Route path="/register" element={<Register />} />

      {/* DASHBOARD */}
      <Route
        path="/dashboard"
        element={isAuth() ? <App /> : <Navigate to="/login" />}
      />

      {/* fallback */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}