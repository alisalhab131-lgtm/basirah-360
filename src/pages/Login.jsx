import React, { useState } from "react";
import axios from "axios";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(
        "https://basirah-backend-1.onrender.com/api/auth/login",
        {
          email,
          password,
        }
      );

      console.log("LOGIN RESPONSE:", res.data);

      const token = res.data.token;

      if (!token) {
        alert("No token received from backend");
        return;
      }

      localStorage.setItem("token", token);

      window.location.href = "/dashboard";
    } catch (err) {
      console.error("LOGIN ERROR:", err.response?.data || err.message);

      alert(
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Login failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: "400px",
        margin: "100px auto",
        padding: "30px",
        border: "1px solid #ddd",
        borderRadius: "10px",
      }}
    >
      <h2>Basirah 360 Login</h2>

      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", padding: "10px" }}
        />

        <br />
        <br />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", padding: "10px" }}
        />

        <br />
        <br />

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            cursor: "pointer",
          }}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      <br />

      <button
        onClick={() => (window.location.href = "/register")}
        style={{
          width: "100%",
          padding: "12px",
          cursor: "pointer",
        }}
      >
        Create Account
      </button>
    </div>
  );
}