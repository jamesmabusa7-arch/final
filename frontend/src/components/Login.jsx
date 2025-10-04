import React, { useState } from "react";

// Base API URL - will use environment variable in production
const API_BASE = process.env.REACT_API_URL || "http://localhost:5000";

export default function Login({ setUser }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [msg, setMsg] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");

    try {
      const res = await fetch(`${API_BASE}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "❌ Login failed");
        return;
      }

      // save user
      const user = {
        id: data.userId,
        role: data.role,
        token: data.token,
        username: data.username
      };
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("token", data.token); // Also store token separately for API calls
      setUser(user);
      setMsg("✅ Login successful!");
    } catch (err) {
      console.error(err);
      setMsg("❌ Server error - cannot connect to backend");
    }
  };

  return (
    <div>
      <h2>Login</h2>
      {msg && <div className={`alert ${msg.includes('✅') ? 'alert-success' : 'alert-danger'}`}>{msg}</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Username</label>
          <input
            type="text"
            name="username"
            value={form.username}
            onChange={handleChange}
            className="form-control"
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Password</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            className="form-control"
            required
          />
        </div>
        <button type="submit" className="btn btn-primary">
          Login
        </button>
      </form>
    </div>
  );
}