import React, { useState } from 'react';  // Add useState import
import { 
  FaChevronLeft, FaEdit, FaTrash, FaExclamationTriangle, 
  FaTimes, FaFilePdf, FaPlus, FaCalendarAlt  // Add FaCalendarAlt
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
    creditLimit,
    
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
    getGradeColor,
    fetchCreditLimitFromSummary
  } = useStudyPlan(user);

  // Add state for deferment modal and inputs
  const [showDefermentModal, setShowDefermentModal] = useState(false);
  const [medicalDeferment, setMedicalDeferment] = useState('');
  const [regularDeferment, setRegularDeferment] = useState('');
  const [isSavingDeferment, setIsSavingDeferment] = useState(false);
  const [defermentError, setDefermentError] = useState('');

  // Add state for credit limit warning
  const [creditWarning, setCreditWarning] = useState(null);

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
  setCurrentSelection([]);
  setCurrentSelection(selectedSem.courses);
  setTimeout(() => {
    setSemStatus(selectedSem.status || 'Completed');
  }, 0);
  setIsEditing(true);
  setView('add');
};

  // Function to handle deferment save
  const handleSaveDeferment = async () => {
    // Validate inputs
    const medDeferment = parseInt(medicalDeferment) || 0;
    const regDeferment = parseInt(regularDeferment) || 0;
    
    if (medDeferment < 0 || regDeferment < 0) {
      setDefermentError("Deferment values cannot be negative");
      return;
    }

    setIsSavingDeferment(true);
    setDefermentError('');

    try {
      // First, get current profile data
      const currentProfile = await api.getProfile(user.student_id);
      
      // Prepare update data - using correct field names
      const updateData = {
        ...currentProfile,
        deferment_medical: medDeferment,  
        deferment_normal: regDeferment           
      };

      // Send update request
      await api.updateProfile(user.student_id, updateData);
      
      // Close modal and reset - NO SUCCESS MESSAGE
      setShowDefermentModal(false);
      setMedicalDeferment('');
      setRegularDeferment('');
      
      // Optional: You could add a subtle success indicator here if needed
      // For example: setDefermentError(''); // Clear any errors
      
    } catch (error) {
      console.error("Error saving deferment:", error);
      setDefermentError(error.message || "Failed to save deferment information");
    } finally {
      setIsSavingDeferment(false);
    }
  };

  // Function to load existing deferment values when modal opens
  const loadDefermentValues = async () => {
    try {
      const profile = await api.getProfile(user.student_id);
      // Make sure we're using the correct field names from backend
      setMedicalDeferment(profile.deferment_medical || '');
      setRegularDeferment(profile.deferment_normal || '');
    } catch (error) {
      console.error("Error loading deferment values:", error);
      // Set defaults if error occurs
      setMedicalDeferment('');
      setRegularDeferment('');
    }
  };

  // Check credit limit when viewing a semester
  React.useEffect(() => {
    const checkCreditLimit = async () => {
      if (view === 'view' && selectedSem) {
        const semCredits = semesterCredits[selectedSem.number] || 0;
        const maxLimit = await getMaxCreditsDisplay(selectedSem.number);
        
        if (semCredits > maxLimit) {
          setCreditWarning({
            semester: selectedSem.number,
            credits: semCredits,
            limit: maxLimit
          });
        } else {
          setCreditWarning(null);
        }
      } else {
        setCreditWarning(null);
      }
    };
    
    checkCreditLimit();
  }, [view, selectedSem, semesterCredits, getMaxCreditsDisplay]);

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
      
      {/* Deferment Modal */}
      {showDefermentModal && (
        
        <div className="modal-overlay">
          <div className="glass-card modal-content deferment-modal" style={{ width: '400px' }}>
          
            <div className="modal-header">
              <div className="error-title-row">
                <FaCalendarAlt color="#3b82f6" size={24} />
                <h3 style={{margin: 0, color: '#3b82f6'}}>Deferment</h3>
              </div>
              <FaTimes 
                className="close-icon" 
                onClick={() => {
                  setShowDefermentModal(false);
                  setDefermentError('');
                }} 
              />
            
            </div>
            
            <div className="modal-body-text">
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Deferment by Medical Reason:
                </label>
                <input
                  type="number"
                  min="0"
                  value={medicalDeferment}
                  onChange={(e) => setMedicalDeferment(e.target.value)}
                  placeholder="Enter number of semesters"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: '#ffffff',
                    fontSize: '14px'
                  }}
                />
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Deferment:
                </label>
                <input
                  type="number"
                  min="0"
                  value={regularDeferment}
                  onChange={(e) => setRegularDeferment(e.target.value)}
                  placeholder="Enter number of semesters"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: '#ffffff',
                    fontSize: '14px'
                  }}
                />
              </div>
              
              {defermentError && (
                <div style={{
                  padding: '10px',
                  background: 'rgba(255, 107, 107, 0.1)',
                  border: '1px solid rgba(255, 107, 107, 0.3)',
                  borderRadius: '8px',
                  color: '#ff6b6b',
                  fontSize: '14px',
                  marginBottom: '15px'
                }}>
                  {defermentError}
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <button 
                className="modal-cancel-btn" 
                onClick={() => {
                  setShowDefermentModal(false);
                  setDefermentError('');
                }}
              >
                Cancel
              </button>
              <button 
                className="modal-save-anyway-btn" 
                onClick={handleSaveDeferment}
                disabled={isSavingDeferment}
              >
                {isSavingDeferment ? 'Saving...' : 'Save Deferment'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="dashboard-content">
        <div className="header-row">
          <h2 className="dashboard-title">BUILDER</h2>
          <div className="report-button-container" style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={() => {
                loadDefermentValues();
                setShowDefermentModal(true);
              }} 
              className="download-report-btn"
              style={{ background: '#10b981' }}
            >
              <FaCalendarAlt className="pdf-icon" />
              Deferment
            </button>
            
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
            
            {/* Credit Warning Display - FIXED */}
            {creditWarning && (
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
                  This semester has {creditWarning.credits} credits, exceeding the maximum allowed of {creditWarning.limit} credits.
                </div>
              </div>
            )}
            
            <div className="semester-header">
              <div className="semester-info">
                <h3 className="view-sem-title">SEMESTER {selectedSem.number}</h3>
                <div className={`status-badge ${selectedSem.status}`}>{selectedSem.status.toUpperCase()}</div>
              </div>
              <div className="gpa-box">
                <div className="gpa-label">GPA</div>
                <div className="gpa-value">{selectedSem.gpa}</div>
                <div className="gpa-label">
                  Credit: {semesterCredits[selectedSem.number] || 0} / {(() => {
                    // Fetch and display limit
                    getMaxCreditsDisplay(selectedSem.number).then(limit => limit);
                    return '...';
                  })()}
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
                    <div className="course-code-cell">{course.course_code}</div>
                  </div>
                  <div>
                    <div className="course-name-cell">{course.course_name}</div>
                  </div>
                  <div className="course-credit-cell">
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
              fetchCreditLimitFromSummary={fetchCreditLimitFromSummary}
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