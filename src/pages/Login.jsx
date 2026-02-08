// Login.jsx
import React, { useState } from "react";
import { api } from "../utils/api";
import "./SignUpLogin.css";
import logo from "../image/logo.png";
import UTP from "../image/UTP.png";

function Login() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

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

  return (
    <div className="landing-container">
      
      {/* HEADER */}
      <header className="landing-header">
        <div className="logo-section">
          <img src={logo} alt="CEE Logo" className="main-logo" />

          <div className="social-icons">
            <a
              href="https://www.instagram.com/cee_utp?igsh=aGI0NTIwaWJxZm1v"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src="https://cdn-icons-png.flaticon.com/512/174/174855.png" alt="IG" />
            </a>

            <a
              href="https://facebook.com/yourpage"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src="https://cdn-icons-png.flaticon.com/512/5968/5968764.png" alt="FB" />
            </a>

            <a
              href="https://www.tiktok.com/@cee.utp_25?_r=1&_t=ZS-93iScUmJnk4"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src="https://cdn-icons-png.flaticon.com/512/3046/3046121.png" alt="TikTok" />
            </a>
          </div>
        </div>

        <h2 className="header-title">STUDY PLAN</h2>
      </header>

      {/* MAIN CONTENT */}
      <main className="landing-content">
        <div className="image-section">
          <img
            src={UTP}
            alt="University Building"
            className="hero-illustration"
          />
        </div>

        <div className="text-section">
          <div className="typography-block">
            <h1>HELLO STUDENTS!</h1>

            <h2 className="main-subtitle-oneline">
              PLAN YOUR SEMESTER
            </h2>

            <p>
              Track courses, manage credits, and stay on top of your studies —
              all in one clean website
            </p>
          </div>

          <div className="cta-buttons">
            <button
              className={`btn-primary ${loading ? "loading" : ""}`}
              onClick={() => handleGoogleAuth("Sign Up")}
              disabled={loading}
            >
              {loading ? "connecting..." : "get started with google"}
            </button>

            <button
              className="btn-secondary"
              onClick={() => handleGoogleAuth("Login")}
              disabled={loading}
            >
              I already have an account
            </button>
          </div>

          {message && <div className="error-msg">{message}</div>}
        </div>
      </main>

      {/* BOTTOM WAVE */}
      <div className="bottom-wave">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
        >
          <path
            fill="#034a84"
            fillOpacity="1"
            d="M0,32L60,74.7C120,117,240,203,360,234.7C480,267,600,245,720,202.7C840,160,960,96,1080,90.7C1200,85,1320,139,1380,165.3L1440,192L1440,320L0,320Z"
          />
        </svg>
      </div>
    </div>
  );
}

export default Login;
