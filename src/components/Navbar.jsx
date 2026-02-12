import React from 'react';
import { FaUser, FaMoon, FaSun, FaGraduationCap, FaPowerOff } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import './Navbar.css';

function Navbar({ user, onLogout, onToggleTheme, currentTheme }) {
  const navigate = useNavigate();
  const location = useLocation();

  const navLinks = [
    { path: '/Dashboard', label: 'Dashboard' },
    { path: '/MyCourses', label: 'Courses' },
    { path: '/StudyPlan', label: 'Study Plan' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      {/* Left Group - WITH STARS ON LOGO TEXT */}
      <div className="logo-container" onClick={() => navigate('/Dashboard')}>
        <FaGraduationCap className="logo-icon" />
        <span className="logo logo-star">STUDY PLAN</span> 
      </div>

      {/* Right Group */}
      <div className="navbar-actions-group">
        <div className="nav-links-pill">
          {navLinks.map((link) => (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              className={`nav-link ${isActive(link.path) ? 'active' : ''}`}
            >
              {link.label}
            </button>
          ))}
        </div>

        <div className="divider-line" />

        <div className="controls-cluster">
          <button onClick={onToggleTheme} className="control-btn theme-toggle">
            {currentTheme === 'dark' ? 
              <FaSun style={{ color: '#FACC15' }} /> : 
              <FaMoon style={{ color: '#FACC15' }} />
            }
          </button>

          <div className="user-profile-btn" onClick={() => navigate('/profile')}>
            <span className="user-name-text">
              {user?.student_name ? user.student_name.split(' ')[0] : 'User'}
            </span>
            <FaUser className="user-icon-branded" />
          </div>

          <button onClick={onLogout} className="control-btn logout-btn" title="Logout">
            <FaPowerOff />
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;