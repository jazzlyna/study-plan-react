import React, { useState } from "react";
import { api } from "../utils/api"; 
import "./SignUpLogin.css"; 

function Login() { 
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleGoogleAuth = async (actionType) => {
    try {
      setLoading(true);
      setMessage("");
      // Supabase automatically detects if the user is new or returning
      await api.loginWithGoogle(); 
    } catch (err) {
      setMessage(`Google ${actionType} failed: ${err.message}`);
      setLoading(false);
    }
  };

  return (
    <div className="login-viewport">
      <div className="soft-glass-card">
        <h2 className="soft-title">STUDY PLAN</h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '2rem' }}>
          One account. All your courses.
        </p>
        
        {/* Primary Action: SIGN IN */}
        <button 
          className="soft-primary-btn" 
          onClick={() => handleGoogleAuth('Login')} 
          disabled={loading}
          style={{ marginBottom: '1rem' }}
        >
          {loading ? "Connecting..." : "Log In with Google"}
        </button>

        <div className="divider" style={{ margin: '1.5rem 0' }}>OR</div>

        {/* Secondary Action: SIGN UP */}
        <button 
          className="soft-google-btn" 
          onClick={() => handleGoogleAuth('Sign Up')} 
          disabled={loading}
          style={{ border: '1px solid rgba(255,255,255,0.3)' }}
        >
          <img 
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
            alt="G" 
            style={{ width: '18px', marginRight: '10px' }} 
          />
          Create Account with Google
        </button>

        {message && <div className="error-msg">{message}</div>}

        <p style={{ marginTop: '2rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
          By continuing, you agree to the university terms of service.
        </p>
      </div>
    </div>
  );
}

export default Login;