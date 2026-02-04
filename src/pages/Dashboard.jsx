import React, { useState, useEffect } from "react";
import { api } from "../utils/api";
import "./Dashboard.css";

function Dashboard({ user }) {
  const [view, setView] = useState("summary");
  const [courses, setCourses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Initial Fetch: Summary
  useEffect(() => {
    if (!user?.student_id) return;

    api.getCourseSummary(user.student_id)
      .then((data) => {
        setSummary(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Summary Fetch Error:", err);
        setLoading(false);
      });
  }, [user?.student_id]);

  // 2. Secondary Fetch: Triggered when user clicks a card
  useEffect(() => {
    if (view !== "summary" && courses.length === 0) {
      api.getCourseList(user.student_id)
        .then((data) => setCourses(Array.isArray(data) ? data : []))
        .catch((err) => console.error("Full List Fetch Error:", err));
    }
  }, [view, user?.student_id, courses.length]);

  const todoList = courses.filter((c) => c.status === "Planned");
  const currentList = courses.filter((c) => c.status === "Current");

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";

  if (!user) return <div className="loading">Loading Profile...</div>;

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-header">
        <h2 className="dashboard-title">
          {greeting}, {user.student_name || "Student"}
        </h2>
        <p style={{ color: "rgba(255,255,255,0.5)", marginTop: "-10px" }}>
          Academic Overview
        </p>
      </div>

      <div className="stats-grid">
        <div 
          className={`stat-card glass-card clickable ${view === 'todo' ? 'active-card' : ''}`} 
          onClick={() => setView("todo")}
        >
          <h4>PLANNED</h4>
          <p className="stat-number">{summary?.count_planned_course ?? "..."}</p>
          <span>View Details →</span>
        </div>

        <div 
          className={`stat-card glass-card clickable ${view === 'inprogress' ? 'active-card' : ''}`} 
          onClick={() => setView("inprogress")}
        >
          <h4>IN PROGRESS</h4>
          <p className="stat-number">{summary?.count_current_course ?? "..."}</p>
          <span>View Details →</span>
        </div>

        <div className="stat-card glass-card">
          <h4>GRADUATE ON TIME</h4>
          <p style={{ fontSize: "1.4rem", marginTop: "15px", fontWeight: "bold", color: "#ffb74d" }}>
            {user.student_GOT || "N/A"}
          </p>
        </div>

        <div className="stat-card glass-card">
          <h4>CURRENT CGPA</h4>
          <p className="stat-number" style={{ color: "#81c784" }}>
            {summary?.student_cgpa?.toFixed(2) ?? "0.00"}
          </p>
        </div>
      </div>

      {view !== "summary" && (
        <div className="glass-card dashboard-content animate-fade-in" style={{ marginTop: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h3 style={{ color: "white", margin: 0 }}>
              {view === "todo" ? "Planned Courses" : "Current Courses"}
            </h3>
            <button onClick={() => setView("summary")} style={styles.backBtn}>
              Back to Overview
            </button>
          </div>
          
          <table className="course-table">
            <thead>
              <tr>
                <th>CODE</th>
                <th>COURSE NAME</th>
                <th style={{ textAlign: "center" }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {(view === "todo" ? todoList : currentList).map((c, index) => (
                <tr key={index}>
                  <td><strong>{c.course_code}</strong></td>
                  <td>{c.COURSE?.course_name || c.course_name}</td>
                  <td style={{ textAlign: "center" }}>
                    <span className={`badge ${c.status}`}>{c.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const styles = {
  backBtn: {
    padding: "8px 16px",
    background: "rgba(255,255,255,0.1)",
    border: "1px solid rgba(255,255,255,0.2)",
    color: "white",
    borderRadius: "6px",
    cursor: "pointer"
  }
};

export default Dashboard;