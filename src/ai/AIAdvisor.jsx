import React, { useState, useEffect, useRef } from "react";
import "./AIAdvisor.css";

function AIAdvisor({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const modalRef = useRef(null);
  
  const API_BASE = "http://172.16.179.31:8000";

  // Fetch analysis when popup opens
  useEffect(() => {
    if (isOpen && user?.student_id && !analysis) {
      fetchAnalysis();
    }
  }, [isOpen, user?.student_id]);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
       
        const icon = document.querySelector('.ai-advisor-icon');
        if (icon && !icon.contains(event.target)) {
          setIsOpen(false);
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const fetchAnalysis = async () => {
    if (!user?.student_id) {
      setError("User information not available");
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      const response = await fetch(`${API_BASE}/advisor/ai-advisor/${user.student_id}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch analysis: ${response.status}`);
      }
      
      const data = await response.json();
      setAnalysis(data.analysis || "No analysis available.");
      
    } catch (error) {
      console.error("Error fetching AI analysis:", error);
      setError("Unable to load AI analysis. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setAnalysis(""); // Clear old analysis
    fetchAnalysis();
  };

  const handleClose = () => {
    setIsOpen(false);
    setError("");
  };

  return (
    <>
      {/* Floating Icon */}
      <div 
        className="ai-advisor-icon"
        onClick={() => setIsOpen(!isOpen)}
        title="AI Academic Advisor"
      >
        <div className="ai-icon-content">
          <span className="ai-icon">🤖</span>
          {!isOpen && !analysis && (
            <span className="ai-notification-dot"></span>
          )}
        </div>
      </div>

      {/* Analysis Popup - Appears next to icon */}
      {isOpen && (
        <div className="ai-advisor-popup" ref={modalRef}>
          <div className="ai-popup-header">
            <div className="ai-header-left">
              <div className="ai-avatar">🤖</div>
              <div>
                <h4>AI Academic Advisor</h4>
                <p className="ai-subtitle">Your personalized analysis</p>
              </div>
            </div>
            <div className="ai-header-right">
              <button 
                onClick={handleRefresh}
                className="ai-refresh-btn"
                disabled={loading}
                title="Refresh analysis"
              >
                {loading ? "🔄" : "🔄"}
              </button>
              <button 
                onClick={handleClose}
                className="ai-close-btn"
                title="Close"
              >
                ×
              </button>
            </div>
          </div>

          <div className="ai-popup-body">
            {error ? (
              <div className="ai-error-state">
                <div className="error-icon">⚠️</div>
                <p className="error-message">{error}</p>
                <button 
                  onClick={fetchAnalysis}
                  className="retry-btn"
                  disabled={loading}
                >
                  {loading ? "Retrying..." : "Try Again"}
                </button>
              </div>
            ) : loading ? (
              <div className="ai-loading-state">
                <div className="loading-spinner"></div>
                <p className="loading-text">Analyzing your performance...</p>
              </div>
            ) : analysis ? (
              <div className="ai-analysis-content">
                <div className="analysis-scroll">
                  {analysis.split('\n').map((paragraph, index) => (
                    <p key={index} className="analysis-paragraph">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            ) : (
              <div className="ai-empty-state">
                <div className="empty-icon">📊</div>
                <p className="empty-title">Ready to analyze</p>
                <p className="empty-description">
                  Click refresh to generate your academic analysis
                </p>
              </div>
            )}
          </div>

          <div className="ai-popup-footer">
            <p className="ai-footer-note">
              Based on your current transcript data
            </p>
          </div>
          
          {/* Popup arrow pointing to icon */}
          <div className="popup-arrow"></div>
        </div>
      )}
    </>
  );
}

export default AIAdvisor;