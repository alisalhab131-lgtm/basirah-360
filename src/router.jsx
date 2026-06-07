import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import App from "./App.jsx";

const isAuth = () => !!localStorage.getItem("token");

export default function Router() {
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
      <Route path="/login" element={<Login />} />

      {/* DASHBOARD (PROTECTED) */}
      <Route
        path="/dashboard"
        element={isAuth() ? <App /> : <Navigate to="/login" />}
      />

      {/* fallback */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}