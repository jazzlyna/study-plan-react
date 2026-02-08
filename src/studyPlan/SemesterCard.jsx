// SemesterCard.jsx - Only this small update
import React from 'react';
import './StudyPlan.css';

const SemesterCard = ({ sem, semesterCredits, onClick }) => {
  return (
    <button 
      className="sem-button" 
      onClick={onClick}
      data-status={sem.status} // Add this line
    >
      <div className="sem-card-header">
        <div style={{color: 'var(--text-muted)', fontSize: '12px'}}>SEMESTER {sem.number}</div>
        <div className="sem-badges">
          <span className="gpa-badge">GPA: {sem.gpa}</span>
        </div>
      </div>
      
      <div className="sem-card-body">
        <span style={{fontWeight: 'bold', fontSize: '1.1rem'}}>
            Credit: {semesterCredits[sem.number] || 0}
        </span>
        <span style={{fontSize: '12px', color: 'var(--text-muted)'}}>
            {sem.courses.length} COURSE
        </span>
      </div>

      <div className="sem-card-footer">
        <span style={{
            color: sem.status === 'Complete' ? '#10b981' : 'var(--primary)',
            fontSize: '12px',
            fontWeight: 'bold'
        }}>
            ● {sem.status.toUpperCase()}
        </span>
      </div>
    </button>
  );
};

export default SemesterCard;