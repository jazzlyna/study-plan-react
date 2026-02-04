import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../utils/api"; // Import our clean API utility
import "./SignUpLogin.css"; // Import our external styles

function SignUp() {
  const [student_name, setStudent_name] = useState("");
  const [student_email, setStudent_email] = useState("");
  const [student_password, setStudent_password] = useState("");
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setIsSuccess(false);

    const payload = {
      student_name: student_name.trim(),
      student_email: student_email.trim(),
      student_password: student_password,
      student_image: null,
      student_GOT: null
    };

    try {
      // 1. Logic is now a single readable line
      await api.register(payload);

      // 2. Handle Success UI
      setIsSuccess(true);
      setMessage("Account created! You can now sign in.");
      setStudent_name("");
      setStudent_email("");
      setStudent_password("");
    } catch (err) {
      // 3. Handle Error UI
      setMessage(err.message || "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-viewport">
      <div className="soft-glass-card">
        <h2 className="soft-title">CREATE ACCOUNT</h2>
        
        <button type="button" className="soft-google-btn" onClick={() => alert("Coming soon!")}>
          Sign Up with Google
        </button>

        <div className="divider">OR FILL DETAILS</div>

        <form onSubmit={handleSignUp}>
          <input 
            type="text" 
            placeholder="Full Name" 
            className="pill-input"
            value={student_name} 
            onChange={(e) => setStudent_name(e.target.value)} 
            required 
            disabled={isSuccess}
          />
          <input 
            type="email" 
            placeholder="Email Address" 
            className="pill-input"
            value={student_email} 
            onChange={(e) => setStudent_email(e.target.value)} 
            required 
            disabled={isSuccess}
          />
          <input 
            type="password" 
            placeholder="Password" 
            className="pill-input"
            value={student_password} 
            onChange={(e) => setStudent_password(e.target.value)} 
            required 
            disabled={isSuccess}
          />
          
          <button type="submit" className="soft-primary-btn" disabled={loading || isSuccess}>
            {loading ? "Creating Account..." : isSuccess ? "Done!" : "Sign Up"}
          </button>
        </form>

        {message && (
          <p className="message" style={{ 
            color: isSuccess ? "#00e676" : "#ff3366", 
            border: `1px solid ${isSuccess ? "#00e67644" : "#ff336644"}` 
          }}>
            {message}
          </p>
        )}

        <div className="switch-text">
          Already have an account? 
          <span className="link-text" onClick={() => navigate("/")}>Login</span>
        </div>
      </div>
    </div>
  );
}

export default SignUp;