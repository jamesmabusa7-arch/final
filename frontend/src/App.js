import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom";
import Lecturer from "./components/Lecturer";
import Student from "./components/Student";
import PRL from "./components/PRL";
import PL from "./components/PL";
import Login from "./components/Login";
import Register from "./components/Register";

export default function App() {
  const [user, setUser] = useState(null); // store logged in user info

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  return (
    <Router>
      <div className="container py-4">
        <h1 className="mb-4">LUCT Reporting App</h1>

        {/* Navigation */}
        <nav className="mb-4">
          {!user ? (
            <>
              <Link to="/login" className="btn btn-outline-primary me-2">
                Login
              </Link>
              <Link to="/register" className="btn btn-outline-secondary">
                Register
              </Link>
            </>
          ) : (
            <>
              {user.role === "lecturer" && (
                <Link to="/lecturer" className="btn btn-outline-primary me-2">
                  Lecturer
                </Link>
              )}
              {user.role === "student" && (
                <Link to="/student" className="btn btn-outline-success me-2">
                  Student
                </Link>
              )}
              {user.role === "prl" && (
                <Link to="/prl" className="btn btn-outline-warning me-2">
                  PRL
                </Link>
              )}
              {user.role === "pl" && (
                <Link to="/pl" className="btn btn-outline-dark me-2">
                  PL
                </Link>
              )}
              <button onClick={handleLogout} className="btn btn-outline-danger">
                Logout
              </button>
            </>
          )}
        </nav>

        {/* Page Content */}
        <Routes>
          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes */}
          <Route
            path="/lecturer"
            element={user?.role === "lecturer" ? <Lecturer /> : <Navigate to="/login" />}
          />
          <Route
            path="/student"
            element={user?.role === "student" ? <Student user={user} /> : <Navigate to="/login" />}
          />
          <Route
            path="/prl"
            element={user?.role === "prl" ? <PRL /> : <Navigate to="/login" />}
          />
          <Route
            path="/pl"
            element={user?.role === "pl" ? <PL /> : <Navigate to="/login" />}
          />

          {/* Default route */}
          <Route path="*" element={<Navigate to={user ? `/${user.role}` : "/login"} />} />
        </Routes>

        {/* Footer */}
        <footer style={{ marginTop: "2rem", textAlign: "center", borderTop: "1px solid #ddd", padding: "1rem 0", color: "#555" }}>
          <p>&copy; 2025 LUCT Reporting App. All rights reserved</p>
        </footer>
      </div>
    </Router>
  );
}
