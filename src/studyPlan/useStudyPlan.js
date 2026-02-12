import { useState, useEffect, useCallback } from 'react';
import { generatePDFReport } from '../utils/reportGenerator';
import { api } from "../utils/api";

export const useStudyPlan = (user) => {
  const [view, setView] = useState('list');
  const [savedSemesters, setSavedSemesters] = useState([]);
  const [currentSelection, setCurrentSelection] = useState([]);
  const [semStatus, setSemStatus] = useState('Completed');
  const [selectedSem, setSelectedSem] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMainTab, setActiveMainTab] = useState('core');
  const [activeSubTab, setActiveSubTab] = useState('All');
  const [curriculumPool, setCurriculumPool] = useState({}); 
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [semesterCredits, setSemesterCredits] = useState({});
  const [courseCreditsMap, setCourseCreditsMap] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [pendingError, setPendingError] = useState(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [expandedSem, setExpandedSem] = useState(null);
  const [creditLimitError, setCreditLimitError] = useState(null);
  // SIMPLIFY: Use single credit limit for all semesters
  const [creditLimit, setCreditLimit] = useState(15);
  
  const gradeOptions = ["A", "A-", "B+", "B", "B-", "C+", "C", "D", "F"];

  const getCleanPrereq = (val) => {
    if (!val) return null;
    const ignore = ["null", "none", "-", "", "undefined", "n/a", "[]"];
    return ignore.includes(String(val).trim().toLowerCase()) ? null : String(val).trim();
  };

  // UPDATED: Fetch credit limit directly from backend for specific semester
  const fetchCreditLimitFromSummary = useCallback(async (semesterNumber) => {
    if (!user?.student_id) return 15;
    
    try {
      const standingData = await api.getSemesterStanding(user.student_id, semesterNumber);
      
      // Use the max_limit directly from backend
      if (standingData?.academic_meta?.max_limit !== undefined) {
        return standingData.academic_meta.max_limit;
      }
      
      // Fallback to 15 if no data
      return 15;
    } catch (err) {
      console.error("Error fetching credit limit from standing:", err);
      // Default to 15 if there's an error
      return 15;
    }
  }, [user?.student_id]);

  const calculateCurrentCredits = () => 
    currentSelection.reduce((total, course) => 
      total + (courseCreditsMap[course.course_code] || 3), 0);

  const getMaxCreditsDisplay = useCallback(async (semesterNumber) => {
    // Fetch directly from backend for this specific semester
    return await fetchCreditLimitFromSummary(semesterNumber);
  }, [fetchCreditLimitFromSummary]);

  const isExceedingLimit = useCallback(async (currentCredits, semesterNumber) => {
    const maxLimit = await fetchCreditLimitFromSummary(semesterNumber);
    return currentCredits > maxLimit;
  }, [fetchCreditLimitFromSummary]);

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

  // UPDATED handleSaveSemester function to use proper edit endpoint
  const handleSaveSemester = async (bypass = false) => {
    const targetSemester = parseInt(isEditing ? selectedSem.number : savedSemesters.length + 1);
    
    if (!bypass) {
      let errorMsg = null;
      
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
      
      const currentCredits = calculateCurrentCredits();
      // Fetch max limit directly from backend for this semester
      const maxLimit = await fetchCreditLimitFromSummary(targetSemester);
      
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
      // NEW LOGIC: Use proper edit endpoint when editing
      if (isEditing) {
        // Track which courses need to be deleted (removed from selection)
        const currentCourseCodes = currentSelection.map(c => c.course_code);
        const coursesToDelete = selectedSem.courses.filter(
          c => !currentCourseCodes.includes(c.course_code)
        );
        
        // Delete courses that were removed
        for (const courseToDelete of coursesToDelete) {
          await api.deleteCourse(
            user.student_id,
            courseToDelete.course_code,
            targetSemester
          );
        }
        
        // Update or add each course in the current selection
        for (const course of currentSelection) {
          const payload = {
            course_code: String(course.course_code),
            grade: semStatus === 'Completed' ? (course.grade || "") : "",
            status: semStatus === 'Completed' ? 'Completed' : (semStatus === 'Current' ? 'Current' : 'Planned'),
            semester: targetSemester
          };
          
          // Check if this course already exists in the semester
          const courseExistsInOriginal = selectedSem.courses.some(
            c => c.course_code === course.course_code
          );
          
          if (courseExistsInOriginal) {
            // Update existing course
            await api.updateStudentCourse(
              user.student_id,
              course.course_code,
              targetSemester,
              payload
            );
          } else {
            // Add new course to the semester
            await api.addCourse({
              student_id: String(user.student_id).trim(),
              course_code: String(course.course_code),
              semester: targetSemester,
              grade: semStatus === 'Completed' ? (course.grade || "") : "",
              status: semStatus === 'Completed' ? 'Completed' : (semStatus === 'Current' ? 'Current' : 'Planned')
            });
          }
        }
      } else {
        // For NEW semesters, use the existing addCourse logic
        for (const course of currentSelection) {
          const payload = {
            student_id: String(user.student_id).trim(),
            course_code: String(course.course_code),
            semester: targetSemester,
            grade: semStatus === 'Completed' ? (course.grade || "") : "",
            status: semStatus === 'Completed' ? 'Completed' : (semStatus === 'Current' ? 'Current' : 'Planned')
          };
          
          await api.addCourse(payload);
        }
      }
      
      // Refresh data after save
      await fetchUserPlan();
      resetForm();
      
    } catch (error) {
      console.error("Error saving semester:", error);
      alert("System Error: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const getGradeColor = (grade) => {
    const map = {
      'A': '#4CAF50', 'B': '#CDDC39', 'C': '#FF9800', 'D': '#FF5722', 'F': '#F44336'
    };
    return map[grade?.charAt(0)] || '#888';
  };

  const handleGeneratePDF = async () => {
    if (!user?.student_id) {
      alert("User information not available");
      return;
    }
    
    setIsGeneratingReport(true);
    try {
      const reportData = await api.getReportData(user.student_id);
      if (!reportData || !reportData.student_info) {
        throw new Error("No report data available");
      }
      await generatePDFReport(user, reportData);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert(`Failed to generate PDF report: ${error.message}`);
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
          return { 
            ...sem, 
            gpa: gpaData.student_gpa || "0.00"
          };
        })
      );
      
      setSavedSemesters(finalized.sort((a, b) => a.number - b.number));

    } catch (err) { 
      console.error("Error fetching user plan:", err); 
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
      console.error("Error fetching semester credits:", err); 
    }
  }, [user?.student_id]);

  const fetchCourseCredits = useCallback(async () => {
    try {
      const data = await api.getCourses(user?.student_id);
      if (Array.isArray(data)) {
        const map = {};
        data.forEach(c => map[c.course_code] = c.credit_hour);
        setCourseCreditsMap(map);
      }
    } catch (err) { 
      console.error("Error fetching course credits:", err); 
    }
  }, [user?.student_id]);

  const fetchPool = useCallback(async (tabName) => {
    const fetchMap = {
      'All': () => api.getCourses(user?.student_id),
      'NR': () => api.getNationalRequirementCourses(user.student_id),
      'UR': () => api.getUniversityRequirementCourses(user.student_id),
      'CC': () => api.getCommonCourses(user.student_id),
      'CD': () => api.getCoreDisciplineCourses(user.student_id),
      'Offshore': async () => {
        const allCourses = await api.getCoreSpecializationCourses(user.student_id);
        return Array.isArray(allCourses) 
          ? allCourses.filter(course => course.specialization === 'Offshore' || course.course_name?.includes('Offshore'))
          : [];
      },
      'Environmental': async () => {
        const allCourses = await api.getCoreSpecializationCourses(user.student_id);
        return Array.isArray(allCourses) 
          ? allCourses.filter(course => course.specialization === 'Environmental' || course.course_name?.includes('Environmental'))
          : [];
      },
      'Sustainability': async () => {
        const allCourses = await api.getCoreSpecializationCourses(user.student_id);
        return Array.isArray(allCourses) 
          ? allCourses.filter(course => course.specialization === 'Sustainability' || course.course_name?.includes('Sustainability'))
          : [];
      },
      'Renewable Energy': async () => {
        const allCourses = await api.getCoreSpecializationCourses(user.student_id);
        return Array.isArray(allCourses) 
          ? allCourses.filter(course => course.specialization === 'Renewable Energy' || course.course_name?.includes('Renewable'))
          : [];
      },
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
      console.error("Error fetching pool:", err); 
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

  // Check for existing limit violations when viewing semesters
  useEffect(() => {
    if (view === 'view' && selectedSem) {
      const semCredits = semesterCredits[selectedSem.number] || 0;
      // Fetch max limit for this semester
      fetchCreditLimitFromSummary(selectedSem.number).then(maxLimit => {
        if (semCredits > maxLimit) {
          console.warn(`Semester ${selectedSem.number} exceeds credit limit: ${semCredits} > ${maxLimit}`);
        }
      });
    }
  }, [view, selectedSem, semesterCredits, fetchCreditLimitFromSummary]);

  const resetForm = () => {
    setCurrentSelection([]);
    setSemStatus('Completed');
    setIsEditing(false);
    setSelectedSem(null);
    setView('list');
    setSearchQuery('');
    setPendingError(null);
    setCreditLimitError(null);
  };

  return {
    view, setView, savedSemesters, setSavedSemesters, currentSelection, setCurrentSelection,
    semStatus, setSemStatus, selectedSem, setSelectedSem, isEditing, setIsEditing,
    searchQuery, setSearchQuery, activeMainTab, setActiveMainTab, activeSubTab, setActiveSubTab,
    curriculumPool, isDraggingOver, setIsDraggingOver, semesterCredits, courseCreditsMap,
    isSaving, pendingError, setPendingError, isGeneratingReport, expandedSem, setExpandedSem,
    creditLimitError, setCreditLimitError,
    creditLimit, // Keep this for backward compatibility
    gradeOptions, handleAddCourse, handleSaveAnywayWithCreditLimit, handleSaveSemester,
    handleGeneratePDF, fetchPool, resetForm, calculateCurrentCredits, getMaxCreditsDisplay,
    isExceedingLimit, getCleanPrereq, getGradeColor,
    fetchCreditLimitFromSummary  
  };
};