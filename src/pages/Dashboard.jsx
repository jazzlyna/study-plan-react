
import React, { useState, useEffect } from "react";
import { api } from "../utils/api";
import "./Dashboard.css";

function Dashboard({ user }) {
  const [courses, setCourses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTable, setActiveTable] = useState("inprogress"); // Default to in-progress table

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initial data fetch
  useEffect(() => {
    if (!user?.student_id) return;

    const fetchInitialData = async () => {
      try {
        setLoading(true);
        
        // Fetch summary data
        const summaryData = await api.getCourseSummary(user.student_id);
        setSummary(summaryData);
        
        // Fetch course list for the table
        const courseData = await api.getCourseList(user.student_id);
        setCourses(Array.isArray(courseData) ? courseData : []);
        
        setLoading(false);
      } catch (err) {
        console.error("Dashboard Fetch Error:", err);
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [user?.student_id]);

  const todoList = courses.filter((c) => c.status === "Planned");
  const currentList = courses.filter((c) => c.status === "Current");

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";

  if (!user) return <div className="loading">Loading Profile...</div>;

  if (loading) {
    return (
      <div className="dashboard-wrapper container">
        <div className="dashboard-header">
          <h2 className="dashboard-title">
            {greeting}, {user.student_name || "Student"}
          </h2>
          <p style={{ color: "var(--text-secondary)", marginTop: "10px" }}>
            Loading academic overview...
          </p>
        </div>
        <div className="stats-grid">
          <div className="skeleton" style={{ height: "140px", borderRadius: "1rem" }}></div>
          <div className="skeleton" style={{ height: "140px", borderRadius: "1rem" }}></div>
          <div className="skeleton" style={{ height: "140px", borderRadius: "1rem" }}></div>
          <div className="skeleton" style={{ height: "140px", borderRadius: "1rem" }}></div>
        </div>
      </div>
    );
  }

  // Determine which table data to show
  const tableData = activeTable === "todo" ? todoList : currentList;
  const tableTitle = activeTable === "todo" ? "Planned Courses" : "In Progress Courses";
  const hasCoursesToShow = tableData.length > 0;

  return (
    <div className="dashboard-wrapper container">
      <div className="dashboard-header">
        <h2 className="dashboard-title">
          {greeting}, {user.student_name || "Student"}
        </h2>
        <p style={{ color: "var(--text-secondary)", marginTop: "10px", fontSize: isMobile ? "14px" : "16px" }}>
          Academic Overview
        </p>
      </div>

      {/* Stats Grid - ALWAYS SHOWN */}
      <div className={`stats-grid ${isMobile ? 'mobile-grid' : ''}`}>
        <div 
          className={`stat-card glass-card clickable ${activeTable === 'todo' ? 'active-card' : ''}`} 
          onClick={() => setActiveTable("todo")}
          style={isMobile ? styles.mobileCard : {}}
        >
          <h4 style={isMobile ? styles.mobileCardTitle : {}}>PLANNED</h4>
          <p className="stat-number">{summary?.count_planned_course ?? "0"}</p>
          <span>View Details →</span>
        </div>

        <div 
          className={`stat-card glass-card clickable ${activeTable === 'inprogress' ? 'active-card' : ''}`} 
          onClick={() => setActiveTable("inprogress")}
          style={isMobile ? styles.mobileCard : {}}
        >
          <h4 style={isMobile ? styles.mobileCardTitle : {}}>IN PROGRESS</h4>
          <p className="stat-number">{summary?.count_current_course ?? "0"}</p>
          <span>View Details →</span>
        </div>

        <div className="stat-card glass-card" style={isMobile ? styles.mobileCard : {}}>
          <h4 style={isMobile ? styles.mobileCardTitle : {}}>GRADUATE ON TIME</h4>
          <p className="stat-number" style={{ color: "#ffb74d" }}>
            {user.student_GOT || "N/A"}
          </p>
        </div>

        <div className="stat-card glass-card" style={isMobile ? styles.mobileCard : {}}>
          <h4 style={isMobile ? styles.mobileCardTitle : {}}>CURRENT CGPA</h4>
          <p className="stat-number" style={{ color: "#81c784" }}>
            {summary?.student_cgpa?.toFixed(2) ?? "0.00"}
          </p>
        </div>
      </div>

      {/* ALWAYS SHOW TABLE - Default to In Progress */}
      <div className="glass-card dashboard-content animate-fade-in" style={{ marginTop: "20px", padding: isMobile ? "20px" : "30px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
          <h3 style={{ color: "var(--text-color)", margin: 0, fontSize: isMobile ? "20px" : "24px" }}>
            {tableTitle}
          </h3>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            {/* Table type toggle */}
            <button 
              onClick={() => setActiveTable("todo")}
              style={{
                ...styles.tabButton,
                ...(activeTable === "todo" ? styles.activeTabButton : {}),
                fontSize: isMobile ? "12px" : "14px"
              }}
            >
              Show Planned
            </button>
            <button 
              onClick={() => setActiveTable("inprogress")}
              style={{
                ...styles.tabButton,
                ...(activeTable === "inprogress" ? styles.activeTabButton : {}),
                fontSize: isMobile ? "12px" : "14px"
              }}
            >
              Show In Progress
            </button>
          </div>
        </div>
        
        {hasCoursesToShow ? (
          <div className="table-responsive">
            <table className="course-table">
              <thead>
                <tr>
                  <th>CODE</th>
                  <th>COURSE NAME</th>
                  <th style={{ textAlign: "center" }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((c, index) => (
                  <tr key={index}>
                    <td><strong>{c.course_code}</strong></td>
                    <td style={isMobile ? styles.mobileCourseName : {}}>{c.COURSE?.course_name || c.course_name}</td>
                    <td style={{ textAlign: "center" }}>
                      <span className={`badge ${c.status}`}>{c.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>
            <p>No {activeTable === "todo" ? "planned" : "in progress"} courses found.</p>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  mobileCard: {
    padding: "25px 15px",
    minHeight: "120px",
  },
  mobileCardTitle: {
    fontSize: "12px",
    letterSpacing: "1px",
  },
  tabButton: {
    padding: "10px 16px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid var(--border-color)",
    color: "var(--text-color)",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "500",
    transition: "all 0.3s ease",
  },
  activeTabButton: {
    background: "rgba(99, 102, 241, 0.15)",
    color: "var(--primary)",
    border: "1px solid rgba(99, 102, 241, 0.3)",
  },
  mobileCourseName: {
    fontSize: "14px",
    maxWidth: "150px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
};

export default Dashboard;
