import React, { useState, useEffect, useRef } from "react";
import { api } from "../utils/api";
import "./Dashboard.css";

function Dashboard({ user }) {
  const [plannedCourses, setPlannedCourses] = useState([]);
  const [currentCourses, setCurrentCourses] = useState([]);
  const [completedCourses, setCompletedCourses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [graduateOnTime, setGraduateOnTime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("current");
  const [isMobile, setIsMobile] = useState(false);
  const [hoveredStat, setHoveredStat] = useState(null);
  const [particles, setParticles] = useState([]);
  const containerRef = useRef(null);

  // Create floating particles
  useEffect(() => {
    const createParticles = () => {
      const newParticles = [];
      const particleCount = isMobile ? 20 : 50;
      
      for (let i = 0; i < particleCount; i++) {
        newParticles.push({
          id: i,
          size: Math.random() * 4 + 1,
          x: Math.random() * 100,
          y: Math.random() * 100,
          duration: Math.random() * 30 + 20,
          delay: Math.random() * 5
        });
      }
      
      setParticles(newParticles);
    };
    
    createParticles();
  }, [isMobile]);

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
        
        // Fetch all data in parallel for better performance
        const [summaryData, graduateOnTimeData] = await Promise.all([
          api.getCourseSummary(user.student_id),
          api.getGraduateOnTime(user.student_id)
        ]);
        
        setSummary(summaryData);
        setGraduateOnTime(graduateOnTimeData);
        
        try {
          const [plannedData, currentData, completedData] = await Promise.all([
            api.getPlannedCourse ? api.getPlannedCourse(user.student_id) : Promise.resolve([]),
            api.getCurrentCourse ? api.getCurrentCourse(user.student_id) : Promise.resolve([]),
            api.getCompletedCourse ? api.getCompletedCourse(user.student_id) : Promise.resolve([])
          ]);
          
          if (plannedData.length > 0 || currentData.length > 0 || completedData.length > 0) {
            setPlannedCourses(Array.isArray(plannedData) ? plannedData : []);
            setCurrentCourses(Array.isArray(currentData) ? currentData : []);
            setCompletedCourses(Array.isArray(completedData) ? completedData : []);
          } else {
            const allCourses = await api.getCourseList(user.student_id);
            const coursesArray = Array.isArray(allCourses) ? allCourses : [];
            setPlannedCourses(coursesArray.filter(c => c.status === "Planned"));
            setCurrentCourses(coursesArray.filter(c => c.status === "Current"));
            setCompletedCourses(coursesArray.filter(c => c.status === "Completed"));
          }
        } catch (error) {
          const allCourses = await api.getCourseList(user.student_id);
          const coursesArray = Array.isArray(allCourses) ? allCourses : [];
          setPlannedCourses(coursesArray.filter(c => c.status === "Planned"));
          setCurrentCourses(coursesArray.filter(c => c.status === "Current"));
          setCompletedCourses(coursesArray.filter(c => c.status === "Completed"));
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
  
  const displayCourses = activeTab === "planned" ? plannedCourses : activeTab === "completed" ? completedCourses : currentCourses;
  
  // Calculate GOT percentage from API response
  const gotPercentage = graduateOnTime?.analysis?.progress_percentage || 0;
  const getGotColor = (percentage) => {
    if (percentage >= 80) return { main: "#4CAF50", glow: "rgba(76, 175, 80, 0.5)" };
    if (percentage >= 60) return { main: "#FF9800", glow: "rgba(255, 152, 0, 0.5)" };
    return { main: "#F44336", glow: "rgba(244, 67, 54, 0.5)" };
  };
  
  const gotColor = getGotColor(gotPercentage);

  if (loading) {
    return (
      <div className="dashboard-wrapper">
        {/* Floating Particles */}
        <div className="particles-container">
          {particles.map(particle => (
            <div
              key={particle.id}
              className="particle"
              style={{
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                animationDuration: `${particle.duration}s`,
                animationDelay: `${particle.delay}s`
              }}
            />
          ))}
        </div>
        
        <h2 className="dashboard-title">
          {greeting}, {user?.student_name || "Student"}
        </h2>
        
        <div className="stats-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="stat-card skeleton"></div>
          ))}
        </div>
        
        <div className="progress-section skeleton" style={{ height: "180px", marginBottom: "2rem" }}></div>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper" ref={containerRef}>
      {/* Floating Particles */}
      <div className="particles-container">
        {particles.map(particle => (
          <div
            key={particle.id}
            className="particle"
            style={{
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              animationDuration: `${particle.duration}s`,
              animationDelay: `${particle.delay}s`
            }}
          />
        ))}
      </div>
      
      <h2 className="dashboard-title">
        {greeting}, {user?.student_name || "Student"}
      </h2>

      {/* Stats Grid */}
      <div className="stats-grid">
        {/* Planned Courses */}
        <div 
          className={`stat-card ${activeTab === "planned" ? "active-stat" : ""}`}
          onClick={() => setActiveTab("planned")}
          onMouseEnter={() => setHoveredStat("planned")}
          onMouseLeave={() => setHoveredStat(null)}
          style={{ cursor: 'pointer' }}
        >
          <span className="stat-label">Planned Courses</span>
          <span className="stat-value">{summary?.count_planned_course || "0"}</span>
        </div>

        {/* Current Courses */}
        <div 
          className={`stat-card ${activeTab === "current" ? "active-stat" : ""}`}
          onClick={() => setActiveTab("current")}
          onMouseEnter={() => setHoveredStat("current")}
          onMouseLeave={() => setHoveredStat(null)}
          style={{ cursor: 'pointer' }}
        >
          <span className="stat-label">In Progress</span>
          <span className="stat-value">{summary?.count_current_course || "0"}</span>
        </div>

        {/* Completed Courses */}
        <div 
          className={`stat-card ${activeTab === "completed" ? "active-stat" : ""}`}
          onClick={() => setActiveTab("completed")}
          onMouseEnter={() => setHoveredStat("completed")}
          onMouseLeave={() => setHoveredStat(null)}
          style={{ cursor: 'pointer' }}
        >
          <span className="stat-label">Completed Courses</span>
          <span className="stat-value">{summary?.count_completed_course || "0"}</span>
        </div>

        {/* Current CGPA */}
        <div className="stat-card"
          onMouseEnter={() => setHoveredStat("cgpa")}
          onMouseLeave={() => setHoveredStat(null)}
        >
          <span className="stat-label">Current CGPA</span>
          <span className="stat-value">{summary?.student_cgpa?.toFixed(2) || "0.00"}</span>
        </div>
      </div>


{/* Progress Bar Section - Graduate On Time */}
<div className="progress-section">
  <div className="progress-header">
    <div>
      <h3 className="progress-title">Graduate On Time</h3>
      <p className="progress-subtitle">
        {graduateOnTime?.analysis?.graduate_on_time_date 
          ? `Progress: ${gotPercentage.toFixed(1)}%` 
          : graduateOnTime?.analysis?.message || 'Track your progress towards on-time graduation'}
      </p>
    </div>
    <div className="progress-percentage">
      {graduateOnTime?.analysis?.is_valid_degree ? (
        <>
          <span className="percentage-value" style={{ color: gotColor.main }}>
            {graduateOnTime.analysis.graduate_on_time_date}
          </span>
          <span className="percentage-label" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            Target Date
          </span>
        </>
      ) : (
        <div style={{ textAlign: 'right' }}>
          <span className="percentage-value" style={{ 
            color: '#F59E0B',
            fontSize: '1.75rem'
          }}>
            Needs Review
          </span>
          <span className="percentage-label" style={{ 
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '0.85rem'
          }}>
            Check degree plan
          </span>
        </div>
      )}
    </div>
  </div>
  
  {graduateOnTime?.analysis?.is_valid_degree ? (
    <>
      <div className="progress-bar-container">
        <div className="progress-bar-track">
          <div 
            className="progress-bar-fill"
            style={{ 
              width: `${gotPercentage}%`,
              backgroundColor: gotColor.main,
              boxShadow: `0 0 20px ${gotColor.glow}`
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
    </>
  ) : (
    <div style={{ 
      padding: '1rem', 
      backgroundColor: 'rgba(245, 158, 11, 0.08)', 
      borderRadius: '12px',
      border: '1px solid rgba(245, 158, 11, 0.3)',
      marginTop: '1rem'
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'flex-start', 
        gap: '0.75rem'
      }}>
        <svg style={{ 
          width: '20px', 
          height: '20px', 
          flexShrink: 0,
          color: '#F59E0B',
          marginTop: '2px'
        }} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
        </svg>
        <div>
          <div style={{ 
            color: '#F59E0B',
            fontWeight: '600',
            fontSize: '0.95rem',
            marginBottom: '0.25rem'
          }}>
            Degree Plan Review Needed
          </div>
          <div style={{ 
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: '0.9rem',
            lineHeight: '1.4'
          }}>
            {graduateOnTime?.analysis?.message || 'Your current plan exceeds the recommended semester timeline.'}
          </div>
        </div>
      </div>
      
      {/* Show total semesters if available */}
      {graduateOnTime?.analysis?.total_semesters && (
        <div style={{ 
          marginTop: '1rem',
          paddingTop: '1rem',
          borderTop: '1px solid rgba(245, 158, 11, 0.2)'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.5rem'
          }}>
            <span style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.7)' }}>
              Semester Count
            </span>
            <span style={{ 
              fontWeight: '600', 
              color: '#F59E0B',
              fontSize: '1.1rem'
            }}>
              {graduateOnTime.analysis.total_semesters} / 21
            </span>
          </div>
          <div style={{ 
            height: '6px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '3px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${Math.min(100, (graduateOnTime.analysis.total_semesters / 21) * 100)}%`,
              height: '100%',
              backgroundColor: '#F59E0B',
              borderRadius: '3px'
            }}></div>
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            fontSize: '0.75rem',
            marginTop: '0.5rem',
            color: 'rgba(255, 255, 255, 0.5)'
          }}>
            <span>On Track (≤21)</span>
            <span>Extended Timeline</span>
          </div>
        </div>
      )}
    </div>
  )}
</div>

      {/* Tab Navigation */}
      <div className="tab-container">
        <button 
          className={`tab-btn ${activeTab === "current" ? "active" : ""}`}
          onClick={() => setActiveTab("current")}
        >
          <span>In Progress Courses</span>
          <span className="tab-count">({summary?.count_current_course || "0"})</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === "planned" ? "active" : ""}`}
          onClick={() => setActiveTab("planned")}
        >
          <span>Planned Courses</span>
          <span className="tab-count">({summary?.count_planned_course || "0"})</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === "completed" ? "active" : ""}`}
          onClick={() => setActiveTab("completed")}
        >
          <span>Completed Courses</span>
          <span className="tab-count">({summary?.count_completed_course || "0"})</span>
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
              {(activeTab === "current" || activeTab === "completed") && <th>Grade</th>}
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
                  {(activeTab === "current" || activeTab === "completed") && (
                    <td>
                      <span className="grade-display" style={{
                        color: course.grade === 'A' ? '#4CAF50' : 
                               course.grade === 'B' ? '#2196F3' : 
                               course.grade === 'C' ? '#FF9800' : 
                               course.grade === 'D' ? '#F44336' : '#9E9E9E',
                        fontWeight: 'bold'
                      }}>
                        {course.grade || "-"}
                      </span>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={(activeTab === "current" || activeTab === "completed") ? 4 : 3} style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                  No {activeTab === "planned" ? "planned" : activeTab === "current" ? "in progress" : "completed"} courses found.
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