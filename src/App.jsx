import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";      
import Navbar from "./componenets/Navbar";
import Dashboard from "./pages/Dashboard";
import MyCourse from "./pages/MyCourse";
import Profile from "./pages/Profile";
import StudyPlan from "./studyPlan/StudyPlan"; 
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import AIAdvisor from "./ai/AIAdvisor"; 
import "./style.css";

function App() {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('dark');
  const [loading, setLoading] = useState(true);

  const handleLogout = () => {       
    setUser(null);
    localStorage.removeItem('user');
    window.location.href = "/login";
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
    
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
    setLoading(false);
  }, []);

  if (loading) return null;

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login setUser={(u) => {
          setUser(u);
          localStorage.setItem('user', JSON.stringify(u));
        }} />} />
        <Route path="/signup" element={<SignUp />} />

        <Route
          path="*"
          element={
            user ? (
              <>
                <div style={{ maxWidth: "1300px", margin: "0 auto", padding: "0 20px", minHeight: "100vh" }}>
                  <Navbar user={user} onLogout={handleLogout} onToggleTheme={toggleTheme} currentTheme={theme} />
                  <div style={{ paddingTop: "80px", paddingBottom: "40px" }}>
                    <Routes>
                      <Route path="/" element={<Navigate to="/Dashboard" />} />
                      <Route path="/Dashboard" element={<Dashboard user={user} />} />
                      <Route path="/MyCourses" element={<MyCourse />} />
                      <Route path="/profile" element={<Profile user={user} setUser={setUser} />} />
                      <Route path="/StudyPlan" element={<StudyPlan user={user} />} />
                    </Routes>
                  </div>
                </div>
                {/* AI Advisor Popup */}
                <AIAdvisor user={user} />
              </>
            ) : <Navigate to="/login" />
          }
        />
      </Routes>
    </Router>
  );
}

export default App;