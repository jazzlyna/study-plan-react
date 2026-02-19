import React, { useState, useEffect } from 'react';
import './SignUpLogin.css';
import { api } from '../utils/api';
import logo from '../image/logo.png';
import heroImage from '../image/hero-image.png'

const LandingPage = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showScrollHint, setShowScrollHint] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setShowScrollHint(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    
    // Auto-hide scroll hint after 5 seconds
    const timer = setTimeout(() => {
      setShowScrollHint(false);
    }, 5000);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timer);
    };
  }, []);

  const handleGoogleAuth = async (actionType) => {
    try {
      setLoading(true);
      setMessage("");
      await api.loginWithGoogle();
    } catch (err) {
      setMessage(`Google ${actionType} failed: ${err.message}`);
      setLoading(false);
    }
  };

  const features = [
    {
      id: 1,
      title: "Track Courses",
      description: "Keep all your courses organized in one place with semester-wise tracking.",
      icon: "📚"
    },
    {
      id: 2,
      title: "Manage Credits",
      description: "Monitor your credit hours and ensure you're on track for graduation.",
      icon: "🎯"
    },
    {
      id: 3,
      title: "Stay Organized",
      description: "Never miss an assignment, exam, or important deadline again.",
      icon: "🗓️"
    },
    {
      id: 4,
      title: "Progress Analytics",
      description: "Visualize your academic progress .",
      icon: "📊"
    }
  ];

  const steps = [
    {
      id: 1,
      title: "Sign Up",
      description: "Create your account using your Google account.",
      icon: "👤"
    },
    {
      id: 2,
      title: "Add Your Courses",
      description: "Input your current courses or plan future semesters.",
      icon: "📝"
    },
    {
      id: 3,
      title: "Track & Manage",
      description: "Monitor your progress, credits, and stay organized all semester.",
      icon: "📈"
    }
  ];


  return (
    <div className="landing-page">
      {/* Header with Logo and Social Media */}
      <header className="landing-header">
        <div className="logo-section">
          <img src={logo} alt="CEE Logo" className="main-logo" />
          <div className="social-icons">
            <a href="https://www.instagram.com/cee_utp?igsh=aGI0NTIwaWJxZm1v" target="_blank" rel="noopener noreferrer">
              <img src="https://cdn-icons-png.flaticon.com/512/174/174855.png" alt="IG" />
            </a>
            <a href="https://facebook.com/yourpage" target="_blank" rel="noopener noreferrer">
              <img src="https://cdn-icons-png.flaticon.com/512/5968/5968764.png" alt="FB" />
            </a>
            <a href="https://www.tiktok.com/@cee.utp_25?_r=1&_t=ZS-93iScUmJnk4" target="_blank" rel="noopener noreferrer">
              <img src="https://cdn-icons-png.flaticon.com/512/3046/3046121.png" alt="TikTok" />
            </a>
          </div>
        </div>
<div className="header-actions">
    <h2 className="header-title">STUDY PLAN</h2>
    <button 
      className="btn-admin-add"
      onClick={() => window.open("https://study-plan-add-course-by-department.vercel.app/", "_blank")}
    >
      Add New Course
    </button>
  </div>

        
      </header>

      {/* Hero Section with Image on Right */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-grid">
            <div className="hero-content">
              <h1 className="hero-title">HELLO STUDENTS!</h1>
              <h2 className="hero-subtitle">PLAN YOUR SEMESTER</h2>
              <p className="hero-description">
                Track courses, manage credits, and stay on top of your studies  all in one clean website.
              </p>
              
              <div className="auth-buttons">
                <button 
                  className="btn-google"
                  onClick={() => handleGoogleAuth('Sign Up')}
                  disabled={loading}
                >
                  <span className="google-icon">
  <img 
    src="https://fonts.gstatic.com/s/i/productlogos/googleg/v6/24px.svg" 
    alt="Google logo" 
  />
</span>
                  {loading ? "Connecting..." : "Get Started with Google"}
                </button>
                <button 
                  className="btn-account"
                  onClick={() => handleGoogleAuth('Login')}
                  disabled={loading}
                >
                  I Already Have an Account
                </button>
              </div>
              {message && <div className="error-msg">{message}</div>}
            </div>
            
            <div className="hero-image">
              <div className="image-container">
                <img 
                   src={heroImage} 
                    alt="Student studying" 
                  className="hero-illustration"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Scroll Indicator */}
        {showScrollHint && (
          <div className="scroll-hint">
            <div className="scroll-text">Scroll to explore</div>
            <div className="scroll-arrow">↓</div>
          </div>
        )}
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">Everything You Need to Succeed</h2>
            <p className="section-subtitle">Designed specifically for students to simplify academic planning</p>
          </div>
          
          <div className="features-grid">
            {features.map(feature => (
              <div key={feature.id} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="steps-section">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title">How It Works</h2>
            <p className="section-subtitle">Get started in just three simple steps</p>
          </div>
          
          <div className="steps-grid">
            {steps.map(step => (
              <div key={step.id} className="step-card">
                <div className="step-number">{step.id}</div>
                <div className="step-icon">{step.icon}</div>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-description">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      

      {/* CTA Section */}
      <section className="cta-section">
        <div className="section-container">
          <div className="section-header">
            <h2 className="cta-title">Ready to Plan Your Semester?</h2>
            
          </div>
          
          <div className="cta-buttons">
            <button 
              className="btn-google btn-cta"
              onClick={() => handleGoogleAuth('Sign Up')}
              disabled={loading}
            >
              <span className="google-icon">G</span>
              {loading ? "Connecting..." : "Get Started with Google"}
            </button>
            <button 
              className="btn-account btn-cta"
              onClick={() => handleGoogleAuth('Login')}
              disabled={loading}
            >
              I Already Have an Account
            </button>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-content">
            <div className="footer-brand">
              <div className="footer-logo-container">
                <img src={logo} alt="CEE Logo" className="footer-logo" />
                <div>
                  <h3 className="footer-title">STUDY PLAN</h3>
                  <p className="footer-tagline">Your academic success, organized.</p>
                </div>
              </div>
            </div>
            
            <div className="footer-links">
             
              
              <div className="link-group">
                <h4 className="link-title">Connect</h4>
                <a href="https://www.instagram.com/cee_utp?igsh=aGI0NTIwaWJxZm1v" target="_blank" rel="noopener noreferrer" className="footer-link">Instagram</a>
                <a href="https://facebook.com/yourpage" target="_blank" rel="noopener noreferrer" className="footer-link">Facebook</a>
                <a href="https://www.tiktok.com/@cee.utp_25?_r=1&_t=ZS-93iScUmJnk4" target="_blank" rel="noopener noreferrer" className="footer-link">TikTok</a>
              </div>
            </div>
          </div>
          
          <div className="footer-bottom">
            <p className="copyright">© {new Date().getFullYear()} Study Plan - UTP. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;