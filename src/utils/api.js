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

  // --- DASHBOARD ---
  getCourseSummary: (studentId) => fetchAPI(`/student_course/Summary/${studentId}`),
  getCourseList: (studentId) => fetchAPI(`/student_course/get/${studentId}`),

  // --- STUDY PLAN ---
  getStudentPlan: (studentId) => fetchAPI(`/student_course/get/${studentId}`),
  getGPA: (studentId, semNum) => fetchAPI(`/student_course/GPA/${studentId}/${semNum}`),
  getSummary: (studentId) => fetchAPI(`/student_course/Summary/${studentId}`),
  getCourses: () => fetchAPI(`/course/get`),
  getPool: (endpoint) => fetchAPI(`/${endpoint}`),
addCourse: (payload) =>
  fetchAPI(`/student_course/add`, {
    method: 'POST',
    body: JSON.stringify(payload)
  }).then(response => {
    // Return the full response including academic_meta
    return response;
  }),
  deleteSemester: (studentId, semNum) =>
    fetchAPI(`/student_course/delete/semester/${studentId}/${semNum}`, {
      method: 'DELETE',
    }),

  getReportData: (studentId) => fetchAPI(`/report/report-data/${studentId}`),

  // --- COURSE AVAILABILITY ---
  getCoreDisciplineCourses: (studentId) => fetchAPI(`/course/get/CourseAvailable/CoreDiscipline/${studentId}`),
  getNationalRequirementCourses: (studentId) => fetchAPI(`/course/get/CourseAvailable/NationalRequirement/${studentId}`),
  getUniversityRequirementCourses: (studentId) => fetchAPI(`/course/get/CourseAvailable/UniversityRequirement/${studentId}`),
  getCommonCourses: (studentId) => fetchAPI(`/course/get/CourseAvailable/CommonCourse/${studentId}`),
  getCoreSpecializationCourses: (studentId) => fetchAPI(`/course/get/CourseAvailable/CoreSpecialization/${studentId}`),

  // --- MY COURSE ---
  // Add these to your api object in api.js
  getAllNational: () => fetchAPI(`/course/get/NationalRequirement`),
  getAllUniversity: () => fetchAPI(`/course/get/UniversityRequirement`),
  getAllCommon: () => fetchAPI(`/course/get/CommonCourse`),
  getAllCoreDiscipline: () => fetchAPI(`/course/get/CoreDiscipline`),
  getAllSpecialization: () => fetchAPI(`/course/get/CoreSpecialization`),

  // --- AI ADVISOR ---
  getAIAnalysis: (studentId) => fetchAPI(`/advisor/ai-advisor/${studentId}`)
};