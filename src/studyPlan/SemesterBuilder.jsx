import React, { useState, useEffect } from 'react';
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
  fetchCreditLimitFromSummary  
}) => {
  const [currentCreditLimit, setCurrentCreditLimit] = useState(15);
  const [isLoadingLimit, setIsLoadingLimit] = useState(false);
  const [creditLimitExceeded, setCreditLimitExceeded] = useState(false);

  const handleDrop = (e) => {
    setIsDraggingOver(false);
    const course = JSON.parse(e.dataTransfer.getData("course"));
    handleAddCourse(course);
  };

  const targetSemester = isEditing ? selectedSem?.number : savedSemesters.length + 1;
  const currentCredits = calculateCurrentCredits();

  
  useEffect(() => {
    if (isEditing && selectedSem?.status) {
      setSemStatus(selectedSem.status);
    }
  }, [isEditing, selectedSem, setSemStatus]);

  // Fetch credit limit from backend 
  useEffect(() => {
    const fetchLimit = async () => {
      if (!fetchCreditLimitFromSummary) return;
      
      setIsLoadingLimit(true);
      try {
        const limit = await fetchCreditLimitFromSummary(targetSemester);
        setCurrentCreditLimit(limit);
        
        // Check if current credits exceed the limit
        setCreditLimitExceeded(currentCredits > limit);
      } catch (error) {
        console.error("Error fetching credit limit:", error);
        setCurrentCreditLimit(15); // Default fallback
        setCreditLimitExceeded(currentCredits > 15);
      } finally {
        setIsLoadingLimit(false);
      }
    };

    fetchLimit();
  }, [targetSemester, fetchCreditLimitFromSummary, currentCredits]);

  // Update credit limit exceeded check when currentCredits changes
  useEffect(() => {
    setCreditLimitExceeded(currentCredits > currentCreditLimit);
  }, [currentCredits, currentCreditLimit]);

  return (
    <div 
      className={`glass-card drop-zone ${isDraggingOver ? 'dragging-over' : ''}`} 
      onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }} 
      onDragLeave={() => setIsDraggingOver(false)} 
      onDrop={handleDrop}
    >
<div className="builder-header">
  <div className="builder-title-row">
    <h4 className="builder-title">
      {isEditing ? `Editing Sem ${selectedSem?.number}` : `New Semester`}
    </h4>
    <div className="builder-controls">
      {/* Any other controls you want on the right side */}
    </div>
  </div>
  
  <div className="builder-status-controls">
    <div className="status-toggle-group">
  {['Planned', 'Current', 'Completed'].map(s => (
    <button 
      key={s} 
      type="button" 
      onClick={() => setSemStatus(s)} 
      className={`status-tab ${semStatus === s ? 'active' : ''}`}
    >
      {s}
    </button>
  ))}
</div>
    
<div className="builder-status-row">
  <div className={`credit-counter ${creditLimitExceeded ? 'warning' : ''}`}>
    <span>{currentCredits}</span>/{isLoadingLimit ? '...' : currentCreditLimit} Max
    {creditLimitExceeded && (
      <div style={{ fontSize: '10px', marginTop: '5px' }}>
        Exceeds limit!
      </div>
    )}
  </div>
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
                {semStatus === 'Completed' && <th style={{ width: '100px' }}>Grade</th>}
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
                  
                  {semStatus === 'Completed' && (
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
                        )} required >
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
  onClick={() => {
    //validation
    if (semStatus === 'Completed') {
      const missingGrades = currentSelection.filter(course => !course.grade || course.grade === '');
      if (missingGrades.length > 0) {
        alert('If you have completed this semester please enter your grade. If not choose your current status.');
        return; 
      }
    }
    handleSaveSemester(false);
  }} 
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