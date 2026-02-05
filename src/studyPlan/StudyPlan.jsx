import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, Trash2, Save, X, AlertTriangle, FileText, 
  ChevronRight, ChevronDown, LayoutGrid, List, Info, 
  Search, BookOpen, GraduationCap, Calendar, CheckCircle2 
} from 'lucide-react';
import { api } from './api';

const StudyPlan = ({ student_id }) => {
  const [view, setView] = useState('list');
  const [savedSemesters, setSavedSemesters] = useState([]);
  const [currentSelection, setCurrentSelection] = useState([]);
  const [selectedSem, setSelectedSem] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMainTab, setActiveMainTab] = useState('core');
  const [activeSubTab, setActiveSubTab] = useState('All');
  const [curriculumPool, setCurriculumPool] = useState(null);
  const [semesterCredits, setSemesterCredits] = useState({});
  const [courseCreditsMap, setCourseCreditsMap] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [pendingError, setPendingError] = useState(null);
  const [creditLimitError, setCreditLimitError] = useState(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [semStatus, setSemStatus] = useState('Planned'); // Added from second code
  const gradeOptions = ["A", "A-", "B+", "B", "B-", "C+", "C", "D", "F"]; // Added from second code

  const getCleanPrereq = (prereq) => {
    if (!prereq || prereq === "none" || prereq === "-" || prereq === "---" || prereq === "undefined" || prereq === "n/a") return null;
    return typeof prereq === 'string' ? prereq.split(',').map(s => s.trim().toUpperCase()) : [String(prereq).toUpperCase()];
  };

  const handleAddCourse = (course) => {
    // Check for duplicate in current selection
    if (currentSelection.some(c => c.course_code === course.course_code)) {
      alert(`You have already added [${course.course_code}] to this semester.`);
      return;
    }
    
    // Check if course already exists in saved semesters
    let existingRecord = null;
    let existingSemNumber = null;
    savedSemesters.forEach(sem => {
      const found = sem.courses.find(c => c.course_code === course.course_code);
      if (found) {
        existingRecord = found;
        existingSemNumber = sem.number;
      }
    });

    // Check if course already taken
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
    
    // Check prerequisites
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
    if (!student_id) return;
    setCreditLimitError(null);
    setIsSaving(true);

    // Calculate target semester
    const targetSemester = isEditing ? selectedSem.number : savedSemesters.length + 1;
    
    // CREDIT LIMIT VALIDATION
    if (!bypass) {
      let errorMsg = null;
      
      // Calculate current credits
      const currentCredits = calculateCurrentCredits();
      
      // Determine max credits based on previous semester GPA
      const prevSemesterNumber = targetSemester - 1;
      const prevSemester = savedSemesters.find(sem => sem.number === prevSemesterNumber);
      const prevSemesterGPA = prevSemester ? parseFloat(prevSemester.gpa) : 0;
      const maxCredits = prevSemesterGPA < 2.0 ? 11 : 15;
      
      if (currentCredits > maxCredits) {
        errorMsg = `Credit Limit Exceeded: You have selected ${currentCredits} credits, which exceeds the maximum allowed of ${maxCredits} credits for this semester. Students with GPA below 2.0 are limited to 11 credits, others can take up to 15 credits.`;
        setCreditLimitError(errorMsg);
        setIsSaving(false);
        return;
      }
      
      // PREREQUISITE VALIDATION
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
            errorMsg = `Case A: [${course.course_code}] and its prerequisite [${cleanP}] are in the same semester. You need chair approval / chair approval and an attempt to [${cleanP}] .`;
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
        setIsSaving(false);
        return;
      }
    }

    try {
      // Delete existing semester if editing
      if (isEditing) {
        await api.deleteSemester(student_id, targetSemester);
      }
      
      // Save each course
      for (const course of currentSelection) {
        await api.addCourse({
          student_id: student_id.trim(),
          course_code: course.course_code,
          semester_number: targetSemester,
          grade: semStatus === 'Complete' ? (course.grade || "") : "",
          status: semStatus === 'Complete' ? 'Completed' : (semStatus === 'Current' ? 'Current' : 'Planned')
        });
      }

      await fetchStudentPlan();
      await fetchSemesterCredits();
      resetForm();
    } catch (error) {
      // Handle backend errors (including credit limit errors from backend)
      setCreditLimitError(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const calculateCurrentCredits = () => {
    return currentSelection.reduce((total, course) => 
      total + (courseCreditsMap[course.course_code] || 3), 0);
  };

  const generatePDFReport = async () => {
    if (!student_id) return;
    setIsGeneratingReport(true);
    try {
      const reportData = await api.getReportData(student_id);
      console.log("Generating report with:", reportData);
      // Logic for PDF generation goes here
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const fetchStudentPlan = useCallback(async () => {
    if (!student_id) return;
    try {
      const data = await api.getStudentPlan(student_id);
      const grouped = data.reduce((acc, item) => {
        const semKey = item.semester_number || 'Other';
        if (!acc[semKey]) {
          acc[semKey] = {
            number: semKey,
            status: item.status,
            courses: [],
            gpa: "0.00"
          };
        }
        acc[semKey].courses.push({
          course_code: item.course_code,
          course_name: item.course?.course_name || "Unknown",
          grade: item.grade || "",
          pre_requisite: item.course?.pre_requisite || null
        });
        return acc;
      }, {});

      const finalized = await Promise.all(
        Object.values(grouped).map(async (sem) => {
          try {
            const gpaData = await api.getGPA(student_id, sem.number);
            return { ...sem, gpa: gpaData?.gpa || "0.00" };
          } catch {
            return { ...sem, gpa: "0.00" };
          }
        })
      );
      setSavedSemesters(finalized.sort((a, b) => a.number - b.number));
    } catch (err) {
      console.error(err);
    }
  }, [student_id]);

  const fetchSemesterCredits = useCallback(async () => {
    if (!student_id) return;
    try {
      const data = await api.getSummary(student_id);
      const creditsMap = {};
      Object.entries(data.semester_credits).forEach(([key, value]) => {
        const semNum = key.replace(/\D/g, '');
        if (semNum) creditsMap[semNum] = value;
      });
      setSemesterCredits(creditsMap);
    } catch (err) {
      console.error(err);
    }
  }, [student_id]);

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
    try {
      let fetchFunction;
      switch (tabName) {
        case 'NR': fetchFunction = api.getNationalRequirementCourses; break;
        case 'UR': fetchFunction = api.getUniversityRequirementCourses; break;
        case 'CC': fetchFunction = api.getCommonCourses; break;
        case 'CD': fetchFunction = api.getCoreDisciplineCourses; break;
        default: fetchFunction = api.getCoreSpecializationCourses;
      }

      const data = await fetchFunction(student_id);
      setCurriculumPool(data);
    } catch (err) {
      console.error(err);
    }
  }, [student_id]);

  useEffect(() => {
    if (student_id) {
      fetchStudentPlan();
      fetchSemesterCredits();
      fetchCourseCredits();
    }
  }, [student_id, fetchStudentPlan, fetchSemesterCredits, fetchCourseCredits]);

  useEffect(() => {
    fetchPool(activeSubTab);
  }, [activeSubTab, fetchPool]);

  const resetForm = () => {
    setCurrentSelection([]);
    setSemStatus('Planned');
    setIsEditing(false);
    setSelectedSem(null);
    setSearchQuery('');
    setPendingError(null);
    setCreditLimitError(null);
  };

  const getGradeColor = (grade) => {
    const map = { 
      'A': '#4CAF50', 
      'B': '#CDDC39', 
      'C': '#FF9800', 
      'D': '#FF5722', 
      'F': '#F44336' 
    };
    return map[grade?.charAt(0)] || '#888';
  };

  return (
    <div className="dashboard-wrapper">
      {/* Credit Limit Error Modal */}
      {creditLimitError && (
        <div className="modal-overlay">
          <div className="class-modal-card-content">
            <div className="modal-header">
              <div className="error-title-row">
                <AlertTriangle color="#ff6b6b" size={24} />
                <h3 style={{margin: 0, color: '#ff6b6b'}}>Credit Limit Warning</h3>
              </div>
              <X className="close-icon" onClick={() => setCreditLimitError(null)} />
            </div>
            <div className="modal-body-text">{creditLimitError}</div>
            <div className="modal-footer">
              <button className="modal-cancel-btn" onClick={() => setCreditLimitError(null)}>Cancel & Fix</button>
              <button className="modal-save-anyway-btn" onClick={handleSaveAnywayWithCreditLimit}>Save Anyway</button>
            </div>
          </div>
        </div>
      )}

      {/* Prerequisite Error Modal */}
      {pendingError && (
        <div className="modal-overlay">
          <div className="class-modal-card-content">
            <div className="modal-header">
              <div className="error-title-row">
                <AlertTriangle color="#ff6b6b" size={24} />
                <h3 style={{margin: 0, color: '#ff6b6b'}}>Prerequisite Warning</h3>
              </div>
              <X className="close-icon" onClick={() => setPendingError(null)} />
            </div>
            <div className="modal-body-text">{pendingError}</div>
            <div className="modal-footer">
              <button className="modal-cancel-btn" onClick={() => setPendingError(null)}>Cancel & Fix</button>
              <button className="modal-save-anyway-btn" onClick={() => handleSaveSemester(true)}>Save Anyway</button>
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-content">
        <div className="header-row">
          <h2 className="dashboard-title">Academic Study Plan</h2>
          <button 
            className="download-report-btn" 
            onClick={generatePDFReport}
            disabled={isGeneratingReport}
          >
            {isGeneratingReport ? 'Generating...' : 'Download PDF Report'}
          </button>
        </div>

        {view === 'list' ? (
          <div className="sem-buttons-grid">
            {savedSemesters.map((sem) => (
              <button 
                key={sem.number} 
                className="sem-button"
                onClick={() => { setSelectedSem(sem); setView('view'); }}
              >
                <div className="sem-card-header">
                  <span className="sem-title">Semester {sem.number}</span>
                  <span className="gpa-label">GPA: {sem.gpa}</span>
                  <span className="credit-badge">Credits: {semesterCredits[sem.number] || 0}</span>
                </div>
                <div className="sem-card-footer">
                  <span className="course-count">{sem.courses.length} Courses</span>
                  <span className="status-label">{sem.status}</span>
                </div>
              </button>
            ))}
            <button className="sem-button add-button" onClick={() => { resetForm(); setView('add'); }}>
              <Plus className="plus-icon" />
              <span>Add Semester {savedSemesters.length + 1}</span>
            </button>
          </div>
        ) : view === 'view' && selectedSem && (
          <div className="class-modal-card-content">
            <div className="modal-header">
              <button className="back-btn" onClick={() => setView('list')}><ChevronDown style={{transform: 'rotate(90deg)'}} /> Back</button>
              <h3>Semester {selectedSem.number} Details</h3>
            </div>
            <table className="table-container">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Credits</th>
                  <th>Grade</th>
                </tr>
              </thead>
              <tbody>
                {selectedSem.courses.map(course => (
                  <tr key={course.course_code}>
                    <td>{course.course_name} ({course.course_code})</td>
                    <td>{courseCreditsMap[course.course_code] || '-'}</td>
                    <td style={{color: getGradeColor(course.grade)}}>{course.grade || 'Planned'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {view === 'add' && (
          <div className="builder-container">
            <div className="builder-header">
              <h3>Create Semester {savedSemesters.length + 1}</h3>
              
              {/* Status Toggle */}
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
              
              {/* Credit Counter */}
              <div className="credit-counter">
                <span>Credits: {calculateCurrentCredits()}</span>
                {(() => {
                  const targetSemester = isEditing ? selectedSem?.number : savedSemesters.length + 1;
                  const prevSemesterNumber = targetSemester - 1;
                  const prevSemester = savedSemesters.find(sem => sem.number === prevSemesterNumber);
                  const prevSemesterGPA = prevSemester ? parseFloat(prevSemester.gpa) : 0;
                  const maxCredits = prevSemesterGPA < 2.0 ? 11 : 15;
                  
                  return (
                    <>
                      <span>/ {maxCredits} Max</span>
                      {calculateCurrentCredits() > maxCredits && (
                        <div className="credit-warning">Exceeds limit!</div>
                      )}
                    </>
                  );
                })()}
              </div>
              
              <div className="builder-controls">
                <button className="modal-cancel-btn" onClick={resetForm}>Cancel</button>
                <button 
                  className="save-anyway-btn" 
                  onClick={() => handleSaveSemester(false)} 
                  disabled={isSaving || currentSelection.length === 0}
                >
                  {isSaving ? 'Saving...' : 'Save Semester'}
                </button>
              </div>
            </div>

            <div className="builder-grid">
              <div className="course-selection-list">
                <h4>Selected Courses</h4>
                {currentSelection.length === 0 ? (
                  <div className="empty-state">Drag courses here or click '+' to add</div>
                ) : (
                  <table className="builder-table">
                    <thead>
                      <tr>
                        <th>Course</th>
                        <th>Credits</th>
                        {semStatus === 'Complete' && <th>Grade</th>}
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentSelection.map((course, idx) => (
                        <tr key={idx}>
                          <td>{course.course_name}</td>
                          <td>{courseCreditsMap[course.course_code] || '-'}</td>
                          {semStatus === 'Complete' && (
                            <td>
                              <select 
                                className="grade-select"
                                value={course.grade}
                                onChange={(e) => {
                                  const newSelection = [...currentSelection];
                                  newSelection[idx].grade = e.target.value;
                                  setCurrentSelection(newSelection);
                                }}
                              >
                                <option value="">Planned</option>
                                {gradeOptions.map(g => <option key={g} value={g}>{g}</option>)}
                              </select>
                            </td>
                          )}
                          <td>
                            <Trash2 
                              className="trash-icon" 
                              onClick={() => setCurrentSelection(currentSelection.filter((_, i) => i !== idx))} 
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="pool-container">
                <div className="tabs-row">
                  {['NR', 'UR', 'CC', 'CD', 'SPEC'].map(tab => (
                    <button 
                      key={tab} 
                      className={`tab-btn ${activeSubTab === tab ? 'active' : ''}`}
                      onClick={() => setActiveSubTab(tab)}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <div className="pool-list">
                  {curriculumPool?.map(course => (
                    <div key={course.course_code} className="pool-item">
                      <div className="pool-item-info">
                        <span className="course-code">{course.course_code}</span>
                        <span className="course-name">{course.course_name}</span>
                        <div className="prereq-info">
                          Pre: {Array.isArray(course.pre_requisite) 
                            ? course.pre_requisite.join(', ') 
                            : (course.pre_requisite || 'None')}
                        </div>
                      </div>
                      <Plus className="add-icon" onClick={() => handleAddCourse(course)} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyPlan;