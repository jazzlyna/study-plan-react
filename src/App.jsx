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
              <Navbar user={user} onLogout={handleLogout} />
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