import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../utils/api"; // Centralized API
import "./SignUpLogin.css"; // External CSS
function Login({ setUser }) { 
  const [student_email, setStudent_email] = useState("");
  const [student_password, setStudent_password] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      // Use the utility we built earlier
      const data = await api.login(student_email, student_password);
      // SUCCESS: data is already parsed by our fetchAPI wrapper
      setUser(data.user || data); 
      navigate("/Dashboard");
    } catch (err) {
      // Use the error message thrown by our wrapper
      setMessage(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="login-viewport">
      <div className="soft-glass-card">
        <h2 className="soft-title">SIGN IN</h2>
        
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email Address"
            className="pill-input"
            value={student_email}
            onChange={(e) => setStudent_email(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="pill-input"
            value={student_password}
            onChange={(e) => setStudent_password(e.target.value)}
            required
          />
          <button type="submit" className="soft-primary-btn" disabled={loading}>
            {loading ? "Verifying..." : "Login"}
          </button>
        </form>
        {message && <div className="error-msg">{message}</div>}
        <div className="switch-text">
          New here? <span className="link-text" onClick={() => navigate("/signup")}>Create Account</span>
        </div>
      </div>
    </div>
  );
}
export default Login;