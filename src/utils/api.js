// api.js
const API_BASE = "https://study-plan-backend.onrender.com";

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
  console.error("Server says:", errorData); 
  throw new Error(`API Error: ${response.status}`);
}

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// API function
export const api = {
  // --- AUTH ---
  login: (email, password) =>
    fetchAPI('/student/login', {
      method: 'POST',
      body: JSON.stringify({ student_email: email, student_password: password })
    }),

register: (userData) =>
  fetchAPI('/student/register', {
    method: 'POST',
    body: JSON.stringify(userData) 
  }),

  // --- PROFILE ---
  getProfile: (studentId) =>
    fetchAPI(`/student/${studentId}`),

  updateProfile: (studentId, data) =>
    fetchAPI(`/student/update/${studentId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  // --- DASHBOARD ---
  getCourseSummary: (studentId) =>
    fetchAPI(`/student_course/Summary/${studentId}`),

  getCourseList: (studentId) =>
    fetchAPI(`/student_course/get/${studentId}`),

  // --- STUDY PLAN ---
  getStudentPlan: (studentId) =>
    fetchAPI(`/student_course/get/${studentId}`),

  getGPA: (studentId, semNum) =>
    fetchAPI(`/student_course/GPA/${studentId}/${semNum}`),

  getSummary: (studentId) =>
    fetchAPI(`/student_course/Summary/${studentId}`),

  getCourses: () =>
    fetchAPI(`/course/get`),

  getPool: (endpoint) =>
    fetchAPI(`/${endpoint}`),

  addCourse: (payload) =>
    fetchAPI(`/student_course/add`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  deleteSemester: (studentId, semNum) =>
    fetchAPI(`/student_course/delete/semester/${studentId}/${semNum}`, {
      method: 'DELETE',
    }),

  getReportData: (studentId) =>
    fetchAPI(`/report/report-data/${studentId}`),

  // --- COURSE AVAILABILITY ---
  getCoreDisciplineCourses: (studentId) =>
    fetchAPI(`/course/get/CourseAvailable/CoreDiscipline/${studentId}`),

  getNationalRequirementCourses: (studentId) =>
    fetchAPI(`/course/get/CourseAvailable/NationalRequirement/${studentId}`),

  getUniversityRequirementCourses: (studentId) =>
    fetchAPI(`/course/get/CourseAvailable/UniversityRequirement/${studentId}`),

  getCommonCourses: (studentId) =>
    fetchAPI(`/course/get/CourseAvailable/CommonCourse/${studentId}`),

  getCoreSpecializationCourses: (studentId) =>
    fetchAPI(`/course/get/CourseAvailable/CoreSpecialization/${studentId}`),

  // --- AI ADVISOR ---
  getAIAnalysis: (studentId) =>
    fetchAPI(`/advisor/ai-advisor/${studentId}`)
};