import React from 'react';
import './StudyPlan.css';

const SemesterCard = ({ sem, standing, onClick }) => {
  const getStatusClass = () => {
    switch(sem.status?.toLowerCase()) {
      case 'complete': return 'complete';
      case 'current': return 'current';
      case 'planned': return 'planned';
      default: return 'planned';
    }
  };

  // Get credits to display 
  const getCredits = () => {
    if (standing?.enrolled_credits) {
      return standing.enrolled_credits;
    }
    if (sem.totalCredits) {
      return sem.totalCredits;
    }
    return 0;
  };

  return (
    <button className="sem-button" onClick={onClick}>
      <div className="sem-card-left" style={{ textAlign: 'left' }}>
        <div className="sem-title-text">
          {sem.number === 'EXEMPTION' ? 'EXEMPTION' : `SEMESTER ${sem.number}`}
        </div>
        
        <div className="status-details" style={{ marginTop: '4px' }}>
          {/* Main Status Label */}
          <div className={`status-text ${getStatusClass()}`} style={{ fontSize: '14px' }}>
            {sem.status || 'PLANNED'}
          </div>
          
          {/* Probation Bullet Point */}
          {standing?.is_probation && (
            <div className="probation-bullet" style={{ 
              color: '#ff4d4d',
              fontSize: '10px',
              fontWeight: '800',
              display: 'flex', 
              alignItems: 'center',
              marginTop: '1px',
              letterSpacing: '0.5px'
            }}>
              <span style={{ marginRight: '4px', fontSize: '14px' }}>•</span>
              PROBATION
            </div>
          )}
        </div>
      </div>
      
      <div className="sem-card-right">
        <div className="stat-pill">
          GPA: {sem.gpa || '0.00'}
        </div>
        <div className="stat-pill">
          Credit: {getCredits()}
        </div>
        <div className="course-text">
          {sem.courses?.length || 0} COURSE
        </div>
      </div>
    </button>
  );
};

export default SemesterCard;