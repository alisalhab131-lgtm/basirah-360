import React, { useState } from "react";
import axios from "axios";

const API_BASE = "https://basirah-backend-1.onrender.com";

export default function Login({ setToken }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(`${API_BASE}/api/auth/login`, {
        email,
        password,
      });

      const token = res.data.token;

      localStorage.setItem("token", token);
      setToken(token);

    } catch (err) {
      alert("Login failed");
    }
  };

  return (
    <div style={{
      height: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background: "#0a0a0a",
      color: "#fff"
    }}>
      <form onSubmit={handleLogin} style={{ padding: 30, background: "#121212", borderRadius: 10 }}>
        <h2>Login</h2>

        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ display: "block", margin: "10px 0", padding: 8 }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ display: "block", margin: "10px 0", padding: 8 }}
        />

        <button type="submit" style={{ padding: 10, width: "100%" }}>
          Login
        </button>
      </form>
    </div>
  );
}