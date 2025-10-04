import React, { useEffect, useState } from "react";

export default function PL() {
  const [courses, setCourses] = useState([]);
  const [reports, setReports] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [form, setForm] = useState({ name: "", code: "", lecturerId: "" });
  const [editingCourse, setEditingCourse] = useState(null);
  const [feedback, setFeedback] = useState({});
  const [msg, setMsg] = useState("");

  const API_BASE = "http://localhost:5000/api";

  // ---------------- FETCH DATA ----------------
  useEffect(() => {
    // Load courses
    fetch(`${API_BASE}/courses`)
      .then((res) => res.json())
      .then((data) => setCourses(Array.isArray(data) ? data : []))
      .catch((err) => setMsg("❌ Failed to load courses: " + err.message));

    // Load reports
    fetch(`${API_BASE}/reports`)
      .then((res) => res.json())
      .then((data) => setReports(Array.isArray(data) ? data : []))
      .catch((err) => setMsg("❌ Failed to load reports: " + err.message));

    // Load lecturers
    fetch(`${API_BASE}/users?role=lecturer`)
      .then((res) => res.json())
      .then((data) => setLecturers(Array.isArray(data) ? data : []))
      .catch((err) => setMsg("❌ Failed to load lecturers: " + err.message));
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleFeedbackChange = (id, value) =>
    setFeedback({ ...feedback, [id]: value });

  // ---------------- COURSES ----------------
  const addCourse = async (e) => {
    e.preventDefault();
    if (!form.name || !form.code) {
      return setMsg("❌ Name and code are required");
    }
    try {
      const res = await fetch(`${API_BASE}/courses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to add course");
      const newCourse = await res.json();
      setCourses([...courses, newCourse]);
      setForm({ name: "", code: "", lecturerId: "" });
      setMsg("✅ Course added");
    } catch (err) {
      setMsg("❌ " + err.message);
    }
  };

  const updateCourse = async (courseId) => {
    if (!editingCourse.name || !editingCourse.code) {
      return setMsg("❌ Name and code are required");
    }
    try {
      const res = await fetch(`${API_BASE}/courses/${courseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingCourse),
      });
      if (!res.ok) throw new Error("Failed to update course");
      setCourses(
        courses.map((c) =>
          c.id === courseId ? { ...c, ...editingCourse } : c
        )
      );
      setEditingCourse(null);
      setMsg("✅ Course updated");
    } catch (err) {
      setMsg("❌ " + err.message);
    }
  };

  // ---------------- FEEDBACK ----------------
  const submitFeedback = async (reportId) => {
    if (!feedback[reportId] || !feedback[reportId].trim()) {
      setMsg("❌ Please enter some feedback");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          reportId: reportId,
          feedback: feedback[reportId],
          topic: "", // You can add topic input if needed
          studentId: null // PL feedback doesn't need student ID
        }),
      });
      
      if (res.ok) {
        setMsg("✅ Feedback saved successfully!");
        // Clear the feedback input
        setFeedback({
          ...feedback,
          [reportId]: ""
        });
      } else {
        const errMsg = await res.json();
        setMsg("❌ Failed to save feedback: " + (errMsg.error || "Unknown error"));
      }
    } catch (err) {
      setMsg("❌ Error saving feedback: " + err.message);
    }
  };

  return (
    <div>
      <h2 className="mb-4">📘 Program Leader (PL) Dashboard</h2>
      {msg && <div className="alert alert-info">{msg}</div>}

      {/* Add Course Form */}
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-dark text-white">
          <h5 className="mb-0">➕ Add New Course</h5>
        </div>
        <div className="card-body">
          <form onSubmit={addCourse}>
            <div className="mb-3">
              <label className="form-label">Course Name</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className="form-control"
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Course Code</label>
              <input
                name="code"
                value={form.code}
                onChange={handleChange}
                className="form-control"
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Assign Lecturer</label>
              <select
                name="lecturerId"
                className="form-select"
                value={form.lecturerId}
                onChange={handleChange}
              >
                <option value="">-- Select Lecturer --</option>
                {lecturers.map((lec) => (
                  <option key={lec.id} value={lec.id}>
                    {lec.username}
                  </option>
                ))}
              </select>
            </div>
            <button className="btn btn-primary">Add Course</button>
          </form>
        </div>
      </div>

      {/* Courses List */}
      <h3 className="mb-3">📚 Courses</h3>
      {courses.length === 0 ? (
        <p>No courses available</p>
      ) : (
        <div className="row">
          {courses.map((c) => (
            <div key={c.id} className="col-md-6 col-lg-4 mb-4">
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  {editingCourse?.id === c.id ? (
                    <>
                      <input
                        name="name"
                        value={editingCourse.name}
                        onChange={(e) =>
                          setEditingCourse({
                            ...editingCourse,
                            [e.target.name]: e.target.value,
                          })
                        }
                        className="form-control mb-2"
                      />
                      <input
                        name="code"
                        value={editingCourse.code}
                        onChange={(e) =>
                          setEditingCourse({
                            ...editingCourse,
                            [e.target.name]: e.target.value,
                          })
                        }
                        className="form-control mb-2"
                      />
                      <select
                        name="lecturerId"
                        className="form-select mb-2"
                        value={editingCourse.lecturerId}
                        onChange={(e) =>
                          setEditingCourse({
                            ...editingCourse,
                            lecturerId: e.target.value,
                          })
                        }
                      >
                        <option value="">-- Select Lecturer --</option>
                        {lecturers.map((lec) => (
                          <option key={lec.id} value={lec.id}>
                            {lec.username}
                          </option>
                        ))}
                      </select>
                      <button
                        className="btn btn-success btn-sm me-2"
                        onClick={() => updateCourse(c.id)}
                      >
                        Save
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setEditingCourse(null)}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <h5 className="card-title">{c.name}</h5>
                      <h6 className="card-subtitle mb-2 text-muted">
                        {c.code}
                      </h6>
                      <p className="card-text">
                        Lecturer:{" "}
                        {lecturers.find((lec) => lec.id === c.lecturer_id)
                          ?.username || "Unassigned"}
                      </p>
                      <button
                        className="btn btn-outline-primary btn-sm"
                        onClick={() => setEditingCourse(c)}
                      >
                        Edit
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reports Overview with Feedback */}
      <h3 className="mb-3">📋 Reports Overview</h3>
      {reports.length === 0 ? (
        <p>No reports available</p>
      ) : (
        <div className="row">
          {reports.map((r) => (
            <div key={r.id} className="col-md-6 col-lg-4 mb-4">
              <div className="card shadow-sm h-100">
                <div className="card-body">
                  <h5 className="card-title">{r.course_name}</h5>
                  <h6 className="card-subtitle mb-2 text-muted">
                    {r.course_code} | {r.date_of_lecture}
                  </h6>
                  
                  {/* Week Display */}
                  <div className="mb-2">
                    <small className="text-muted">
                      {r.week_of_reporting.includes('Week') ? r.week_of_reporting : `Week ${r.week_of_reporting}`}
                    </small>
                  </div>

                  <p className="card-text">
                    <strong>Topic:</strong> {r.topic_taught || 'Not specified'} <br />
                    <strong>Lecturer:</strong> {r.lecturer_name}
                  </p>

                  {/* Feedback Section */}
                  <div className="mt-3">
                    <label className="form-label"><strong>PL Feedback</strong></label>
                    <textarea
                      className="form-control mb-2"
                      value={feedback[r.id] || ""}
                      onChange={(e) => handleFeedbackChange(r.id, e.target.value)}
                      placeholder="Enter your feedback as Program Leader..."
                      rows="3"
                    />
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => submitFeedback(r.id)}
                    >
                      Save Feedback
                    </button>
                  </div>
                </div>
                <div className="card-footer text-end">
                  <small className="text-muted">
                    {r.venue && `Venue: ${r.venue}`}
                  </small>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}