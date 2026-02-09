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
          };
          
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));

          // Trigger popup if intake session is missing
          if (!profile?.intake_session) {
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
    
    try {
      // payload matches the schema provided
      await api.updateProfile(user.student_id, { 
        intake_session: intakeDate,
        student_name: user.student_name 
      });
      
      setUser(prev => ({ ...prev, intake_session: intakeDate }));
      setShowIntakeModal(false);
    } catch (err) {
      console.error("Update failed:", err);
      alert("Failed to update intake session.");
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
                      Please provide your intake session date to help us track your "Graduate On Time" progress.
                    </p>
                    <input 
                      type="date" 
                      className="intake-date-input"
                      value={intakeDate}
                      onChange={(e) => setIntakeDate(e.target.value)}
                    />
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