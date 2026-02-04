import React, { useState } from 'react';
import { FaUser, FaMoon, FaSun } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

function Navbar({ user, onLogout, onToggleTheme, currentTheme }) {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const isDarkMode = currentTheme === "dark";

  return (
    <nav style={{
      ...styles.nav,
      backgroundColor: isDarkMode ? 'var(--nav-bg)' : 'rgba(255, 255, 255, 0.9)',
      borderColor: isDarkMode ? 'var(--border-color)' : 'rgba(0, 0, 0, 0.1)',
      boxShadow: isDarkMode ? 'none' : '0 4px 20px rgba(0, 0, 0, 0.08)'
    }}>
      <h1 
        onClick={() => navigate('/Dashboard')} 
        style={{
          ...styles.logo,
          color: isDarkMode ? 'var(--text-color)' : '#2c3e50'
        }} 
        className="logo-hover"
      >
        StudyPlan
      </h1>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <button 
          style={{
            ...styles.button,
            color: isDarkMode ? 'var(--text-color)' : '#2c3e50',
            borderColor: isDarkMode ? 'var(--border-color)' : 'rgba(0, 0, 0, 0.15)',
            backgroundColor: isDarkMode ? 'transparent' : 'rgba(255, 255, 255, 0.5)'
          }} 
          onClick={() => navigate('/Dashboard')}
          className="nav-btn"
        >
          Dashboard
        </button>
        <button 
          style={{
            ...styles.button,
            color: isDarkMode ? 'var(--text-color)' : '#2c3e50',
            borderColor: isDarkMode ? 'var(--border-color)' : 'rgba(0, 0, 0, 0.15)',
            backgroundColor: isDarkMode ? 'transparent' : 'rgba(255, 255, 255, 0.5)'
          }} 
          onClick={() => navigate('/MyCourses')}
          className="nav-btn"
        >
          MyCourses
        </button>
        <button 
          style={{
            ...styles.button,
            color: isDarkMode ? 'var(--text-color)' : '#2c3e50',
            borderColor: isDarkMode ? 'var(--border-color)' : 'rgba(0, 0, 0, 0.15)',
            backgroundColor: isDarkMode ? 'transparent' : 'rgba(255, 255, 255, 0.5)'
          }} 
          onClick={() => navigate('/StudyPlan')}
          className="nav-btn"
        >
          Study Plan
        </button>
        
        <div style={{ position: 'relative' }}>
          <button 
            style={{
              ...styles.button,
              color: isDarkMode ? 'var(--text-color)' : '#2c3e50',
              borderColor: isDarkMode ? 'var(--border-color)' : 'rgba(0, 0, 0, 0.15)',
              backgroundColor: isDarkMode ? 'transparent' : 'rgba(255, 255, 255, 0.5)'
            }} 
            onClick={() => setShowDropdown(!showDropdown)}
            className="nav-btn user-btn"
            onMouseEnter={() => setShowDropdown(true)}
          >
            <FaUser />
          </button>
          {showDropdown && (
            <div 
              style={{
                ...styles.dropdown,
                backgroundColor: isDarkMode ? 'var(--nav-bg)' : 'rgba(255, 255, 255, 0.95)',
                borderColor: isDarkMode ? 'var(--border-color)' : 'rgba(0, 0, 0, 0.1)',
                boxShadow: isDarkMode ? '0 10px 30px rgba(0, 0, 0, 0.3)' : '0 10px 30px rgba(0, 0, 0, 0.1)'
              }} 
              onMouseLeave={() => setShowDropdown(false)}
              className="dropdown-fade"
            >
              <div 
                style={{
                  ...styles.dropdownItem,
                  color: isDarkMode ? 'var(--text-color)' : '#2c3e50',
                  borderBottomColor: isDarkMode ? 'var(--border-color)' : 'rgba(0, 0, 0, 0.08)'
                }} 
                onClick={() => navigate('/profile')}
                className="dropdown-item"
              >
                Profile
              </div>
              <div 
                style={{
                  ...styles.dropdownItem,
                  color: '#ff6b6b',
                  borderBottomColor: isDarkMode ? 'var(--border-color)' : 'rgba(0, 0, 0, 0.08)'
                }} 
                onClick={onLogout}
                className="dropdown-item logout-item"
              >
                Logout
              </div>
            </div>
          )}
        </div>
        <button 
          style={{
            ...styles.button,
            color: isDarkMode ? 'var(--text-color)' : '#2c3e50',
            borderColor: isDarkMode ? 'var(--border-color)' : 'rgba(0, 0, 0, 0.15)',
            backgroundColor: isDarkMode ? 'transparent' : 'rgba(255, 255, 255, 0.5)'
          }} 
          onClick={onToggleTheme}
          className="nav-btn theme-btn"
        >
          {isDarkMode ? <FaMoon /> : <FaSun style={{ color: '#f39c12' }} />}
        </button>
      </div>

      {/* Add CSS for effects only */}
      <style jsx="true">{`
        .logo-hover {
          transition: all 0.3s ease;
        }
        .logo-hover:hover {
          transform: scale(1.05);
          text-shadow: ${isDarkMode ? '0 0 15px rgba(255, 255, 255, 0.3)' : '0 0 15px rgba(44, 62, 80, 0.2)'};
        }
        
        .nav-btn {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .nav-btn:hover {
          transform: translateY(-4px);
          background-color: ${isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(44, 62, 80, 0.08)'};
          border-color: ${isDarkMode ? 'rgba(255, 255, 255, 0.4)' : 'rgba(44, 62, 80, 0.3)'};
          box-shadow: ${isDarkMode 
            ? '0 6px 20px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.2)' 
            : '0 6px 20px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(44, 62, 80, 0.1)'};
        }
        .nav-btn:active {
          transform: translateY(-1px);
        }
        
        .user-btn:hover svg {
          transform: scale(1.2);
          color: ${isDarkMode ? 'rgba(255, 255, 255, 0.9)' : '#3498db'};
        }
        .user-btn svg {
          transition: all 0.3s ease;
        }
        
        .theme-btn:hover {
          transform: scale(1.2);
          background-color: ${isDarkMode ? 'rgba(100, 100, 255, 0.1)' : 'rgba(255, 215, 0, 0.1)'};
        }
        .theme-btn {
          transition: all 0.3s ease;
        }
        
        .dropdown-fade {
          animation: slideDown 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .dropdown-item {
          transition: all 0.2s ease;
        }
        .dropdown-item:hover {
          background-color: ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(44, 62, 80, 0.05)'};
          padding-left: 20px;
        }
        
        .logout-item:hover {
          background-color: rgba(255, 107, 107, 0.1);
        }
        
        @keyframes slideDown {
          from { 
            opacity: 0;
            transform: translateY(-10px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        /* Sun effect for light mode */
        .theme-btn:hover svg[color="#f39c12"] {
          animation: sunGlow 1s infinite;
          color: #ff9500;
          filter: drop-shadow(0 0 8px rgba(255, 149, 0, 0.4));
        }
        
        @keyframes sunGlow {
          0%, 100% { 
            transform: scale(1);
          }
          50% { 
            transform: scale(1.1);
          }
        }
        
        /* Moon effect for dark mode */
        .theme-btn:hover svg:not([color]) {
          filter: drop-shadow(0 0 8px rgba(173, 216, 230, 0.5));
          color: #a5b1c2;
        }
        
        /* Light mode specific - make text more readable on hover */
        .nav-btn:hover {
          color: ${isDarkMode ? 'inherit' : '#2c3e50'};
          font-weight: ${isDarkMode ? 'normal' : '500'};
        }
      `}</style>
    </nav>
  );
}

const styles = { 
  nav: {
    backdropFilter: 'var(--glass-blur)',
    padding: '40px 40px',
    width: '100%',
    borderRadius: '20px',
    marginTop: '40px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    border: '2px solid var(--border-color)',
    boxSizing: 'border-box',
    marginBottom: '0px',
  },
  logo: { 
    cursor: 'pointer', 
    fontWeight: '300', 
    letterSpacing: '2px',
    fontSize: '1.8rem',
  },
  button: {
    marginLeft: '15px',
    padding: '10px 20px',
    borderRadius: '30px',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    border: '2px solid var(--border-color)',
    fontSize: '0.95rem',
    fontWeight: '400',
  },
  dropdown: {
    position: 'absolute', 
    top: '50px', 
    right: '0',
    backdropFilter: 'var(--glass-blur)',
    borderRadius: '12px',
    border: '2px solid var(--border-color)',
    minWidth: '150px', 
    zIndex: 100,
  },
  dropdownItem: { 
    padding: '12px', 
    cursor: 'pointer', 
    borderBottom: '1px solid var(--border-color)' 
  }
};

export default Navbar;