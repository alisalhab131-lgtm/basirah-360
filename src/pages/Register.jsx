import React, { useState } from "react";
import axios from "axios";

const API_BASE = "https://basirah-backend-1.onrender.com";

export default function Register() {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "user",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post(`${API_BASE}/api/auth/register`, form);

      alert("User registered successfully! Please log in.");
      console.log(res.data);

      // Redirect to login after successful register
      window.location.href = "/login";
    } catch (err) {
      alert(err.response?.data?.message || "Register failed");
      console.error(err);
    }

    setLoading(false);
  };

  return (
    <div
      style={{
        maxWidth: "400px",
        margin: "100px auto",
        padding: "30px",
        border: "1px solid #ddd",
        borderRadius: "10px",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <h2>Create Account</h2>

      <form onSubmit={handleSubmit}>
        <input
          name="full_name"
          placeholder="Full Name"
          value={form.full_name}
          onChange={handleChange}
          required
          style={{ width: "100%", padding: "10px", boxSizing: "border-box" }}
        />
        <br />
        <br />

        <input
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
          style={{ width: "100%", padding: "10px", boxSizing: "border-box" }}
        />
        <br />
        <br />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
          style={{ width: "100%", padding: "10px", boxSizing: "border-box" }}
        />
        <br />
        <br />

        <button
          type="submit"
          disabled={loading}
          style={{ width: "100%", padding: "12px", cursor: "pointer" }}
        >
          {loading ? "Registering..." : "Register"}
        </button>
      </form>

      <br />

      <button
        onClick={() => (window.location.href = "/login")}
        style={{ width: "100%", padding: "12px", cursor: "pointer" }}
      >
        Back to Login
      </button>
    </div>
  );
}
