import React from 'react';
import './StudyPlan.css';

const SemesterCard = ({ sem, semesterCredits, onClick }) => {
  const getStatusClass = () => {
    switch(sem.status?.toLowerCase()) {
      case 'complete': return 'complete';
      case 'current': return 'current';
      case 'planned': return 'planned';
      default: return 'planned';
    }
  };

  return (
    <button className="sem-button" onClick={onClick}>
      {/* LEFT SECTION: Main Semester Title and Status */}
      <div className="sem-card-left">
        <div className="sem-title-text">
          SEMESTER {sem.number}
        </div>
        <div className={`status-text ${getStatusClass()}`}>
          {sem.status || 'PLANNED'}
        </div>
      </div>
      
      {/* RIGHT SECTION: Badges and Course Count */}
      <div className="sem-card-right">
        <div className="stat-pill">
          GPA: {sem.gpa || '0.00'}
        </div>
        <div className="stat-pill">
          Credit: {semesterCredits[sem.number] || 0}
        </div>
        <div className="course-text">
          {sem.courses?.length || 0} COURSE
        </div>
      </div>
    </button>
  );
};

export default SemesterCard;