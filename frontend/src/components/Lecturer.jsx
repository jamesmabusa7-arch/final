import React, { useState, useEffect } from "react";

export default function Lecturer() {
  const [form, setForm] = useState({
    faculty: "",
    className: "",
    weekOfReporting: "",
    dateOfLecture: "",
    courseName: "",
    courseCode: "",
    lecturerName: "",
    actualPresent: "",
    totalRegistered: "",
    venue: "",
    scheduledTime: "",
    topicTaught: "",
    learningOutcomes: "",
    recommendations: "",
  });
  const [reports, setReports] = useState([]);
  const [msg, setMsg] = useState("");

  // Load reports
  const fetchReports = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/reports");
      const data = await res.json();
      if (Array.isArray(data)) setReports(data);
    } catch (err) {
      console.error(err);
      setMsg("❌ Failed to load reports");
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // Handle form change
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5000/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setMsg("✅ Report submitted successfully");
        setForm({
          faculty: "",
          className: "",
          weekOfReporting: "",
          dateOfLecture: "",
          courseName: "",
          courseCode: "",
          lecturerName: "",
          actualPresent: "",
          totalRegistered: "",
          venue: "",
          scheduledTime: "",
          topicTaught: "",
          learningOutcomes: "",
          recommendations: "",
        });
        fetchReports(); // reload reports
      } else {
        setMsg("❌ Submit failed");
      }
    } catch (err) {
      console.error(err);
      setMsg("❌ Error submitting report");
    }
  };

  return (
    <div>
      <h2 className="mb-4"> Lecturer Dashboard</h2>
      {msg && <div className="alert alert-info">{msg}</div>}

      {/* Report Form */}
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-primary text-white">
          <h5 className="mb-0"> Submit New Report</h5>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit} className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Faculty Name</label>
              <input
                name="faculty"
                value={form.faculty}
                onChange={handleChange}
                className="form-control"
                required
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Class Name</label>
              <input
                name="className"
                value={form.className}
                onChange={handleChange}
                className="form-control"
                required
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Week of Reporting</label>
              <input
                name="weekOfReporting"
                value={form.weekOfReporting}
                onChange={handleChange}
                className="form-control"
                required
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Date of Lecture</label>
              <input
                type="date"
                name="dateOfLecture"
                value={form.dateOfLecture}
                onChange={handleChange}
                className="form-control"
                required
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Course Name</label>
              <input
                name="courseName"
                value={form.courseName}
                onChange={handleChange}
                className="form-control"
                required
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Course Code</label>
              <input
                name="courseCode"
                value={form.courseCode}
                onChange={handleChange}
                className="form-control"
                required
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Lecturer's Name</label>
              <input
                name="lecturerName"
                value={form.lecturerName}
                onChange={handleChange}
                className="form-control"
                required
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Actual Number Present</label>
              <input
                type="number"
                name="actualPresent"
                value={form.actualPresent}
                onChange={handleChange}
                className="form-control"
                required
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Total Registered Students</label>
              <input
                type="number"
                name="totalRegistered"
                value={form.totalRegistered}
                onChange={handleChange}
                className="form-control"
                required
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Venue</label>
              <input
                name="venue"
                value={form.venue}
                onChange={handleChange}
                className="form-control"
                required
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Scheduled Lecture Time</label>
              <input
                name="scheduledTime"
                value={form.scheduledTime}
                onChange={handleChange}
                className="form-control"
                placeholder="e.g. 09:00 - 10:30"
              />
            </div>
            <div className="col-12">
              <label className="form-label">Topic Taught</label>
              <input
                name="topicTaught"
                value={form.topicTaught}
                onChange={handleChange}
                className="form-control"
              />
            </div>
            <div className="col-12">
              <label className="form-label">Learning Outcomes</label>
              <textarea
                name="learningOutcomes"
                value={form.learningOutcomes}
                onChange={handleChange}
                className="form-control"
                rows="3"
              ></textarea>
            </div>
            <div className="col-12">
              <label className="form-label">Lecturer's Recommendations</label>
              <textarea
                name="recommendations"
                value={form.recommendations}
                onChange={handleChange}
                className="form-control"
                rows="3"
              ></textarea>
            </div>
            <div className="col-12 text-end">
              <button className="btn btn-primary">Submit Report</button>
            </div>
          </form>
        </div>
      </div>

      {/* Submitted Reports */}
      <h3 className="mb-3"> Submitted Reports</h3>
      {reports.length === 0 ? (
        <p>No reports submitted yet.</p>
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
                  <p className="card-text">
                    <strong>Topic:</strong> {r.topic_taught} <br />
                    <strong>Class:</strong> {r.class_name} <br />
                    <strong>Faculty:</strong> {r.faculty} <br />
                    <strong>Present:</strong> {r.actual_present} / {r.total_registered}
                  </p>
                </div>
                <div className="card-footer text-end">
                  <small className="text-muted">
                    Week {r.week_of_reporting}
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
