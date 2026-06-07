import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import App from "./App.jsx";

const isAuth = () => !!localStorage.getItem("token");

export default function Router() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route
        path="/dashboard"
        element={isAuth() ? <App /> : <Navigate to="/" />}
      />
    </Routes>
  );
}