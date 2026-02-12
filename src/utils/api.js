
import { createClient } from '@supabase/supabase-js';

const API_BASE = import.meta.env.VITE_API_BASE;
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const fetchAPI = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      ...options
    });
    if (!response.ok) {
      const errorData = await response.json(); 
      throw new Error(errorData.message || `${response.status}`);
    }
    return await response.json();
  } catch (error) {
    throw error;
  }
};

export const api = {
  // --- AUTH ---
  loginWithGoogle: async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/Dashboard',
      },
    });
    if (error) throw error;
    return data;
  },

  // --- PROFILE ---
getProfile: (studentId) => fetchAPI(`/student/${studentId}`),
updateProfile: (studentId, data) =>
  fetchAPI(`/student/update/${studentId}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),

  // --- GRADUATE ON TIME ---
  getGraduateOnTime: (studentId) => fetchAPI(`/student/graduate-on-time/${studentId}`),

  // --- DASHBOARD ---
  getCompletedCourse: (studentId) => fetchAPI(`/student_course/CompletedCourse/${studentId}`),  
  getCourseSummary: (studentId) => fetchAPI(`/student_course/Summary/${studentId}`),
  getCourseList: (studentId) => fetchAPI(`/student_course/get/${studentId}`),
  getPlannedCourse: (studentId) => fetchAPI(`/student_course/PlannedCourse/${studentId}`),
  getCurrentCourse: (studentId) => fetchAPI(`/student_course/CurrentCourse/${studentId}`),

  
// --- STUDY PLAN ---
getStudentPlan: (studentId) => fetchAPI(`/student_course/get/${studentId}`),
getGPA: (studentId, semNum) => fetchAPI(`/student_course/GPA/${studentId}/${semNum}`),
getSummary: (studentId) => fetchAPI(`/student_course/Summary/${studentId}`),
getSemesterStanding: (studentId, semester) => fetchAPI(`/student_course/get/Standing/${studentId}/${semester}`),

getCourses: (studentId) => {
  if (studentId) {
    return fetchAPI(`/course/get/all/${studentId}`);

  }
},
getPool: (endpoint) => fetchAPI(`/${endpoint}`),
  addCourse: (payload) =>
    fetchAPI(`/student_course/add`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }).then(response => {
      
      return response;

    }),
  deleteSemester: (studentId, semNum) =>
    fetchAPI(`/student_course/delete/semester/${studentId}/${semNum}`, {
      method: 'DELETE',
    }),


  deleteCourse: (studentId, courseCode, semester) =>
    fetchAPI(`/student_course/delete/course/${studentId}/${courseCode}/${semester}`, {
      method: 'DELETE',
    }),
    
  updateStudentCourse: (studentId, courseCode, semester, data) =>
    fetchAPI(`/student_course/update/StudentCourse/${studentId}/${courseCode}/${semester}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  getReportData: (studentId) => fetchAPI(`/report/report-data/${studentId}`),

  // --- COURSE AVAILABILITY ---
  getCoreDisciplineCourses: (studentId) => fetchAPI(`/course/get/CourseAvailable/CoreDiscipline/${studentId}`),
  getNationalRequirementCourses: (studentId) => fetchAPI(`/course/get/CourseAvailable/NationalRequirement/${studentId}`),
  getUniversityRequirementCourses: (studentId) => fetchAPI(`/course/get/CourseAvailable/UniversityRequirement/${studentId}`),
  getCommonCourses: (studentId) => fetchAPI(`/course/get/CourseAvailable/CommonCourse/${studentId}`),
  getCoreSpecializationCourses: (studentId) => fetchAPI(`/course/get/CourseAvailable/CoreSpecialization/${studentId}`),

  // --- MY COURSE ---
  getAllNational: (studentId) => fetchAPI(`/course/get/NationalRequirement/${studentId}`),
  getAllUniversity: (studentId) => fetchAPI(`/course/get/UniversityRequirement/${studentId}`),
  getAllCommon: (studentId) => fetchAPI(`/course/get/CommonCourse/${studentId}`),
  getAllCoreDiscipline: (studentId) => fetchAPI(`/course/get/CoreDiscipline/${studentId}`),
  getAllSpecialization: (studentId) => fetchAPI(`/course/get/CoreSpecialization/${studentId}`),

  // --- AI ADVISOR ---
  getAIAnalysis: (studentId) => fetchAPI(`/advisor/ai-advisor/${studentId}`)
};
