import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import App from "./App.jsx";

const isAuth = () => !!localStorage.getItem("token");

export default function Router() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          isAuth() ? <App /> : <Navigate to="/login" replace />
        }
      />

      {/* fallback */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}