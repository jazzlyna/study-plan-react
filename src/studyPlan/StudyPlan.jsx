
import React, { useState, useEffect, useCallback } from 'react';
import { 
  FaPlus, FaTrash, FaChevronLeft, FaSearch, 
  FaEdit, FaExclamationTriangle, FaTimes, FaFilePdf 
} from 'react-icons/fa';
import { api } from "../utils/api";
import { generatePDFReport} from '../utils/reportGenerator';
import './StudyPlan.css';

function StudyPlan({ user }) {
  const [view, setView] = useState('list');
  const [savedSemesters, setSavedSemesters] = useState([]);
  const [currentSelection, setCurrentSelection] = useState([]);
  const [semStatus, setSemStatus] = useState('Planned');
  const [selectedSem, setSelectedSem] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMainTab, setActiveMainTab] = useState('core'); // 'core' or 'spec'
  const [activeSubTab, setActiveSubTab] = useState('All');   // 'All', 'NR', 'UR', etc.
  const [curriculumPool, setCurriculumPool] = useState([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [semesterCredits, setSemesterCredits] = useState({});
  const [courseCreditsMap, setCourseCreditsMap] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [pendingError, setPendingError] = useState(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [expandedSem, setExpandedSem] = useState(null);
  const [creditLimitError, setCreditLimitError] = useState(null);
  const [creditLimits, setCreditLimits] = useState({}); // Store credit limits per semester
  const [isLoadingCreditLimit, setIsLoadingCreditLimit] = useState(false);
  
  const gradeOptions = ["A", "A-", "B+", "B", "B-", "C+", "C", "D", "F"];

  // Calculate credit limit for a specific semester based on previous semester GPA
  const calculateCreditLimitForSemester = useCallback((semesterNumber) => {
    // If it's semester 1, default to 15
    if (semesterNumber === 1) {
      return 15;
    }
    
    // Check previous semester
    const prevSemesterNumber = semesterNumber - 1;
    const prevSemester = savedSemesters.find(sem => sem.number === prevSemesterNumber);
    
    if (!prevSemester) {
      // No previous semester data, default to 15
      return 15;
    }
    
    // Check if previous semester is completed
    if (prevSemester.status === 'Complete') {
      const prevGPA = parseFloat(prevSemester.gpa) || 0;
      return prevGPA >= 2.0 ? 15 : 11;
    } else {
      // Previous semester not completed yet, default to 15
      return 15;
    }
  }, [savedSemesters]);

  // Fetch and update credit limit for a specific semester
  const updateCreditLimitForSemester = useCallback((semesterNumber) => {
    const limit = calculateCreditLimitForSemester(semesterNumber);
    setCreditLimits(prev => ({ ...prev, [semesterNumber]: limit }));
    return limit;
  }, [calculateCreditLimitForSemester]);

  const getCleanPrereq = (val) => {
    if (!val) return null;
    const ignore = ["null", "none", "-", "", "undefined", "n/a", "[]"];
    return ignore.includes(String(val).trim().toLowerCase()) ? null : String(val).trim();
  };

  const handleAddCourse = (course) => {
    if (currentSelection.some(c => c.course_code === course.course_code)) {
      alert(`You have already added [${course.course_code}] to this semester.`);
      return;
    }
    
    let existingRecord = null;
    let existingSemNumber = null;
    savedSemesters.forEach(sem => {
      const found = sem.courses.find(c => c.course_code === course.course_code);
      if (found) {
        existingRecord = found;
        existingSemNumber = sem.number;
      }
    });

    if (existingRecord) {
      if (!existingRecord.grade || existingRecord.grade.trim() === "") {
        alert(`You have already added [${course.course_code}] in Semester ${existingSemNumber}.`);
        return;
      }
      if (existingRecord.grade !== "F") {
        alert(`You have already completed [${course.course_code}] in Semester ${existingSemNumber} with grade [${existingRecord.grade}]. Only 'F' grades can be retaken.`);
        return;
      }
    }
    
    const prereq = getCleanPrereq(course.pre_requisite);
    if (prereq) {
      alert(`Note: This course requires [${prereq.toUpperCase()}]. Please ensure the prerequisite is completed first!`);
    }
    
    setCurrentSelection([...currentSelection, { ...course, grade: "" }]);
  };

  const handleSaveAnywayWithCreditLimit = async () => {
    setCreditLimitError(null);
    await handleSaveSemester(true);
  };

  const handleSaveSemester = async (bypass = false) => {
    // Ensure targetSemester is an Integer
    const targetSemester = parseInt(isEditing ? selectedSem.number : savedSemesters.length + 1);
    
    if (!bypass) {
      let errorMsg = null;
      
      // First check prerequisites (existing logic)
      for (const course of currentSelection) {
        let prereqs = [];
        if (Array.isArray(course.pre_requisite)) {
          prereqs = course.pre_requisite;
        } else {
          const singleP = getCleanPrereq(course.pre_requisite);
          if (singleP) prereqs = [singleP];
        }
        for (const pCode of prereqs) {
          const cleanP = pCode.trim();
          const inSame = currentSelection.some(c => c.course_code === cleanP);
          const hasPassed = savedSemesters.some(s => 
            s.courses.some(c => c.course_code === cleanP && c.grade && c.grade !== "" && c.grade !== "F")
          );
          if (inSame) {
            errorMsg = `Case A: [${course.course_code}] and its prerequisite [${cleanP}] are in the same semester. You need chair approval / chair approval and an attempt to [${cleanP}].`;
            break;
          } else if (!hasPassed) {
            errorMsg = `Case B: [${course.course_code}] requires [${cleanP}]. To take [${course.course_code}] first you need chair approval and an attempt to [${cleanP}].`;
            break;
          }
        }
        if (errorMsg) break;
      }
      
      if (errorMsg) {
        setPendingError(errorMsg);
        return;
      }
      
      // Check credit limit
      const currentCredits = calculateCurrentCredits();
      const maxLimit = getMaxCreditsDisplay(targetSemester);
      
      if (currentCredits > maxLimit) {
        errorMsg = `You have selected ${currentCredits} credits, which exceeds the maximum allowed of ${maxLimit} credits for this semester.`;
        setCreditLimitError(errorMsg);
        return;
      }
    }
    
    setIsSaving(true);
    setPendingError(null);
    setCreditLimitError(null);
    
    try {
      if (isEditing) {
        await api.deleteSemester(user.student_id, targetSemester);
      }
      
      // Save courses one by one and collect backend responses
      const backendResponses = [];
      let savedSuccessfully = true;
      
      for (const course of currentSelection) {
        const payload = {
          student_id: String(user.student_id).trim(),
          course_code: String(course.course_code),
          semester: targetSemester,
          grade: semStatus === 'Complete' ? (course.grade || "") : "",
          status: semStatus === 'Complete' ? 'Completed' : (semStatus === 'Current' ? 'Current' : 'Planned')
        };
        
        try {
          const response = await api.addCourse(payload);
          backendResponses.push(response);
          
          // Check if backend returned credit limit warning
          if (response.academic_meta && response.academic_meta.limit_exceeded) {
            // Store the actual limit from backend for this semester
            if (response.academic_meta.max_limit) {
              setCreditLimits(prev => ({
                ...prev,
                [targetSemester]: response.academic_meta.max_limit
              }));
            }
            
            // If this is the first course and limit is exceeded, show error
            if (!bypass) {
              const firstIssue = response.academic_meta;
              setCreditLimitError(
                `Credit Limit Exceeded: You have ${firstIssue.current_total_credits} credits, ` +
                `which exceeds the maximum allowed of ${firstIssue.max_limit} credits for this semester.`
              );
              savedSuccessfully = false;
              break;
            }
          }
        } catch (error) {
          // Check if error is from backend credit limit
          if (error.message && (error.message.includes("limit") || error.message.includes("credit") || error.message.includes("exceed"))) {
            setCreditLimitError(`Credit Limit Error: ${error.message}`);
            savedSuccessfully = false;
            break;
          } else {
            throw error;
          }
        }
      }
      
      if (savedSuccessfully) {
        await fetchSemesterCredits();
        await fetchUserPlan();
        resetForm();
      }
      
    } catch (error) {
      alert("System Error: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGeneratePDF = async () => {
    if (!user?.student_id) {
      alert("User information not available");
      return;
    }
    setIsGeneratingReport(true);
    try {
      const reportData = await api.getReportData(user.student_id);
      await generatePDFReport(user, reportData); 
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF report. Please try again.");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const fetchUserPlan = useCallback(async () => {
    if (!user?.student_id) return;
    try {
      const data = await api.getStudentPlan(user.student_id);
      const grouped = data.reduce((acc, item) => {
        if (!acc[item.semester]) {
          acc[item.semester] = { 
            number: item.semester, 
            status: item.status, 
            courses: [], 
            gpa: "0.00" 
          };
        }
        acc[item.semester].courses.push({
          course_code: item.course_code,
          course_name: item.COURSE?.course_name || "Unknown",
          grade: item.grade || "",
          pre_requisite: item.COURSE?.pre_requisite || null
        });
        return acc;
      }, {});
      
      const finalized = await Promise.all(
        Object.values(grouped).map(async (sem) => {
          const gpaData = await api.getGPA(user.student_id, sem.number);
          return { ...sem, gpa: gpaData.student_gpa || "0.00" };
        })
      );
      
      setSavedSemesters(finalized.sort((a, b) => a.number - b.number));
    } catch (err) { 
      console.error(err); 
    }
  }, [user?.student_id]);

  const fetchSemesterCredits = useCallback(async () => {
    if (!user?.student_id) return;
    try {
      const data = await api.getSummary(user.student_id);
      if (data.semester_credits) {
        const creditsMap = {};
        Object.entries(data.semester_credits).forEach(([key, value]) => {
          const semNum = key.replace(/\D/g, '');
          if (semNum) creditsMap[semNum] = value;
        });
        setSemesterCredits(creditsMap);
      }
    } catch (err) { 
      console.error(err); 
    }
  }, [user?.student_id]);

  const fetchCourseCredits = useCallback(async () => {
    try {
      const data = await api.getCourses();
      if (Array.isArray(data)) {
        const map = {};
        data.forEach(c => map[c.course_code] = c.credit_hour);
        setCourseCreditsMap(map);
      }
    } catch (err) { 
      console.error(err); 
    }
  }, []);

  const fetchPool = useCallback(async (tabName) => {
    const fetchMap = {
      // General Pathway tabs
      'All': () => api.getCourses(),
      'NR': () => api.getNationalRequirementCourses(user.student_id),
      'UR': () => api.getUniversityRequirementCourses(user.student_id),
      'CC': () => api.getCommonCourses(user.student_id),
      'CD': () => api.getCoreDisciplineCourses(user.student_id),
      
      // Core Specialisation tabs
      'Offshore': async () => {
        const allCourses = await api.getCoreSpecializationCourses(user.student_id);
        return Array.isArray(allCourses) 
          ? allCourses.filter(course => course.specialization === 'Offshore' || 
                                       course.course_name?.includes('Offshore'))
          : [];
      },
      'Environmental': async () => {
        const allCourses = await api.getCoreSpecializationCourses(user.student_id);
        return Array.isArray(allCourses) 
          ? allCourses.filter(course => course.specialization === 'Environmental' || 
                                       course.course_name?.includes('Environmental'))
          : [];
      },
      'Sustainability': async () => {
        const allCourses = await api.getCoreSpecializationCourses(user.student_id);
        return Array.isArray(allCourses) 
          ? allCourses.filter(course => course.specialization === 'Sustainability' || 
                                       course.course_name?.includes('Sustainability'))
          : [];
      },
      'Renewable Energy': async () => {
        const allCourses = await api.getCoreSpecializationCourses(user.student_id);
        return Array.isArray(allCourses) 
          ? allCourses.filter(course => course.specialization === 'Renewable Energy' || 
                                       course.course_name?.includes('Renewable'))
          : [];
      },
      
      // Fallback
      'core': () => api.getCourses(), // Default for General Pathway
      'spec': () => api.getCoreSpecializationCourses(user.student_id), // Default for Core Specialisation
    };
    
    const fetchFunction = fetchMap[tabName] || (() => api.getCourses());
    
    try {
      const data = await fetchFunction();
      const rawList = Array.isArray(data) ? data : (data.courses || []);
      const grouped = rawList.reduce((acc, course) => {
        const sem = course.course_semester || 'Other';
        if (!acc[sem]) acc[sem] = [];
        acc[sem].push(course);
        return acc;
      }, {});
      
      setCurriculumPool(grouped);
      setExpandedSem(null);
    } catch (err) { 
      console.error(err); 
      setCurriculumPool({});
    }
  }, [user?.student_id]);

  useEffect(() => { 
    fetchSemesterCredits(); 
    fetchCourseCredits(); 
    fetchUserPlan();
  }, [fetchSemesterCredits, fetchCourseCredits, fetchUserPlan]);

  useEffect(() => { 
    if (view === 'add') fetchPool(activeSubTab); 
  }, [activeSubTab, view, fetchPool]);

  // Update credit limits when semester data changes or when entering add view
  useEffect(() => {
    if (view === 'add') {
      const targetSemester = isEditing ? selectedSem?.number : savedSemesters.length + 1;
      if (targetSemester) {
        // Calculate and set the credit limit based on previous semester GPA
        const limit = updateCreditLimitForSemester(targetSemester);
        console.log(`Credit limit for semester ${targetSemester}: ${limit}`);
      }
    }
  }, [view, isEditing, selectedSem, savedSemesters.length, updateCreditLimitForSemester]);

  // Update credit limits for all saved semesters when data loads
  useEffect(() => {
    if (savedSemesters.length > 0) {
      savedSemesters.forEach(sem => {
        updateCreditLimitForSemester(sem.number);
      });
    }
  }, [savedSemesters, updateCreditLimitForSemester]);

  const resetForm = () => {
    setCurrentSelection([]);
    setSemStatus('Planned');
    setIsEditing(false);
    setSelectedSem(null);
    setView('list');
    setSearchQuery('');
    setPendingError(null);
    setCreditLimitError(null);
  };

  const calculateCurrentCredits = () => 
    currentSelection.reduce((total, course) => 
      total + (courseCreditsMap[course.course_code] || 3), 0);

  const getGradeColor = (grade) => {
    const map = {
      'A': '#4CAF50', 'B': '#CDDC39', 'C': '#FF9800', 'D': '#FF5722', 'F': '#F44336'
    };
    return map[grade?.charAt(0)] || '#888';
  };

  // Get max credits for UI display
  const getMaxCreditsDisplay = (semesterNumber) => {
    if (!semesterNumber) return 15;
    return creditLimits[semesterNumber] || 15;
  };

  // Check if current credits exceed the limit
  const isExceedingLimit = (currentCredits, semesterNumber) => {
    const maxLimit = getMaxCreditsDisplay(semesterNumber);
    return currentCredits > maxLimit;
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
              <button className="modal-cancel-btn" onClick={() => setPendingError(null)}>Cancel & Fix</button>
              <button className="modal-save-anyway-btn" onClick={() => handleSaveSemester(true)}>Save Anyway</button>
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
              <button className="modal-cancel-btn" onClick={() => setCreditLimitError(null)}>Cancel & Fix</button>
              <button className="modal-save-anyway-btn" onClick={handleSaveAnywayWithCreditLimit}>Save Anyway</button>
            </div>
          </div>
        </div>
      )}
      
      <div className="dashboard-content">
        <div className="header-row">
          <h2 className="dashboard-title">Academic Study Plan</h2>
          <div className="report-button-container">
            <button onClick={handleGeneratePDF} className="download-report-btn" disabled={isGeneratingReport}>
              <FaFilePdf className="pdf-icon" />
              {isGeneratingReport ? 'Generating PDF...' : 'Download PDF Report'}
            </button>
          </div>
        </div>
        
        {view === 'list' && (
          <div className="sem-buttons-grid">
            {savedSemesters.map((sem) => (
              <button 
                key={sem.number} 
                className="sem-button"
                style={{ borderLeft: `4px solid ${sem.status === 'Complete' ? '#81c784' : sem.status === 'Current' ? '#64b5f6' : '#555'}` }}
                onClick={() => { setSelectedSem(sem); setView('view'); }}
              >
                <div className="sem-card-header">
                  <span className="sem-title">Semester {sem.number}</span>
                  <div className="sem-badges">
                    <span className="gpa-badge">GPA: {sem.gpa}</span>
                    <span className="credit-badge">Credits: {semesterCredits[sem.number] || 0}</span>
                  </div>
                </div>
                <div className="sem-card-footer">
                  <div className="course-count">{sem.courses.length} Courses</div>
                  <span className="status-label">{sem.status}</span>
                </div>
              </button>
            ))}
            <button className="sem-button add-button" onClick={() => { resetForm(); setView('add'); }}>
              <FaPlus className="plus-icon" /> 
              <span className="add-text">Add Semester {savedSemesters.length + 1}</span>
            </button>
          </div>
        )}

        {view === 'view' && selectedSem && (
          <div className="glass-card view-card">
            <div className="view-header">
              <button className="back-btn" onClick={() => setView('list')}><FaChevronLeft /> Back</button>
              <div className="action-btns">
                <button className="edit-btn" onClick={() => { setCurrentSelection(selectedSem.courses); setSemStatus(selectedSem.status); setIsEditing(true); setView('add'); }}><FaEdit /> Edit</button>
                <button className="delete-btn" onClick={async () => { if(window.confirm(`Delete Semester ${selectedSem.number}?`)) { await api.deleteSemester(user.student_id, selectedSem.number); setSavedSemesters(prev => prev.filter(sem => sem.number !== selectedSem.number)); await fetchSemesterCredits(); await fetchUserPlan(); resetForm(); } }}><FaTrash /> Delete</button>
              </div>
            </div>
            
            {/* Credit warning display for viewed semesters */}
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
                <h3 className="view-sem-title">Semester {selectedSem.number} Details</h3>
                <div className="status-badge">{selectedSem.status}</div>
              </div>
              <div className="gpa-box">
                <div className="gpa-label">Semester GPA</div>
                <div className="gpa-value">{selectedSem.gpa}</div>
                <div className="gpa-label">Credits: {semesterCredits[selectedSem.number] || 0} / {getMaxCreditsDisplay(selectedSem.number)}</div>
              </div>
            </div>
            
            <div className="table-container">
              <div className="table-header">
                <span style={{flex: 1, paddingLeft: '10px'}}>Course Details</span>
                <span style={{width: '80px', textAlign: 'center'}}>Credits</span>
                <span className="grade-header">Grade</span>
              </div>
              {selectedSem.courses.map(course => (
                <div key={course.course_code} className="course-row">
                  <div style={{flex: 1, paddingLeft: '10px'}}>
                    <div style={{color:'white', fontWeight:'bold'}}>{course.course_code}</div>
                    <div style={{color:'white', opacity: 0.6, fontSize:'14px'}}>{course.course_name}</div>
                  </div>
                  <span style={{width: '80px', textAlign: 'center', color: '#64b5f6'}}>{courseCreditsMap[course.course_code] || 3}</span>
                  <span className="grade-display" style={{ width: '70px', textAlign: 'center', color: getGradeColor(course.grade) }}>{course.grade || '-'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'add' && (
          <div className="builder-grid">
            <div className={`glass-card drop-zone ${isDraggingOver ? 'dragging-over' : ''}`} onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }} onDragLeave={() => setIsDraggingOver(false)} onDrop={(e) => { setIsDraggingOver(false); const course = JSON.parse(e.dataTransfer.getData("course")); handleAddCourse(course); }}>
              <div className="builder-header">
                <h4 className="builder-title">{isEditing ? `Editing Sem ${selectedSem?.number}` : `New Semester`}</h4>
                <div className="builder-controls">
                  <div className="status-toggle-group">
                    {['Planned', 'Current', 'Complete'].map(s => (
                      <button key={s} type="button" onClick={() => setSemStatus(s)} className="status-tab" style={{ background: semStatus === s ? '#81c784' : 'transparent', color: semStatus === s ? '#000' : '#888' }}>{s}</button>
                    ))}
                  </div>
                  
                  <div className="credit-counter" style={{ 
                    borderColor: isExceedingLimit(calculateCurrentCredits(), isEditing ? selectedSem?.number : savedSemesters.length + 1) ? '#ff6b6b' : 'rgba(255,255,255,0.1)', 
                    backgroundColor: isExceedingLimit(calculateCurrentCredits(), isEditing ? selectedSem?.number : savedSemesters.length + 1) ? 'rgba(255, 107, 107, 0.1)' : 'transparent' 
                  }}>
                    <span style={{ 
                      color: isExceedingLimit(calculateCurrentCredits(), isEditing ? selectedSem?.number : savedSemesters.length + 1) ? '#ff6b6b' : '#81c784', 
                      fontWeight: 'bold' 
                    }}>
                      {calculateCurrentCredits()}
                    </span>/{getMaxCreditsDisplay(isEditing ? selectedSem?.number : savedSemesters.length + 1)} Max
                    {isExceedingLimit(calculateCurrentCredits(), isEditing ? selectedSem?.number : savedSemesters.length + 1) && (
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
                          <td style={{ textAlign: 'center', color: '#64b5f6' }}>{courseCreditsMap[course.course_code] || 3}</td>
                          {semStatus === 'Complete' && (
                            <td style={{ textAlign: 'center' }}>
                              <select className="grade-select-small" value={course.grade} onChange={(e) => setCurrentSelection(currentSelection.map(c => c.course_code === course.course_code ? {...c, grade: e.target.value} : c))}>
                                <option value="">-</option>
                                {gradeOptions.map(g => <option key={g} value={g}>{g}</option>)}
                              </select>
                            </td>
                          )}
                          <td style={{ textAlign: 'center' }}>
                            <FaTrash onClick={() => setCurrentSelection(currentSelection.filter(c => c.course_code !== course.course_code))} className="trash-icon" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              
              <div className="btn-row">
                <button className="cancel-btn" onClick={resetForm}>Cancel</button>
                <button className="save-btn" onClick={() => handleSaveSemester(false)} disabled={isSaving || currentSelection.length === 0} style={{ opacity: isSaving ? 0.7 : 1 }}>
                  {isSaving ? 'Saving...' : 'Save Semester'}
                </button>
              </div>
            </div>
            
            <div className="glass-card pool-card">
              <div className="search-box">
                <FaSearch className="search-icon" />
                <input type="text" placeholder="Search..." className="search-input" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
              
              {/* Main tabs */}
              <div className="course-type-toggle-group">
                <button 
                  className={`course-type-tab ${activeMainTab === 'core' ? 'active' : ''}`}
                  onClick={() => setActiveMainTab('core')}
                >
                  General Pathway
                </button>
                <button 
                  className={`course-type-tab ${activeMainTab === 'spec' ? 'active' : ''}`}
                  onClick={() => setActiveMainTab('spec')}
                >
                  Core Specialisation
                </button>
              </div>
              
              {/* Sub-tabs */}
              {activeMainTab === 'core' && (
                <div className="sub-tabs">
                  {['All','NR','UR','CC','CD'].map(sub => (
                    <button 
                      key={sub}
                      className={`sub-tab ${activeSubTab === sub ? 'active' : ''}`}
                      onClick={() => setActiveSubTab(sub)}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              )}
              
              {activeMainTab === 'spec' && (
                <div className="sub-tabs">
                  {['Offshore','Environmental','Sustainability','Renewable Energy'].map(sub => (
                    <button 
                      key={sub}
                      className={`sub-tab ${activeSubTab === sub ? 'active' : ''}`}
                      onClick={() => setActiveSubTab(sub)}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              )}
              
              <div className="pool-list-fixed">
                {Object.keys(curriculumPool).length > 0 ? (
                  Object.keys(curriculumPool)
                    .sort((a, b) => (parseInt(a) || 0) - (parseInt(b) || 0))
                    .map(sem => (
                      <div key={sem} style={{ marginBottom: '10px' }}>
                        <div className="semester-header-label clickable" onClick={() => setExpandedSem(expandedSem === sem ? null : sem)} style={{ background: expandedSem === sem ? 'rgba(129, 199, 132, 0.1)' : 'rgba(255,255,255,0.03)' }}>
                          <span style={{ fontWeight: 'bold' }}>Semester {sem}</span>
                          <span>{expandedSem === sem ? '−' : '+'}</span>
                        </div>
                        {expandedSem === sem && (
                          <div className="semester-courses">
                            {curriculumPool[sem].filter(c => c.course_name?.toLowerCase().includes(searchQuery.toLowerCase()) || c.course_code?.toLowerCase().includes(searchQuery.toLowerCase())).map(course => (
                              <div key={course.course_code} draggable onDragStart={(e) => e.dataTransfer.setData("course", JSON.stringify(course))} onClick={() => handleAddCourse(course)} className="draggable-item">
                                <div style={{color:'white', fontWeight:'bold'}}>{course.course_code}</div>
                                <div style={{fontSize: '12px', color: '#ccc'}}>{course.course_name}</div>
                                <div style={{fontSize: '10px', color: '#ffb74d', marginTop: '5px'}}>
                                  Credits: {course.credit_hour} | Pre: {Array.isArray(course.pre_requisite) ? course.pre_requisite.join(', ') : (course.pre_requisite || 'None')}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                ) : (
                  <div className="empty-state">Select a category or semester</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StudyPlan;
