import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";      
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import MyCourse from "./pages/MyCourse";
import Profile from "./pages/Profile";
import StudyPlan from "./studyPlan/StudyPlan"; 
import Login from "./pages/Login"; // Unified Landing Page
import AIAdvisor from "./ai/AIAdvisor"; 
import { supabase } from "./utils/api"; 
import "./style.css";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState('dark');

  // --- Theme Logic ---
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  // Ensure the theme is set on initial load and when theme state changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // --- Authentication Logic ---
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const userData = {
          student_id: session.user.id,
          student_email: session.user.email,
          student_name: session.user.user_metadata.full_name || session.user.email,
        };
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
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

  // --- Logout Logic ---
  const handleLogout = async () => {       
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  if (loading) return null;

  return (
    <Router>
      <Routes>
        {/* Login Route */}
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/Dashboard" />} />
        
        {/* Protected Routes */}
        <Route path="*" element={
          user ? (
            <div style={{ maxWidth: "1300px", margin: "0 auto", padding: "0 20px" }}>
              {/* Navbar now receives all necessary props for both logout and theme toggle */}
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
            </div>
          ) : <Navigate to="/login" />
        } />
      </Routes>
    </Router>
  );
}

export default App;