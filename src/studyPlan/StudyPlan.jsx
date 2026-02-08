// StudyPlan.jsx - FIXED VERSION (only add the missing destructuring)
import React from 'react';
import { 
  FaChevronLeft, FaEdit, FaTrash, FaExclamationTriangle, 
  FaTimes, FaFilePdf, FaPlus 
} from 'react-icons/fa';
import { api } from "../utils/api";
import { generatePDFReport } from '../utils/reportGenerator';
import './StudyPlan.css';

// Import components and hook
import { useStudyPlan } from './useStudyPlan';
import SemesterCard from './SemesterCard';
import CoursePool from './CoursePool';
import SemesterBuilder from './SemesterBuilder';

function StudyPlan({ user }) {
  const {
    // State
    view,
    setView,
    savedSemesters,
    setSavedSemesters,
    currentSelection,
    setCurrentSelection,
    semStatus,
    setSemStatus,
    selectedSem,
    setSelectedSem,
    isEditing,
    setIsEditing,
    searchQuery,
    setSearchQuery,
    activeMainTab,
    setActiveMainTab,
    activeSubTab,
    setActiveSubTab,
    curriculumPool,
    isDraggingOver,
    setIsDraggingOver,
    semesterCredits,
    courseCreditsMap,
    isSaving,
    pendingError,
    setPendingError,
    isGeneratingReport,
    expandedSem,
    setExpandedSem,
    creditLimitError,
    setCreditLimitError,
    creditLimits,
    
    // Functions
    gradeOptions,
    handleAddCourse,
    handleSaveAnywayWithCreditLimit,
    handleSaveSemester,
    handleGeneratePDF,
    fetchPool,
    resetForm,
    calculateCurrentCredits,
    getMaxCreditsDisplay,
    isExceedingLimit,
    getCleanPrereq,
    // Add the missing function here
    fetchCreditLimitForSemester  // ADD THIS LINE
  } = useStudyPlan(user);

  // Remove the duplicate function that doesn't exist
  // const updateCreditLimitForSemester = () => {}; // Remove this line

  // Add this back since it's missing from useStudyPlan hook
  const getGradeColor = (grade) => {
    const map = {
      'A': '#4CAF50', 'B': '#CDDC39', 'C': '#FF9800', 'D': '#FF5722', 'F': '#F44336'
    };
    return map[grade?.charAt(0)] || '#888';
  };

  // Add missing handleDeleteSemester function
  const handleDeleteSemester = async () => {
    if (window.confirm(`Delete Semester ${selectedSem.number}?`)) {
      try {
        await api.deleteSemester(user.student_id, selectedSem.number);
        setSavedSemesters(prev => prev.filter(sem => sem.number !== selectedSem.number));
        resetForm();
      } catch (error) {
        console.error("Error deleting semester:", error);
        alert("Failed to delete semester. Please try again.");
      }
    }
  };

  const handleEditSemester = () => {
    setCurrentSelection(selectedSem.courses);
    setSemStatus(selectedSem.status);
    setIsEditing(true);
    setView('add');
  };

  return (
    <div className="dashboard-wrapper">
      {/* Pending Error Modal */}
      {pendingError && (
        <div className="modal-overlay">
          <div className="glass-card modal-content">
            <div className="modal-header">
              <div className="error-title-row">
                <FaExclamationTriangle color="#ff6b6b" size={24} />
                <h3 style={{margin: 0, color: '#ff6b6b'}}>Prerequisite Warning</h3>
              </div>
              <FaTimes className="close-icon" onClick={() => setPendingError(null)} />
            </div>
            <p className="modal-body-text">{pendingError}</p>
            <div className="modal-footer">
              <button className="modal-cancel-btn" onClick={() => setPendingError(null)}>
                Cancel & Fix
              </button>
              <button className="modal-save-anyway-btn" onClick={() => handleSaveSemester(true)}>
                Save Anyway
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Credit Limit Error Modal */}
      {creditLimitError && (
        <div className="modal-overlay">
          <div className="glass-card modal-content">
            <div className="modal-header">
              <div className="error-title-row">
                <FaExclamationTriangle color="#ff6b6b" size={24} />
                <h3 style={{margin: 0, color: '#ff6b6b'}}>Credit Limit Warning</h3>
              </div>
              <FaTimes className="close-icon" onClick={() => setCreditLimitError(null)} />
            </div>
            <p className="modal-body-text">{creditLimitError}</p>
            <div className="modal-footer">
              <button className="modal-cancel-btn" onClick={() => setCreditLimitError(null)}>
                Cancel & Fix
              </button>
              <button className="modal-save-anyway-btn" onClick={handleSaveAnywayWithCreditLimit}>
                Save Anyway
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="dashboard-content">
        <div className="header-row">
          <h2 className="dashboard-title">BUILDER</h2>
          <div className="report-button-container">
            <button 
              onClick={handleGeneratePDF} 
              className="download-report-btn" 
              disabled={isGeneratingReport}
            >
              <FaFilePdf className="pdf-icon" />
              {isGeneratingReport ? 'Generating PDF...' : 'Download Report'}
            </button>
          </div>
        </div>
        
        {/* List View - Semester Cards */}
        {view === 'list' && (
          <div className="sem-buttons-grid">
            {savedSemesters.map((sem) => (
              <SemesterCard 
                key={sem.number}
                sem={sem}
                semesterCredits={semesterCredits}
                onClick={() => { setSelectedSem(sem); setView('view'); }}
              />
            ))}
            
            {/* Add New Semester Button - FIXED STYLING */}
            <button 
              className="sem-button add-button"
              onClick={() => { resetForm(); setView('add'); }}
            >
              <div className="plus-icon">
                <FaPlus />
              </div>
              <div className="add-text">ADD NEW SEMESTER</div>
            </button>
          </div>
        )}
        
        {/* View Semester Details */}
        {view === 'view' && selectedSem && (
          <div className="glass-card view-card">
            <div className="view-header">
              <button className="back-btn" onClick={() => setView('list')}>
                <FaChevronLeft /> Back
              </button>
              <div className="action-btns">
                <button className="edit-btn" onClick={handleEditSemester}>
                  <FaEdit /> Edit
                </button>
                <button className="delete-btn" onClick={handleDeleteSemester}>
                  <FaTrash /> Delete
                </button>
              </div>
            </div>
            
            {/* Credit Warning Display */}
            {(() => {
              const semCredits = semesterCredits[selectedSem.number] || 0;
              const maxLimit = getMaxCreditsDisplay(selectedSem.number);
              
              if (semCredits > maxLimit) {
                return (
                  <div style={{
                    backgroundColor: 'rgba(255, 107, 107, 0.1)',
                    border: '1px solid rgba(255, 107, 107, 0.3)',
                    borderRadius: '8px',
                    padding: '15px',
                    marginBottom: '20px',
                    color: '#ff6b6b'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <FaExclamationTriangle />
                      <strong>Credit Limit Exceeded</strong>
                    </div>
                    <div style={{ fontSize: '14px' }}>
                      This semester has {semCredits} credits, exceeding the maximum allowed of {maxLimit} credits.
                    </div>
                  </div>
                );
              }
              return null;
            })()}
            
            <div className="semester-header">
              <div className="semester-info">
                <h3 className="view-sem-title">SEMESTER {selectedSem.number}</h3>
                <div className={`status-badge ${selectedSem.status}`}>{selectedSem.status.toUpperCase()}</div>
              </div>
              <div className="gpa-box">
                <div className="gpa-label">GPA</div>
                <div className="gpa-value">{selectedSem.gpa}</div>
                <div className="gpa-label">
                  Credit: {semesterCredits[selectedSem.number] || 0} / {getMaxCreditsDisplay(selectedSem.number)}
                </div>
              </div>
            </div>
            
            <div className="table-container">
              <div className="table-header">
                <span>CODE</span>
                <span>COURSE</span>
                <span>CREDIT</span>
                <span className="grade-header">GRADE</span>
              </div>
              
              {selectedSem.courses.map(course => (
                <div key={course.course_code} className="course-row">
                  <div>
                    <div style={{color:'white', fontWeight:'bold'}}>{course.course_code}</div>
                  </div>
                  <div>
                    <div style={{color:'white', opacity: 0.6, fontSize:'14px'}}>
                      {course.course_name}
                    </div>
                  </div>
                  <div style={{color: '#64b5f6', fontWeight:'bold'}}>
                    {courseCreditsMap[course.course_code] || 3}
                  </div>
                  <span 
                    className="grade-display" 
                    style={{ 
                      color: getGradeColor(course.grade) 
                    }}
                  >
                    {course.grade || '-'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Add/Edit Semester View */}
        {view === 'add' && (
          <div className="builder-grid">
            <SemesterBuilder 
              isEditing={isEditing}
              selectedSem={selectedSem}
              semStatus={semStatus}
              setSemStatus={setSemStatus}
              currentSelection={currentSelection}
              setCurrentSelection={setCurrentSelection}
              courseCreditsMap={courseCreditsMap}
              isDraggingOver={isDraggingOver}
              setIsDraggingOver={setIsDraggingOver}
              isSaving={isSaving}
              handleAddCourse={handleAddCourse}
              handleSaveSemester={handleSaveSemester}
              resetForm={resetForm}
              calculateCurrentCredits={calculateCurrentCredits}
              getMaxCreditsDisplay={getMaxCreditsDisplay}
              isExceedingLimit={isExceedingLimit}
              gradeOptions={gradeOptions}
              savedSemesters={savedSemesters}
              fetchCreditLimitForSemester={fetchCreditLimitForSemester}
            />
            
            <CoursePool 
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              activeMainTab={activeMainTab}
              setActiveMainTab={setActiveMainTab}
              activeSubTab={activeSubTab}
              setActiveSubTab={setActiveSubTab}
              curriculumPool={curriculumPool}
              expandedSem={expandedSem}
              setExpandedSem={setExpandedSem}
              handleAddCourse={handleAddCourse}
              fetchPool={fetchPool}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default StudyPlan;