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
  fetchCreditLimitFromSummary,
  isExemptionView = false
}) => {
  const [currentCreditLimit, setCurrentCreditLimit] = useState(null);
  const [isLoadingLimit, setIsLoadingLimit] = useState(false);
  const [creditLimitExceeded, setCreditLimitExceeded] = useState(false);

  const handleDrop = (e) => {
    setIsDraggingOver(false);
    const course = JSON.parse(e.dataTransfer.getData("course"));
    handleAddCourse(course);
  };

  const targetSemester = isEditing ? selectedSem?.number : savedSemesters.length + 1;
  const currentCredits = calculateCurrentCredits();

  // Initialize status when editing
  useEffect(() => {
    if (isEditing && selectedSem?.status) {
      setSemStatus(selectedSem.status);
    }
  }, [isEditing, selectedSem, setSemStatus]);


// Initialize grades when editing
useEffect(() => {
  if (isEditing && selectedSem?.courses && currentSelection.length > 0) {
    // Create a map of original courses for quick lookup
    const originalCoursesMap = {};
    selectedSem.courses.forEach(c => {
      originalCoursesMap[c.course_code] = c.grade || '';
    });
    
    // Update grades in currentSelection based on original data
    const updatedSelection = currentSelection.map(course => {
      const originalGrade = originalCoursesMap[course.course_code];
      // Only update if the grade is different and not in exemption view
      if (originalGrade !== undefined && !isExemptionView) {
        return { ...course, grade: originalGrade };
      }
      return course;
    });
    
    // Check if any grades actually changed
    const needsUpdate = updatedSelection.some((course, index) => 
      course.grade !== currentSelection[index]?.grade
    );
    
    if (needsUpdate) {
      setCurrentSelection(updatedSelection);
    }
  }
}, [isEditing, selectedSem, currentSelection, setCurrentSelection, isExemptionView]);

  // For exemption view, ensure all courses have grade set to 'Exemption'
useEffect(() => {
  if (isExemptionView && currentSelection.length > 0) {
    const updatedSelection = currentSelection.map(course => ({
      ...course,
      grade: 'Exemption'
    }));
    
    const needsUpdate = updatedSelection.some((course, index) => 
      course.grade !== currentSelection[index]?.grade
    );
    
    if (needsUpdate) {
      setCurrentSelection(updatedSelection);
    }
  }
}, [isExemptionView, currentSelection, setCurrentSelection]);

  // Fetch credit limit from backend
  useEffect(() => {
    const fetchLimit = async () => {
      if (!fetchCreditLimitFromSummary) return;
      
      setIsLoadingLimit(true);
      try {
        const limit = await fetchCreditLimitFromSummary(targetSemester);
        setCurrentCreditLimit(limit);
        
        // Check if current credits exceed the limit 
        if (!isExemptionView && limit !== null) {
          setCreditLimitExceeded(currentCredits > limit);
        } else {
          setCreditLimitExceeded(false);
        }
      } catch (error) {
        console.error("Error fetching credit limit:", error);
        setCurrentCreditLimit(15); 
        if (!isExemptionView) {
          setCreditLimitExceeded(currentCredits > 15);
        } else {
          setCreditLimitExceeded(false);
        }
      } finally {
        setIsLoadingLimit(false);
      }
    };

    fetchLimit();
  }, [targetSemester, fetchCreditLimitFromSummary, currentCredits, isExemptionView]);

  // Update credit limit exceeded check when currentCredits changes
  useEffect(() => {
    if (!isExemptionView && currentCreditLimit !== null) {
      setCreditLimitExceeded(currentCredits > currentCreditLimit);
    } else {
      setCreditLimitExceeded(false);
    }
  }, [currentCredits, currentCreditLimit, isExemptionView]);

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
            {isExemptionView 
              ? (isEditing ? 'Edit Exemption Courses' : 'Exemption Courses')
              : (isEditing ? `Editing Sem ${selectedSem?.number}` : `New Semester`)
            }
          </h4>
          <div className="builder-controls">
            {/* Any other controls you want on the right side */}
          </div>
        </div>
        
        <div className="builder-status-controls">
          <div className="status-toggle-group">
            {isExemptionView ? (
              // Show only Completed status for Exemption
              <button className="status-tab active">Completed</button>
            ) : (
              // Show all status options for normal semesters
              ['Planned', 'Current', 'Completed'].map(s => (
                <button 
                  key={s} 
                  type="button" 
                  onClick={() => setSemStatus(s)} 
                  className={`status-tab ${semStatus === s ? 'active' : ''}`}
                >
                  {s}
                </button>
              ))
            )}
          </div>
          
          <div className="builder-status-row">
            <div className={`credit-counter ${!isExemptionView && creditLimitExceeded ? 'warning' : ''}`}>
              <span>Credits: {currentCredits}</span>
              {!isExemptionView && currentCreditLimit !== null && (
                <div style={{ fontSize: '11px', marginTop: '2px' }}>
                  Max: {isLoadingLimit ? '...' : currentCreditLimit}
                </div>
              )}
              {!isExemptionView && creditLimitExceeded && (
                <div style={{ fontSize: '10px', marginTop: '5px', color: '#f87171' }}>
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
                {!isExemptionView && semStatus === 'Completed' && <th style={{ width: '100px' }}>Grade</th>}
                {isExemptionView && <th style={{ width: '100px' }}>Grade</th>}
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
                  <td style={{ 
                    textAlign: 'center', 
                    color: course.grade === 'F' ? '#ff5252' : '#64b5f6' 
                  }}>
                    {course.grade === 'F' ? 0 : (courseCreditsMap[course.course_code] || 3)}
                  </td>
                  
                  {isExemptionView ? (
                    // Show "Exemption" text for grade 
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ 
                        background: '#8b5cf6', 
                        color: 'white', 
                        padding: '4px 8px', 
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        display: 'inline-block'
                      }}>
                        EXEMPTION
                      </span>
                    </td>
                  ) : semStatus === 'Completed' ? (
                    // Show grade dropdown for normal completed semesters
                    <td style={{ textAlign: 'center' }}>
                      <select 
                        className="grade-select-small" 
                        value={course.grade || ''} 
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
                  ) : null}
                  
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
            if (!isExemptionView && semStatus === 'Completed') {
              const missingGrades = currentSelection.filter(course => !course.grade || course.grade === '');
              if (missingGrades.length > 0) {
                alert('Please enter grades for all courses in this completed semester.');
                return; 
              }
            }
            handleSaveSemester(false);
          }} 
          disabled={isSaving || currentSelection.length === 0} 
          style={{ opacity: isSaving ? 0.7 : 1 }}
        >
          {isSaving ? 'Saving...' : (isExemptionView ? 'Save Exemption' : 'Save Semester')}
        </button>
      </div>
    </div>
  );
};

export default SemesterBuilder;