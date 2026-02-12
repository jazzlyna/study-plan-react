import React, { useState, useEffect } from 'react';
import { FaSearch, FaChevronLeft, FaChevronDown } from 'react-icons/fa'; // Added FaChevronDown
import { api } from '../utils/api'; 
import { supabase } from '../utils/api';
import './MyCourse.css';

export default function MyCourse() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('core'); 
  const [activeGeneralType, setActiveGeneralType] = useState('All'); 
  const [activeSpecSubTab, setActiveSpecSubTab] = useState('All'); 
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [semFilter, setSemFilter] = useState('All');
  const [studentId, setStudentId] = useState(null);

  useEffect(() => {
    const getSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setStudentId(user.id);
      }
    };
    getSession();
  }, []);

  const isAllSubtab = (activeTab === 'core' && activeGeneralType === 'All') || 
                      (activeTab === 'spec' && activeSpecSubTab === 'All');

  const fetchCourses = async () => {

    if (!studentId) return;

    setLoading(true);
    try {
      let data = [];
      if (activeTab === 'spec') {
        data = await api.getAllSpecialization(studentId);
      } else {
        switch (activeGeneralType) {
          case 'NR': data = await api.getAllNational(studentId); break;
          case 'UR': data = await api.getAllUniversity(studentId); break;
          case 'CC': data = await api.getAllCommon(studentId); break;
          case 'CD': data = await api.getAllCoreDiscipline(studentId); break;
          default:   data = await api.getCourses(studentId); break;
        }
      }

      const formattedData = (data || []).map(c => ({
        code: c.course_code,
        name: c.course_name,
        sem: c.course_semester,
        desc: c.course_desc,
        credits: c.credit_hour,
        prereq: c.pre_requisite && c.pre_requisite.length > 0 ? c.pre_requisite.join(', ') : 'None',
        type: c.course_type || (activeTab === 'spec' ? activeSpecSubTab : activeGeneralType)
      }));

      setCourses(formattedData);
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    if (studentId) fetchCourses(); 
  }, [studentId, activeTab, activeGeneralType, activeSpecSubTab]);

  const filteredCourses = courses.filter(c => {
    const searchMatch = (c.name + c.code).toLowerCase().includes(searchQuery.toLowerCase());
    const semMatch = semFilter === 'All' || String(c.sem) === semFilter;
    const specMatch = activeTab === 'spec' && activeSpecSubTab !== 'All'
      ? (c.desc?.toLowerCase().includes(activeSpecSubTab.toLowerCase()) || 
         c.name.toLowerCase().includes(activeSpecSubTab.toLowerCase()))
      : true;
    return searchMatch && semMatch && specMatch;
  });


if (selectedCourse) {
  return (
    <div className="course-container">
      {/* Back button now uses CSS classes for light/dark visibility */}
      <button className="back-btn" onClick={() => setSelectedCourse(null)}>
        <FaChevronLeft /> BACK TO CATALOG
      </button>

      <div className="detail-card-layout">
        <div className="detail-main-content">
          <div className="detail-header-compact">
            <span className="type-badge" style={{ marginBottom: '8px', display: 'inline-block' }}>
              {selectedCourse.type}
            </span>
            <h2 className="detail-title-compact">{selectedCourse.name}</h2>
            <div className="detail-divider"></div>
          </div>
          
          <div className="detail-section">
            <label className="section-label">Course Description</label>
            <p className="description-text">
              {selectedCourse.desc || "No description provided for this course."}
            </p>
          </div>
        </div>

        {/* This panel is now White with Black Outline and Black Font per your request */}
        <div className="detail-stats-panel">
          <div className="stat-row">
            <span className="stat-label">Code</span>
            <span className="stat-value highlighted">{selectedCourse.code}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Credits</span>
            <span className="stat-value">{selectedCourse.credits} Units</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Semester</span>
            <span className="stat-value">{selectedCourse.sem}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Prerequisite</span>
            <span className="stat-value prereq-text">{selectedCourse.prereq || 'None'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

  return (
    <div className="course-container">
      <h2 className="title-text">Course Catalog</h2>

      <div className="controls-wrapper">
        <div className="tabs-stack">
          <div className="main-tabs">
            <button className={`tab-btn ${activeTab === 'core' ? 'active' : ''}`} onClick={() => setActiveTab('core')}>General</button>
            <button className={`tab-btn ${activeTab === 'spec' ? 'active' : ''}`} onClick={() => setActiveTab('spec')}>Specialisation</button>
          </div>

          <div className="sub-tab-group">
            {(activeTab === 'core' ? ['All', 'NR', 'UR', 'CC', 'CD'] : ['All', 'Offshore', 'Environmental', 'Sustainability', 'Renewable']).map(t => (
              <button 
                key={t} 
                className={`sub-tab-btn ${activeGeneralType === t || activeSpecSubTab === t ? 'active' : ''}`}
                onClick={() => activeTab === 'core' ? setActiveGeneralType(t) : setActiveSpecSubTab(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group">

             <a 
    href="https://utp.edu.my/Pages/Admission/Undergraduate/Bachelor-of-Civil-Engineering-with-Honours.aspx#menu1" 
    target="_blank" 
    rel="noopener noreferrer"
    className="resource-link-btn"
    style={{ 
      textDecoration: 'none',
      display: 'flex',
      alignItems: 'center'
    }}
  >
    <button className="resource-btn">
      Course Resources
    </button>
  </a>

          <div className="search-bar">
            <FaSearch size={16} style={{ opacity: 0.5 }} />
            <input type="text" placeholder="Search code or name..." onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          
          {/* Custom Pretty Dropdown Wrapper */}
          <div className="dropdown-wrapper">
            <select className="select-dropdown" value={semFilter} onChange={(e) => setSemFilter(e.target.value)}>
              <option value="All">Semester</option>
              {/* Updated to 10 Semesters */}
              {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={String(n)}>{n}</option>)}
            </select>
            <FaChevronDown className="dropdown-icon" />
          </div>
        </div>
      </div>

      <div className="course-card-main">
        <div className={`box-header ${isAllSubtab ? 'no-type' : ''}`}>
          <span>Code</span>
          <span>Course Name</span>
          {!isAllSubtab && <span>Category</span>}
          <span>Prerequisite</span>
          <span style={{textAlign:'center'}}>Units</span>
        </div>

        <div className="course-list-wrapper">
          {loading ? (
            <div style={{padding:'60px', textAlign:'center', fontSize:'16px', fontWeight:'bold', letterSpacing:'2px'}}>LOADING...</div>
          ) : filteredCourses.length > 0 ? (
            filteredCourses.map((c, i) => (
              <div key={i} className={`course-row-box ${isAllSubtab ? 'no-type' : ''}`} onClick={() => setSelectedCourse(c)}>
                <span style={{fontWeight: 900}}>{c.code}</span>
                <span style={{fontWeight: 700}}>{c.name}</span>
                {!isAllSubtab && <span><span className="type-badge">{c.type}</span></span>}
                <span style={{fontSize: '13px', opacity: 0.8}}>{c.prereq}</span>
                <span style={{textAlign:'center', fontWeight: 900}}>{c.credits}</span>
              </div>
            ))
          ) : (
            <div style={{textAlign:'center', padding:'80px', opacity:0.5, fontSize:'16px'}}>No courses match your criteria.</div>
          )}
        </div>
      </div>
    </div>
  );
}