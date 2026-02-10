import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";      
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import MyCourse from "./pages/MyCourse";
import Profile from "./pages/Profile";
import StudyPlan from "./studyPlan/StudyPlan"; 
import Login from "./pages/Login"; // Unified Landing Page
import AIAdvisor from "./ai/AIAdvisor"; 
import { supabase, api } from "./utils/api"; // Added api import
import "./style.css";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState('dark');
  
  // --- New State for Intake Modal ---
  const [showIntakeModal, setShowIntakeModal] = useState(false);
  const [intakeDate, setIntakeDate] = useState("");
  const [department, setDepartment] = useState("");

  // --- Theme Logic ---
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // --- Authentication Logic ---
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        try {
          // Fetch full profile to check for intake_session
          const profile = await api.getProfile(session.user.id);
          
          const userData = {
            student_id: session.user.id,
            student_email: session.user.email,
            student_name: session.user.user_metadata.full_name || session.user.email,
            intake_session: profile?.intake_session || null,
            student_department: profile?.student_department || null,
          };
          
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));

          // Trigger popup if intake session OR department is missing
          if (!profile?.intake_session || !profile?.student_department) {
            setShowIntakeModal(true);
          }
        } catch (error) {
          console.error("Error fetching profile details:", error);
        }
      } else {
        const localUser = localStorage.getItem('user');
        if (localUser) setUser(JSON.parse(localUser));
      }
      setLoading(false);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "SIGNED_IN" || event === "USER_UPDATED") && session) {
        const userData = {
          student_id: session.user.id,
          student_email: session.user.email,
          student_name: session.user.user_metadata.full_name || session.user.email,
        };
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      }
      if (event === "SIGNED_OUT") {
        setUser(null);
        localStorage.removeItem('user');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- New Intake Save Logic ---
  const handleSaveIntake = async () => {
    if (!intakeDate) return alert("Please select your intake date.");
    if (!department) return alert("Please select your department.");
    
    try {
      // payload matches the schema provided
      await api.updateProfile(user.student_id, { 
        intake_session: intakeDate,
        student_department: department,
        student_name: user.student_name 
      });
      
      setUser(prev => ({ ...prev, intake_session: intakeDate, student_department: department }));
      setShowIntakeModal(false);
    } catch (err) {
      console.error("Update failed:", err);
      alert("Failed to update intake session and department.");
    }
  };

  // --- Logout Logic ---
  const handleLogout = async () => {       
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  if (loading) return null;

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/Dashboard" />} />
        
        <Route path="*" element={
          user ? (
            <div style={{ maxWidth: "1300px", margin: "0 auto", padding: "0 20px" }}>
              <Navbar 
                user={user} 
                onLogout={handleLogout} 
                onToggleTheme={toggleTheme} 
                currentTheme={theme} 
              />
              
              <Routes>
                <Route path="/Dashboard" element={<Dashboard user={user} />} />
                <Route path="/MyCourses" element={<MyCourse />} />
                <Route path="/profile" element={<Profile user={user} />} />
                <Route path="/StudyPlan" element={<StudyPlan user={user} />} />
                <Route path="/" element={<Navigate to="/Dashboard" />} />
              </Routes>
              
              <AIAdvisor user={user} />

              {/* NEW MODAL UI */}
              {showIntakeModal && (
                <div className="modal-overlay">
                  <div className="modal-content">
                    <h2 style={{ color: 'var(--text-color)', marginBottom: '1rem' }}>Welcome!</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                      Please provide your intake session date and department to help us track your academic progress.
                    </p>
                    
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-color)' }}>
                        Intake Session Date
                      </label>
                      <input 
                        type="date" 
                        className="intake-date-input"
                        value={intakeDate}
                        onChange={(e) => setIntakeDate(e.target.value)}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '2px solid var(--border-color)' }}
                      />
                    </div>
                    
                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-color)' }}>
                        Department
                      </label>
                      <select 
                        className="department-select"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '2px solid var(--border-color)', background: 'var(--bg-primary)' }}
                      >
                        <option value="">Select Department</option>
                        <option value="Chemical Engineering">Chemical Engineering</option>
                        <option value="Civil Engineering">Civil Engineering</option>
                        <option value="Electrical & Electronic Engineering">Electrical & Electronic Engineering</option>
                        <option value="Mechanical Engineering">Mechanical Engineering</option>
                        <option value="Petroleum Engineering">Petroleum Engineering</option>
                        <option value="Computer Science">Computer Science</option>
                        <option value="Information Technology">Information Technology</option>
                        <option value="Business">Business</option>
                        <option value="Science">Science</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    
                    <button className="intake-submit-btn" onClick={handleSaveIntake}>
                      Save and Continue
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : <Navigate to="/login" />
        } />
      </Routes>
    </Router>
  );
}

export default App;
