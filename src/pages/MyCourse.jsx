import React, { useState, useEffect } from 'react';
import { FaSearch, FaChevronLeft, FaBookOpen } from 'react-icons/fa';
import { api } from '../utils/api'; 
import './MyCourse.css'; // Import the new CSS file

export default function MyCourse() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('core'); 
  const [activeGeneralType, setActiveGeneralType] = useState('All'); 
  const [activeSpecSubTab, setActiveSpecSubTab] = useState('Offshore'); 
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [semFilter, setSemFilter] = useState('All');

  const fetchCourses = async () => {
    setLoading(true);
    try {
      let data = [];
      if (activeTab === 'spec') {
        data = await api.getAllSpecialization();
      } else {
        switch (activeGeneralType) {
          case 'NR': data = await api.getAllNational(); break;
          case 'UR': data = await api.getAllUniversity(); break;
          case 'CC': data = await api.getAllCommon(); break;
          case 'CD': data = await api.getAllCoreDiscipline(); break;
          default:   data = await api.getCourses(); break;
        }
      }

      const formattedData = (data || []).map(c => ({
        code: c.course_code,
        name: c.course_name,
        sem: c.course_semester,
        desc: c.course_desc,
        credits: c.credit_hour,
        type: c.course_type || activeGeneralType 
      }));

      setCourses(formattedData);
    } catch (error) {
      console.error("Error fetching courses:", error);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [activeTab, activeGeneralType]);

  const filteredCourses = courses.filter(c => {
    const searchMatch = (c.name + c.code).toLowerCase().includes(searchQuery.toLowerCase());
    const semMatch = semFilter === 'All' || String(c.sem) === semFilter;
    const specMatch = activeTab === 'spec' 
      ? (c.desc?.toLowerCase().includes(activeSpecSubTab.toLowerCase()) || 
         c.name.toLowerCase().includes(activeSpecSubTab.toLowerCase()))
      : true;
    return searchMatch && semMatch && specMatch;
  });

// ... inside selectedCourse if block
if (selectedCourse) {
  return (
    <div className="course-container">
      <button className="back-link" onClick={() => setSelectedCourse(null)}>
        <FaChevronLeft /> Back to Catalog
      </button>
      
      <div className="detail-card">
        <div className="detail-header">
          <span className="type-badge">{selectedCourse.type}</span>
          <p className="detail-code">{selectedCourse.code}</p>
          <h1 className="detail-title">{selectedCourse.name}</h1>
        </div>

        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">CREDIT HOURS</span>
            <span className="info-value">{selectedCourse.credits} Units</span>
          </div>
          <div className="info-item">
            <span className="info-label">RECOMMENDED SEMESTER</span>
            <span className="info-value">Semester {selectedCourse.sem}</span>
          </div>
          <div className="info-item">
            <span className="info-label">COURSE TYPE</span>
            <span className="info-value">{selectedCourse.type}</span>
          </div>
        </div>

        <div className="detail-divider"></div>

        <div className="description-section">
          <h4>
            <FaBookOpen className="accent-icon" /> Course Description
          </h4>
          <p className="description-text">
            {selectedCourse.desc || "No specific description available for this course yet."}
          </p>
        </div>
      </div>
    </div>
  );
}

  return (
    <div className="course-container">
      <div className="header-row">
        <h2 className="title-text">My Course Catalog</h2>
        <div className="filter-group">
           <div className="search-bar">
              <FaSearch style={{ opacity: 0.5 }} />
              <input type="text" placeholder="Search courses..." onChange={(e) => setSearchQuery(e.target.value)} />
           </div>
           <select className="select-dropdown" value={semFilter} onChange={(e) => setSemFilter(e.target.value)}>
              <option value="All">All Semesters</option>
              {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={String(n)}>Sem {n}</option>)}
           </select>
        </div>
      </div>
      
      <div className="main-tabs">
        <button className={`tab-btn ${activeTab === 'core' ? 'active' : ''}`} onClick={() => setActiveTab('core')}>
          General Pathway
        </button>
        <button className={`tab-btn ${activeTab === 'spec' ? 'active' : ''}`} onClick={() => setActiveTab('spec')}>
          Core Specialisation
        </button>
      </div>

      <div className="sub-tab-group">
        {(activeTab === 'core' ? ['All', 'NR', 'UR', 'CC', 'CD'] : ['Offshore', 'Environmental', 'Sustainability', 'Renewable Energy']).map(t => (
          <button 
            key={t} 
            className={`sub-tab-btn ${activeGeneralType === t || activeSpecSubTab === t ? 'active' : ''}`} 
            onClick={() => activeTab === 'core' ? setActiveGeneralType(t) : setActiveSpecSubTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="course-card">
        {loading ? <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div> : (
          <table className="course-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Course Name</th>
                <th style={{ textAlign: 'center' }}>Type</th> 
                <th style={{ textAlign: 'center' }}>Credits</th>
              </tr>
            </thead>
            <tbody>
              {filteredCourses.length > 0 ? (
                filteredCourses.map((c, i) => (
                  <tr key={i} onClick={() => setSelectedCourse(c)} style={{ cursor: 'pointer' }}>
                    <td className="course-code-cell">{c.code}</td>
                    <td>{c.name}</td>
                    <td style={{ textAlign: 'center' }}><span className="type-badge">{c.type}</span></td>
                    <td style={{ textAlign: 'center' }}>{c.credits}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>No courses found.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}