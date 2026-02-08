// SemesterBuilder.jsx - UPDATED with credit limit fix
import React, { useEffect } from 'react';
import { FaTrash } from 'react-icons/fa';
import './StudyPlan.css';

const SemesterBuilder = ({
  isEditing,
  selectedSem,
  semStatus,
  setSemStatus,
  currentSelection,
  setCurrentSelection,
  courseCreditsMap,
  isDraggingOver,
  setIsDraggingOver,
  isSaving,
  handleAddCourse,
  handleSaveSemester,
  resetForm,
  calculateCurrentCredits,
  getMaxCreditsDisplay,
  isExceedingLimit,
  gradeOptions,
  savedSemesters,
  fetchCreditLimitForSemester // ADD THIS PROPS
}) => {
  const handleDrop = (e) => {
    setIsDraggingOver(false);
    const course = JSON.parse(e.dataTransfer.getData("course"));
    handleAddCourse(course);
  };

  const targetSemester = isEditing ? selectedSem?.number : savedSemesters.length + 1;
  const currentCredits = calculateCurrentCredits();
  const maxLimit = getMaxCreditsDisplay(targetSemester);
  const creditLimitExceeded = isExceedingLimit(currentCredits, targetSemester);

  // ADD THIS useEffect to fetch limit if not available
  useEffect(() => {
    if (targetSemester && !maxLimit && fetchCreditLimitForSemester) {
      fetchCreditLimitForSemester(targetSemester);
    }
  }, [targetSemester, maxLimit, fetchCreditLimitForSemester]);

  return (
    <div 
      className={`glass-card drop-zone ${isDraggingOver ? 'dragging-over' : ''}`} 
      onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }} 
      onDragLeave={() => setIsDraggingOver(false)} 
      onDrop={handleDrop}
    >
      <div className="builder-header">
        <h4 className="builder-title">
          {isEditing ? `Editing Sem ${selectedSem?.number}` : `New Semester`}
        </h4>
        <div className="builder-controls">
          <div className="status-toggle-group">
            {['Planned', 'Current', 'Complete'].map(s => (
              <button 
                key={s} 
                type="button" 
                onClick={() => setSemStatus(s)} 
                className="status-tab" 
                style={{ 
                  background: semStatus === s ? '#81c784' : 'transparent', 
                  color: semStatus === s ? '#000' : '#888' 
                }}
              >
                {s}
              </button>
            ))}
          </div>
          
          <div 
            className="credit-counter" 
            style={{ 
              borderColor: creditLimitExceeded ? '#ff6b6b' : 'rgba(255,255,255,0.1)', 
              backgroundColor: creditLimitExceeded ? 'rgba(255, 107, 107, 0.1)' : 'transparent' 
            }}
          >
            <span style={{ 
              color: creditLimitExceeded ? '#ff6b6b' : '#81c784', 
              fontWeight: 'bold' 
            }}>
              {currentCredits}
            </span>/{maxLimit} Max
            
            {creditLimitExceeded && (
              <div style={{ 
                fontSize: '10px', 
                color: '#ff6b6b', 
                marginTop: '5px',
                fontWeight: 'normal'
              }}>
                Exceeds limit!
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="selection-list">
        {currentSelection.length === 0 ? (
          <div className="empty-prompt">Drag courses here or click on courses</div>
        ) : (
          <table className="builder-table">
            <thead>
              <tr className="builder-table-head">
                <th style={{ textAlign: 'left', padding: '12px' }}>Course</th>
                <th style={{ width: '80px' }}>Credits</th>
                {semStatus === 'Complete' && <th style={{ width: '100px' }}>Grade</th>}
                <th style={{ width: '50px' }}></th>
              </tr>
            </thead>
            <tbody>
              {currentSelection.map(course => (
                <tr key={course.course_code} className="builder-table-row">
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontWeight: 'bold', color: 'white' }}>{course.course_code}</div>
                    <div style={{ fontSize: '12px', color: '#aaa' }}>{course.course_name}</div>
                  </td>
                  <td style={{ textAlign: 'center', color: '#64b5f6' }}>
                    {courseCreditsMap[course.course_code] || 3}
                  </td>
                  
                  {semStatus === 'Complete' && (
                    <td style={{ textAlign: 'center' }}>
                      <select 
                        className="grade-select-small" 
                        value={course.grade} 
                        onChange={(e) => setCurrentSelection(
                          currentSelection.map(c => 
                            c.course_code === course.course_code 
                              ? {...c, grade: e.target.value} 
                              : c
                          )
                        )}
                      >
                        <option value="">-</option>
                        {gradeOptions.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </td>
                  )}
                  
                  <td style={{ textAlign: 'center' }}>
                    <FaTrash 
                      onClick={() => setCurrentSelection(
                        currentSelection.filter(c => c.course_code !== course.course_code)
                      )} 
                      className="trash-icon" 
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
      <div className="btn-row">
        <button className="cancel-btn" onClick={resetForm}>
          Cancel
        </button>
        <button 
          className="save-btn" 
          onClick={() => handleSaveSemester(false)} 
          disabled={isSaving || currentSelection.length === 0} 
          style={{ opacity: isSaving ? 0.7 : 1 }}
        >
          {isSaving ? 'Saving...' : 'Save Semester'}
        </button>
      </div>
    </div>
  );
};

export default SemesterBuilder;