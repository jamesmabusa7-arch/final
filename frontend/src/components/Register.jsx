import React, { useState } from "react";

export default function Register() {
  const [form, setForm] = useState({ username: "", password: "", role: "student" });
  const [msg, setMsg] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");

    try {
      const res = await fetch("http://localhost:5000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "❌ Registration failed");
        return;
      }

      setMsg("✅ Registration successful! You can now login.");
      setForm({ username: "", password: "", role: "student" });
    } catch (err) {
      console.error(err);
      setMsg("❌ Server error");
    }
  };

  return (
    <div>
      <h2>Register</h2>
      {msg && <p>{msg}</p>}
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label>Username</label>
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
          <label>Password</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            className="form-control"
            required
          />
        </div>
        <div className="mb-3">
          <label>Role</label>
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className="form-select"
          >
            <option value="student">Student</option>
            <option value="lecturer">Lecturer</option>
            <option value="prl">PRL</option>
            <option value="pl">PL</option>
          </select>
        </div>
        <button type="submit" className="btn btn-success">
          Register
        </button>
      </form>
    </div>
  );
}
