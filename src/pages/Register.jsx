import React, { useState } from "react";
import axios from "axios";

const API_BASE = "https://basirah-backend-1.onrender.com";

export default function Register() {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "user"
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post(
        `${API_BASE}/api/auth/register`,
        form
      );

      alert("User registered successfully!");
      console.log(res.data);

      // optional reset
      setForm({
        full_name: "",
        email: "",
        password: "",
        role: "user"
      });

    } catch (err) {
      alert(err.response?.data?.message || "Register failed");
      console.error(err);
    }

    setLoading(false);
  };

  return (
    <div style={{ padding: 30 }}>
      <h2>Register</h2>

      <form onSubmit={handleSubmit}>
        <input
          name="full_name"
          placeholder="Full Name"
          value={form.full_name}
          onChange={handleChange}
          required
        />
        <br /><br />

        <input
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
        />
        <br /><br />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
        />
        <br /><br />

        <button type="submit" disabled={loading}>
          {loading ? "Registering..." : "Register"}
        </button>
      </form>
    </div>
  );
}