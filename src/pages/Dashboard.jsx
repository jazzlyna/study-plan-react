import React, { useState, useEffect } from "react";
import { api } from "../utils/api";
import "./Dashboard.css";

function Dashboard({ user }) {
  const [plannedCourses, setPlannedCourses] = useState([]);
  const [currentCourses, setCurrentCourses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("current");
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch data
  useEffect(() => {
    if (!user?.student_id) return;

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        const summaryData = await api.getCourseSummary(user.student_id);
        setSummary(summaryData);
        
        try {
          const [plannedData, currentData] = await Promise.all([
            api.getPlannedCourse ? api.getPlannedCourse(user.student_id) : Promise.resolve([]),
            api.getCurrentCourse ? api.getCurrentCourse(user.student_id) : Promise.resolve([])
          ]);
          
          if (plannedData.length > 0 || currentData.length > 0) {
            setPlannedCourses(Array.isArray(plannedData) ? plannedData : []);
            setCurrentCourses(Array.isArray(currentData) ? currentData : []);
          } else {
            const allCourses = await api.getCourseList(user.student_id);
            const coursesArray = Array.isArray(allCourses) ? allCourses : [];
            setPlannedCourses(coursesArray.filter(c => c.status === "Planned"));
            setCurrentCourses(coursesArray.filter(c => c.status === "Current"));
          }
        } catch (error) {
          const allCourses = await api.getCourseList(user.student_id);
          const coursesArray = Array.isArray(allCourses) ? allCourses : [];
          setPlannedCourses(coursesArray.filter(c => c.status === "Planned"));
          setCurrentCourses(coursesArray.filter(c => c.status === "Current"));
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Dashboard Fetch Error:", err);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user?.student_id]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";
  
  const displayCourses = activeTab === "planned" ? plannedCourses : currentCourses;
  const tableTitle = activeTab === "planned" ? "Planned Courses" : "In Progress Courses";
  
  // Calculate GOT percentage
  const gotPercentage = user?.student_GOT || 65;
  const gotColor = gotPercentage >= 80 ? "#4CAF50" : gotPercentage >= 60 ? "#FF9800" : "#F44336";

  if (loading) {
    return (
      <div className="dashboard-wrapper">
        <h2 className="dashboard-title">
          {greeting}, {user?.student_name || "Student"}
        </h2>
        
        <div className="stats-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="stat-card skeleton"></div>
          ))}
        </div>
        
        <div className="progress-section skeleton" style={{ height: "150px", marginBottom: "2rem" }}></div>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper">
      <h2 className="dashboard-title">
        {greeting}, {user?.student_name || "Student"}
      </h2>

      {/* Stats Grid */}
      <div className="stats-grid">
        {/* Planned Courses */}
        <div 
          className={`stat-card ${activeTab === "planned" ? "active-stat" : ""}`}
          onClick={() => setActiveTab("planned")}
          style={{ cursor: 'pointer' }}
        >
          <span className="stat-label">Planned Courses</span>
          <span className="stat-value">{plannedCourses.length || summary?.count_planned_course || "0"}</span>
        </div>

        {/* Current Courses */}
        <div 
          className={`stat-card ${activeTab === "current" ? "active-stat" : ""}`}
          onClick={() => setActiveTab("current")}
          style={{ cursor: 'pointer' }}
        >
          <span className="stat-label">In Progress</span>
          <span className="stat-value">{currentCourses.length || summary?.count_current_course || "0"}</span>
        </div>

        {/* Total Credits */}
        <div className="stat-card">
          <span className="stat-label">Total Credits</span>
          <span className="stat-value">{summary?.total_credits || "0"}</span>
        </div>

        {/* Current CGPA */}
        <div className="stat-card">
          <span className="stat-label">Current CGPA</span>
          <span className="stat-value">{summary?.student_cgpa?.toFixed(2) || "0.00"}</span>
        </div>
      </div>

      {/* Progress Bar Section - Graduate On Time */}
      <div className="progress-section">
        <div className="progress-header">
          <div>
            <h3 className="progress-title">Graduate On Time Progress</h3>
            <p className="progress-subtitle">Track your progress towards on-time graduation</p>
          </div>
          <div className="progress-percentage">
            <span className="percentage-value">{gotPercentage}%</span>
            <span className="percentage-label">Completion</span>
          </div>
        </div>
        
        <div className="progress-bar-container">
          <div className="progress-bar-track">
            <div 
              className="progress-bar-fill"
              style={{ 
                width: `${gotPercentage}%`,
                backgroundColor: gotColor
              }}
            ></div>
          </div>
          
          <div className="progress-labels">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
        </div>
        
        <div className="progress-status">
          {gotPercentage >= 80 ? (
            <div className="status-good">
              <span className="status-icon">✓</span>
              <span>You're on track to graduate on time!</span>
            </div>
          ) : gotPercentage >= 60 ? (
            <div className="status-warning">
              <span className="status-icon">⚠</span>
              <span>Keep up the pace to graduate on time</span>
            </div>
          ) : (
            <div className="status-danger">
              <span className="status-icon">!</span>
              <span>Consider reviewing your study plan</span>
            </div>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-container">
        <button 
          className={`tab-btn ${activeTab === "current" ? "active" : ""}`}
          onClick={() => setActiveTab("current")}
        >
          In Progress Courses
        </button>
        <button 
          className={`tab-btn ${activeTab === "planned" ? "active" : ""}`}
          onClick={() => setActiveTab("planned")}
        >
          Planned Courses
        </button>
      </div>

      {/* Course Table Section */}
      <div className="course-section">
        <table className="course-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Course Name</th>
              <th>Status</th>
              {activeTab === "current" && <th>Grade</th>}
            </tr>
          </thead>
          <tbody>
            {displayCourses.length > 0 ? (
              displayCourses.map((course, index) => (
                <tr key={index}>
                  <td><strong>{course.course_code}</strong></td>
                  <td>{course.COURSE?.course_name || course.course_name || "Unknown Course"}</td>
                  <td>
                    <span className={`status-badge ${course.status?.toLowerCase()}`}>
                      {course.status}
                    </span>
                  </td>
                  {activeTab === "current" && (
                    <td>{course.grade || "-"}</td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={activeTab === "current" ? 4 : 3} style={{ textAlign: 'center', padding: '2rem' }}>
                  No {activeTab === "planned" ? "planned" : "in progress"} courses found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Dashboard;