import React, { useState, useEffect } from "react";
import { api } from "../utils/api";
import "./Dashboard.css";

function Dashboard({ user }) {
  const [plannedCourses, setPlannedCourses] = useState([]);
  const [currentCourses, setCurrentCourses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPlanned, setShowPlanned] = useState(false);

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
          setPlannedCourses(Array.isArray(plannedData) ? plannedData : []);
          setCurrentCourses(Array.isArray(currentData) ? currentData : []);
        } catch (error) {
          const allCourses = await api.getCourseList(user.student_id);
          const coursesArray = Array.isArray(allCourses) ? allCourses : [];
          setPlannedCourses(coursesArray.filter(c => c.status === "Planned"));
          setCurrentCourses(coursesArray.filter(c => c.status === "Current"));
        }
        setLoading(false);
      } catch (err) {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user?.student_id]);

  if (loading) return <div className="loading-state">LOADING...</div>;

  const displayCourses = showPlanned ? plannedCourses : currentCourses;

  return (
    <div className="dashboard-wrapper">
      <h2 className="dashboard-title">
        GOOD MORNING, {user.student_name?.toUpperCase() || "NAME"} !
      </h2>

      <div className="dashboard-gap"></div>

      <div className="layout-container">
        <div className="metrics-side">
          {/* PLANNED CARD */}
          <div 
            className={`stat-card clickable ${showPlanned ? 'active-click' : ''}`}
            onClick={() => setShowPlanned(true)}
          >
            <span className="stat-label">PLANNED</span>
            <span className="stat-value">{plannedCourses.length || summary?.count_planned_course || "0"}</span>
          </div>

          {/* IN PROGRESS CARD */}
          <div 
            className={`stat-card clickable ${!showPlanned ? 'active-click' : ''}`}
            onClick={() => setShowPlanned(false)}
          >
            <span className="stat-label">IN PROGRESS</span>
            <span className="stat-value">{currentCourses.length || summary?.count_current_course || "0"}</span>
          </div>

          <div className="stat-card">
            <span className="stat-label">TOTAL CREDIT</span>
            <span className="stat-value">{summary?.total_credits || "0"}</span>
          </div>

          <div className="stat-card">
            <span className="stat-label">CURRENT CGPA</span>
            <span className="stat-value">{summary?.student_cgpa?.toFixed(2) || "0.00"}</span>
          </div>
        </div>

        <div className="content-side">
          <div className="got-container">
            <span className="stat-label white-text">GRADUATE ON TIME</span>
            <div className="got-progress-track">
              <div 
                className="got-progress-fill" 
                style={{ width: `${user.student_GOT || 65}%` }}
              ></div>
            </div>
          </div>

          <div className="table-container">
            <table className="course-table">
              <thead>
                <tr>
                  <th>CODE</th>
                  <th>COURSE NAME</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {displayCourses.length > 0 ? (
                  displayCourses.map((course, index) => (
                    <tr key={index}>
                      <td><strong>{course.course_code}</strong></td>
                      <td>{course.COURSE?.course_name || course.course_name}</td>
                      <td><span className={`status-tag ${course.status}`}>{course.status}</span></td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="empty-row">No courses found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;