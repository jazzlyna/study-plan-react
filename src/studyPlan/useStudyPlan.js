// useStudyPlan.js - UPDATED VERSION (with probation-based credit limit)
import { useState, useEffect, useCallback } from 'react';
import { generatePDFReport } from '../utils/reportGenerator';
import { api } from "../utils/api";

export const useStudyPlan = (user) => {
  const [view, setView] = useState('list');
  const [savedSemesters, setSavedSemesters] = useState([]);
  const [currentSelection, setCurrentSelection] = useState([]);
  const [semStatus, setSemStatus] = useState('Planned');
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

  // UPDATED: Fetch credit limit with probation check
  const fetchCreditLimitFromSummary = useCallback(async () => {
    if (!user?.student_id) return;
    
    try {
      const summaryData = await api.getSummary(user.student_id);
      
      // Check if student is on probation
      // Option 1: Check if probation status is directly available
      const isOnProbation = summaryData.academic_meta?.is_probation || 
                           summaryData.is_probation || 
                           false;
      
      // Option 2: Determine probation by GPA (if GPA < 2.0)
      let gpaBasedProbation = false;
      if (summaryData.current_gpa !== undefined) {
        gpaBasedProbation = summaryData.current_gpa < 2.0;
      }
      
      // Set credit limit based on probation status
      const finalIsOnProbation = isOnProbation || gpaBasedProbation;
      
      if (finalIsOnProbation) {
        setCreditLimit(11); // Probation limit
      } else {
        // Use the backend max_limit if available, otherwise default to 15
        setCreditLimit(summaryData.academic_meta?.max_limit || 15);
      }
      
    } catch (err) {
      console.error("Error fetching credit limit from summary:", err);
      // Default to 15 if there's an error
      setCreditLimit(15);
    }
  }, [user?.student_id]);

  const calculateCurrentCredits = () => 
    currentSelection.reduce((total, course) => 
      total + (courseCreditsMap[course.course_code] || 3), 0);

  const getMaxCreditsDisplay = useCallback((semesterNumber) => {
    // Always return the single credit limit for all semesters
    return creditLimit;
  }, [creditLimit]);

  const isExceedingLimit = useCallback((currentCredits, semesterNumber) => {
    const maxLimit = getMaxCreditsDisplay(semesterNumber);
    return currentCredits > maxLimit;
  }, [getMaxCreditsDisplay]);

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
          
          if (response.academic_meta && response.academic_meta.limit_exceeded) {
            if (response.academic_meta.max_limit) {
              setCreditLimit(response.academic_meta.max_limit);
            }
            
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
        // Refresh credit limits after save
        await fetchCreditLimitFromSummary();
        resetForm();
      }
    } catch (error) {
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

      // Fetch credit limits after loading semesters
      await fetchCreditLimitFromSummary();

    } catch (err) { 
      console.error("Error fetching user plan:", err); 
    }
  }, [user?.student_id, fetchCreditLimitFromSummary]);

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
      
      // Also fetch credit limits when we get summary data
      // This will be handled by fetchCreditLimitFromSummary
    } catch (err) { 
      console.error("Error fetching semester credits:", err); 
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
      console.error("Error fetching course credits:", err); 
    }
  }, []);

  const fetchPool = useCallback(async (tabName) => {
    const fetchMap = {
      'All': () => api.getCourses(),
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
      const maxLimit = getMaxCreditsDisplay(selectedSem.number);
      
      if (semCredits > maxLimit) {
        console.warn(`Semester ${selectedSem.number} exceeds credit limit: ${semCredits} > ${maxLimit}`);
      }
    }
  }, [view, selectedSem, semesterCredits, getMaxCreditsDisplay]);

  // Fetch credit limit when component mounts
  useEffect(() => {
    if (user?.student_id) {
      fetchCreditLimitFromSummary();
    }
  }, [user?.student_id, fetchCreditLimitFromSummary]);

  // Also fetch when entering add/edit mode
  useEffect(() => {
    if (view === 'add' && user?.student_id) {
      fetchCreditLimitFromSummary();
    }
  }, [view, user?.student_id, fetchCreditLimitFromSummary]);

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

  return {
    view, setView, savedSemesters, setSavedSemesters, currentSelection, setCurrentSelection,
    semStatus, setSemStatus, selectedSem, setSelectedSem, isEditing, setIsEditing,
    searchQuery, setSearchQuery, activeMainTab, setActiveMainTab, activeSubTab, setActiveSubTab,
    curriculumPool, isDraggingOver, setIsDraggingOver, semesterCredits, courseCreditsMap,
    isSaving, pendingError, setPendingError, isGeneratingReport, expandedSem, setExpandedSem,
    creditLimitError, setCreditLimitError,
    creditLimit, // Add this
    gradeOptions, handleAddCourse, handleSaveAnywayWithCreditLimit, handleSaveSemester,
    handleGeneratePDF, fetchPool, resetForm, calculateCurrentCredits, getMaxCreditsDisplay,
    isExceedingLimit, getCleanPrereq, getGradeColor,
    fetchCreditLimitFromSummary
  };
};