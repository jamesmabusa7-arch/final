import React, { useEffect, useState } from "react";

export default function Student() {
  const [reports, setReports] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [feedbacks, setFeedbacks] = useState({});
  const [msg, setMsg] = useState("");
  
  // Base API URL - will use environment variable in production
  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

  // Get student ID from logged-in user
  const getStudentId = () => {
    const user = JSON.parse(localStorage.getItem("user"));
    return user ? user.id : 1; // Fallback to 1 if no user found
  };

  // Load reports and ratings
  useEffect(() => {
    const token = localStorage.getItem("token");
    const headers = {
      "Authorization": `Bearer ${token}`
    };

    fetch(`${API_BASE}/api/reports`, { headers })
      .then((res) => res.json())
      .then((data) => setReports(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error(err);
        setMsg("❌ Failed to load reports");
      });

    fetch(`${API_BASE}/api/ratings`, { headers })
      .then((res) => res.json())
      .then((data) => setRatings(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Ratings load error", err));
  }, []);

  // Submit rating
  const submitRating = async (reportId, rating, feedback) => {
    try {
      const token = localStorage.getItem("token");
      const studentId = getStudentId();
      
      const res = await fetch(`${API_BASE}/api/ratings`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ reportId, rating, feedback, studentId }),
      });
      
      if (res.ok) {
        setMsg("✅ Rating submitted successfully!");
        // reload ratings
        const newRatings = await fetch(`${API_BASE}/api/ratings`, {
          headers: { "Authorization": `Bearer ${token}` }
        }).then((res) => res.json());
        setRatings(newRatings);
      } else {
        const errMsg = await res.json();
        setMsg("❌ Failed: " + (errMsg.error || "Unknown error"));
      }
    } catch (err) {
      setMsg("❌ Error: " + err.message);
    }
  };

  // Save feedback
  const saveFeedback = async (reportId, feedbackText, topic) => {
    if (!feedbackText.trim()) {
      setMsg("❌ Please enter some feedback");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const studentId = getStudentId();
      
      const res = await fetch(`${API_BASE}/api/feedback`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
          reportId, 
          feedback: feedbackText, 
          topic: topic || "",
          studentId 
        }),
      });
      
      if (res.ok) {
        setMsg("✅ Feedback saved successfully!");
        // Clear the feedback input
        setFeedbacks({
          ...feedbacks,
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

  // Find existing rating for a report
  const getMyRating = (reportId) => {
    const studentId = getStudentId();
    return ratings.find((r) => r.report_id === reportId && r.student_id === studentId);
  };

  return (
    <div>
      <h2 className="mb-4">🎓 Student Dashboard</h2>
      {msg && <div className="alert alert-info">{msg}</div>}

      {reports.length === 0 ? (
        <p>No reports found</p>
      ) : (
        <div className="row">
          {reports.map((r) => {
            const myRating = getMyRating(r.id);
            const attendancePct =
              r.total_registered > 0
                ? Math.round((r.actual_present / r.total_registered) * 100)
                : 0;

            return (
              <div key={r.id} className="col-md-6 col-lg-4 mb-4">
                <div className="card shadow-sm h-100">
                  <div className="card-body">
                    <h5 className="card-title">{r.course_name}</h5>
                    <h6 className="card-subtitle mb-2 text-muted">
                      {r.course_code} | {new Date(r.date_of_lecture).toLocaleDateString()}
                    </h6>
                    
                    {/* Week Display */}
                    <div className="mb-2">
                      <small className="text-muted">
                        {r.week_of_reporting.includes('Week') ? r.week_of_reporting : `Week ${r.week_of_reporting}`}
                      </small>
                    </div>

                    <p className="card-text">
                      <strong>Lecturer:</strong> {r.lecturer_name} <br />
                      <strong>Topic:</strong> {r.topic_taught || 'Not specified'}
                    </p>

                    {/* Attendance progress bar */}
                    <div className="mb-3">
                      <label className="form-label">
                        Attendance: {r.actual_present}/{r.total_registered} (
                        {attendancePct}%)
                      </label>
                      <div className="progress">
                        <div
                          className={`progress-bar ${
                            attendancePct < 50
                              ? "bg-danger"
                              : attendancePct < 75
                              ? "bg-warning"
                              : "bg-success"
                          }`}
                          role="progressbar"
                          style={{ width: `${attendancePct}%` }}
                        >
                          {attendancePct}%
                        </div>
                      </div>
                    </div>

                    {/* Feedback Section - This matches your screenshot */}
                    <div className="mb-3">
                      <label className="form-label"><strong>Feedback</strong></label>
                      <textarea
                        className="form-control mb-2"
                        placeholder="Enter your feedback here..."
                        rows="3"
                        value={feedbacks[r.id] || ""}
                        onChange={(e) => setFeedbacks({
                          ...feedbacks,
                          [r.id]: e.target.value
                        })}
                      />
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => saveFeedback(r.id, feedbacks[r.id], r.topic_taught)}
                      >
                        Save Feedback
                      </button>
                    </div>

                    {/* Rating section */}
                    {myRating ? (
                      <div className="alert alert-success p-2">
                        <strong>Your Rating:</strong> ⭐ {myRating.rating} <br />
                        <em>{myRating.feedback}</em>
                      </div>
                    ) : (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const formData = new FormData(e.target);
                          submitRating(
                            r.id,
                            formData.get("rating"),
                            formData.get("feedback")
                          );
                          e.target.reset();
                        }}
                      >
                        <div className="mb-2">
                          <label className="form-label">Rate Lecture</label>
                          <input
                            type="number"
                            name="rating"
                            min="1"
                            max="5"
                            defaultValue="5"
                            className="form-control"
                            required
                          />
                        </div>
                        <div className="mb-2">
                          <textarea
                            name="feedback"
                            placeholder="Enter rating feedback"
                            className="form-control"
                          />
                        </div>
                        <button className="btn btn-outline-primary btn-sm">
                          Submit Rating
                        </button>
                      </form>
                    )}
                  </div>
                  <div className="card-footer text-end">
                    <small className="text-muted">
                      {r.venue && `Venue: ${r.venue}`}
                    </small>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}