import React, { useState, useEffect } from 'react';
import { FaUser, FaMoon, FaSun, FaGraduationCap, FaBars, FaTimes } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import '../style.css';
import './Navbar.css';

function Navbar({ user, onLogout, onToggleTheme, currentTheme }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const navLinks = [
    { path: '/Dashboard', label: 'Dashboard' },
    { path: '/MyCourses', label: 'Courses' },
    { path: '/StudyPlan', label: 'Study Plan' },
    { path: '/profile', label: 'Profile' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="modal-backdrop mobile-only"
          onClick={() => setIsMobileMenuOpen(false)}
          style={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999
          }}
        />
      )}

      <nav className="glass-card navbar">
        {/* Logo */}
        <div 
          onClick={() => navigate('/Dashboard')} 
          className="logo-container logo-hover touch-feedback"
        >
          <FaGraduationCap className="logo-icon" />
          <h1 className="logo">StudyPlan</h1>
        </div>
        
        {/* Mobile Menu Toggle */}
        <button 
          className="mobile-only btn-icon menu-toggle"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
        </button>

        {/* Desktop Navigation */}
        <div className="nav-links desktop-only">
          {navLinks.map((link) => (
            <button 
              key={link.path}
              onClick={() => navigate(link.path)}
              className={`nav-link touch-feedback ${isActive(link.path) ? 'active' : ''}`}
            >
              {link.label}
            </button>
          ))}
          
          {/* Theme Toggle */}
          <button 
            onClick={onToggleTheme}
            className="theme-toggle btn-icon touch-feedback"
            aria-label={`Switch to ${currentTheme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {currentTheme === 'dark' ? <FaSun /> : <FaMoon />}
          </button>
          
          {/* User Menu */}
          <div className="user-menu-container">
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              className="user-menu touch-feedback"
            >
              <FaUser />
              <span className="user-name">{user?.student_name?.split(' ')[0] || 'User'}</span>
            </button>
            
            {showDropdown && (
              <div className="dropdown-wrapper">
                <div 
                  className="glass-card dropdown"
                  onMouseLeave={() => !isMobile && setShowDropdown(false)}
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 10px)',
                    right: 0,
                    zIndex: 10000,
                  }}
                >
                  <div 
                    onClick={() => { navigate('/profile'); setShowDropdown(false); }}
                    className="dropdown-item touch-feedback"
                  >
                    👤 Profile
                  </div>
                  <div 
                    onClick={() => { onLogout(); setShowDropdown(false); }}
                    className="dropdown-item logout touch-feedback"
                  >
                    🚪 Logout
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="glass-card mobile-menu">
            <div className="mobile-menu-header">
              <div className="mobile-user-info">
                <div className="user-avatar">
                  <FaUser />
                </div>
                <div>
                  <p className="user-name-mobile">{user?.student_name || 'User'}</p>
                  <p className="user-email-mobile">{user?.student_email}</p>
                </div>
              </div>
              <button 
                onClick={onToggleTheme}
                className="btn-icon touch-feedback mobile-theme-toggle"
              >
                {currentTheme === 'dark' ? <FaSun /> : <FaMoon />}
              </button>
            </div>

            <div className="mobile-nav-links">
              {navLinks.map((link) => (
                <button
                  key={link.path}
                  onClick={() => navigate(link.path)}
                  className={`touch-feedback mobile-nav-link ${isActive(link.path) ? 'active' : ''}`}
                >
                  {link.label}
                </button>
              ))}
            </div>

            <div className="mobile-menu-footer">
              <button 
                onClick={() => { onLogout(); setIsMobileMenuOpen(false); }}
                className="btn touch-feedback mobile-logout-btn"
              >
                🚪 Logout
              </button>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}

export default Navbar;