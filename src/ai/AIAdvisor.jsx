import React, { useState, useEffect, useRef } from "react";
import "./AIAdvisor.css";
import { api } from "../utils/api";

function AIAdvisor({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [analysis, setAnalysis] = useState("");
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const modalRef = useRef(null);

  // Helper function for icons
  const getIconForSection = (title) => {
    switch(title) {
      case "Overall Academic Standing": return "📊";
      case "Critical Priorities": return "🎯";
      case "Future Planning": return "🚀";
      case "Motivational Closing": return "🌟";
      default: return "📝";
    }
  };

  
  const parseAnalysis = (text) => {
    if (!text || typeof text !== 'string') return [];
    
    console.log("Raw analysis text:", text);
    
    const sectionTitles = [
      "Overall Academic Standing",
      "Critical Priorities", 
      "Future Planning",
      "Motivational Closing"
    ];
    
    const parsedSections = [];
    let currentText = text;
    
    for (let i = 0; i < sectionTitles.length; i++) {
      const title = sectionTitles[i];
      const nextTitle = sectionTitles[i + 1];
      
   
      const titlePattern = `**${title}**`;
      const titleIndex = currentText.indexOf(titlePattern);
      
      if (titleIndex === -1) {
        
        const altIndex = currentText.indexOf(title);
        if (altIndex === -1) {
          parsedSections.push({
            title,
            icon: getIconForSection(title),
            content: ["Analysis content for this section."]
          });
          continue;
        }
      }
      
      const startIndex = titleIndex !== -1 ? titleIndex + titlePattern.length : 
                       currentText.indexOf(title) + title.length;
      
   
      let endIndex = currentText.length;
      
      if (nextTitle) {
        
        const nextTitlePattern = `**${nextTitle}**`;
        const nextIndex = currentText.indexOf(nextTitlePattern, startIndex);
        
        if (nextIndex !== -1) {
          endIndex = nextIndex;
        } else {
       
          const nextAltIndex = currentText.indexOf(nextTitle, startIndex);
          if (nextAltIndex !== -1) {
            endIndex = nextAltIndex;
          }
        }
      }
      
      // Extract the content
      let contentText = currentText.substring(startIndex, endIndex).trim();
      
      // Clean up the content - remove leading colon, punctuation, and  **.**
      contentText = contentText
        .replace(/^[:•\-*\s]+/, '') // Remove leading punctuation
        .replace(/\*\*\.\*\*/g, '.') 
        .replace(/\*\*/g, '') // Remove  **
        .trim();
      
      // Split into paragraphs
      let content = [];
      
      if (contentText.length > 0) {
        // First split by double newlines if they exist
        if (contentText.includes('\n\n')) {
          content = contentText.split('\n\n')
            .filter(p => p.trim().length > 0)
            .map(p => p.trim());
        } else {
          // Split by sentences (period followed by space and capital letter)
          const sentences = contentText.split(/(?<=[.!?])\s+(?=[A-Z])/);
          
          // Group sentences into paragraphs
          let currentParagraph = [];
          for (const sentence of sentences) {
            const trimmedSentence = sentence.trim();
            if (trimmedSentence.length > 0) {
              currentParagraph.push(trimmedSentence);
              
              // Start new paragraph for certain transitions
              if (trimmedSentence.startsWith('However') || 
                  trimmedSentence.startsWith('Additionally') ||
                  trimmedSentence.startsWith('Furthermore') ||
                  trimmedSentence.startsWith('These') ||
                  trimmedSentence.startsWith('Stay')) {
                if (currentParagraph.length > 1) {
                  // Remove the last sentence and start new paragraph with it
                  const lastSentence = currentParagraph.pop();
                  if (currentParagraph.length > 0) {
                    content.push(currentParagraph.join(' '));
                  }
                  currentParagraph = [lastSentence];
                }
              }
            }
          }
          
          // Add any remaining sentences
          if (currentParagraph.length > 0) {
            content.push(currentParagraph.join(' '));
          }
        }
        
        // If no content was created, use the whole text
        if (content.length === 0) {
          content = [contentText];
        }
      } else {
        content = ["Detailed analysis for this section."];
      }
      
      parsedSections.push({
        title,
        icon: getIconForSection(title),
        content: content
      });
    }
    
    console.log("Parsed sections:", parsedSections);
    return parsedSections;
  };

  // Fetch analysis when popup opens
  useEffect(() => {
    if (isOpen && user?.student_id && !analysis) {
      fetchAnalysis();
    }
  }, [isOpen, user?.student_id]);

  // Parse analysis when it changes
  useEffect(() => {
    if (analysis) {
      const parsed = parseAnalysis(analysis);
      setSections(parsed);
    }
  }, [analysis]);

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
      const data = await api.getAIAnalysis(user.student_id);
      console.log("API Response:", data);
      setAnalysis(data.analysis || "No analysis available.");
      
    } catch (error) {
      console.error("Error fetching AI analysis:", error);
      setError("Unable to load AI analysis. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setAnalysis("");
    setSections([]);
    fetchAnalysis();
  };

  const handleClose = () => {
    setIsOpen(false);
    setError("");
  };

  // Render section content with formatting
  const renderSectionContent = (content) => {
    return content.map((paragraph, index) => {
      // Highlight important elements
      const processedText = paragraph
        .replace(/(A|A-|B\+)/g, '<span class="grade">$1</span>')
        .replace(/(Engineering Mathematics|Mechanics of Solids|Geomatics|Co Curriculum|Falsafah & Isu Semasa|Health, Safety & Environment)/g, 
          '<strong>$1</strong>')
        .replace(/(VFB1033|VFB1043|FFM1023|CFB1032)/g, '<code>$1</code>')
        .replace(/(crucial|essential|important|foundation|prerequisites)/gi, 
          '<em>$1</em>');
      
      return (
        <p 
          key={index} 
          className="section-paragraph"
          dangerouslySetInnerHTML={{ __html: processedText }}
        />
      );
    });
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

      {/* Analysis Popup */}
      {isOpen && (
        <div className="ai-advisor-popup" ref={modalRef}>
          <div className="ai-popup-header">
            <div className="ai-header-left">
              <div className="ai-avatar">🤖</div>
              <div className="ai-header-info">
                <h4>AI Academic Advisor</h4>
                <p className="ai-subtitle">Personalized Academic Insights</p>
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
      {loading ? "Retrying..." : "Retry"}
    </button>
  </div>
            ) : loading ? (
              <div className="ai-loading-state">
                <div className="loading-spinner"></div>
                <p className="loading-text">Analyzing your performance...</p>
              </div>
            ) : sections.length > 0 ? (
              <div className="ai-analysis-content">
                <div className="analysis-scroll">
                  {sections.map((section, index) => (
                    <div 
                      key={index} 
                      className={`analysis-section section-${section.title.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <div className="section-header">
                        <div className="section-icon">{section.icon}</div>
                        <h3 className="section-title">{section.title}</h3>
                      </div>
                      <div className="section-content">
                        {renderSectionContent(section.content)}
                      </div>
                    </div>
                  ))}
                </div>
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
          
          <div className="popup-arrow"></div>
        </div>
      )}
    </>
  );
}

export default AIAdvisor;