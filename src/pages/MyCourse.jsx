import React, { useState, useEffect, useCallback } from 'react';
import { FaSearch, FaChevronLeft, FaBookOpen, FaSpinner, FaExclamationTriangle, FaGraduationCap } from 'react-icons/fa';
import '../style.css';
import './MyCourse.css';
import { api } from '../utils/api';

function MyCourse({ user }) {
  const [activeTab, setActiveTab] = useState('core');
  const [activeGeneralType, setActiveGeneralType] = useState('All'); 
  const [activeSpec, setActiveSpec] = useState('Offshore');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [semFilter, setSemFilter] = useState('All');
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSections, setExpandedSections] = useState({});

  const courseTypeMapping = {
    'NR': 'National Requirement',
    'UR': 'University Requirement', 
    'CC': 'Common Course',
    'CD': 'Core Discipline',
    'CSp': 'Core Specialization'
  };

  const fetchCourses = useCallback(async () => {
    if (!user?.student_id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch all available courses for the student
      const allCourses = [];
      
      // Fetch different course types
      const [
        nationalCourses,
        universityCourses,
        commonCourses,
        coreDisciplineCourses,
        coreSpecializationCourses
      ] = await Promise.all([
        api.getNationalRequirementCourses(user.student_id),
        api.getUniversityRequirementCourses(user.student_id),
        api.getCommonCourses(user.student_id),
        api.getCoreDisciplineCourses(user.student_id),
        api.getCoreSpecializationCourses(user.student_id)
      ]);

      // Process and categorize courses
      const processCourses = (courseList, type, spec = null, semester = null) => {
        if (!Array.isArray(courseList)) return;
        
        courseList.forEach(course => {
          allCourses.push({
            code: course.course_code,
            name: course.course_name,
            type: type,
            spec: spec || course.specialization || null,
            credits: course.credit_hour || 3,
            sem: semester || course.course_semester || null,
            desc: course.course_description || '',
            pre_requisite: course.pre_requisite || null
          });
        });
      };

      // Process each course type
      processCourses(nationalCourses, 'NR');
      processCourses(universityCourses, 'UR');
      processCourses(commonCourses, 'CC');
      processCourses(coreDisciplineCourses, 'CD');
      
      // Core specialization courses might need special handling
      if (Array.isArray(coreSpecializationCourses)) {
        coreSpecializationCourses.forEach(course => {
          allCourses.push({
            code: course.course_code,
            name: course.course_name,
            type: 'CSp',
            spec: course.specialization || determineSpecialization(course.course_name),
            credits: course.credit_hour || 3,
            sem: course.course_semester || null,
            desc: course.course_description || '',
            pre_requisite: course.pre_requisite || null
          });
        });
      }

      setCourses(allCourses);
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError('Failed to load courses. Please try again.');
      
      // Fallback to some sample data if API fails
      const fallbackCourses = [
        { code: 'MPU3182', name: 'Penghayatan Etika & Peradaban', type: 'NR', credits: 2, sem: 1, desc: 'MPU requirement course' },
        { code: 'VFB1012', name: 'Civil Engineering Drawing', type: 'CD', credits: 2, sem: 1, desc: 'This course introduces engineering drawing basic principles in CAD.' },
        { code: 'VFB4113', name: 'Fixed Offshore Structures', type: 'CSp', spec: 'Offshore', credits: 3, desc: 'This course covers introduction to jacket platforms and structural design.' },
      ];
      setCourses(fallbackCourses);
    } finally {
      setLoading(false);
    }
  }, [user?.student_id]);

  // Helper function to determine specialization from course name
  const determineSpecialization = (courseName) => {
    if (!courseName) return 'General';
    const name = courseName.toLowerCase();
    if (name.includes('offshore')) return 'Offshore';
    if (name.includes('environment') || name.includes('sludge') || name.includes('pollution')) return 'Environmental';
    if (name.includes('sustainable') || name.includes('carbon')) return 'Sustainability';
    if (name.includes('energy') || name.includes('renewable')) return 'Renewable Energy';
    return 'General';
  };

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const filteredCourses = courses.filter(course => {
    const isCoreTab = activeTab === 'core';
    const isSpecTab = activeTab === 'spec';
    
    // Tab Logic
    const tabMatch = isCoreTab ? course.type !== 'CSp' : course.type === 'CSp';

    // Sub-Type 
    const subTypeMatch = (isCoreTab && activeGeneralType !== 'All') 
      ? course.type === activeGeneralType 
      : true;

    // Semester Match 
    const semMatch = isCoreTab 
      ? (semFilter === 'All' || course.sem?.toString() === semFilter) 
      : true;

    // Specialization Match 
    const specMatch = isSpecTab ? course.spec === activeSpec : true;

    // Search Filter
    const searchMatch = course.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        course.code.toLowerCase().includes(searchQuery.toLowerCase());

    return tabMatch && subTypeMatch && semMatch && specMatch && searchMatch;
  });

  // Group courses by semester for better organization
  const groupedCourses = filteredCourses.reduce((groups, course) => {
    const sem = course.sem || 'Other';
    if (!groups[sem]) {
      groups[sem] = [];
    }
    groups[sem].push(course);
    return groups;
  }, {});

  // Sort semesters numerically
  const sortedSections = Object.keys(groupedCourses).sort((a, b) => {
    if (a === 'Other') return 1;
    if (b === 'Other') return -1;
    return parseInt(a) - parseInt(b);
  });

  if (loading) {
    return (
      <div className="dashboard-wrapper">
        <div className="dashboard-content">
          <h2 className="my-course-title">My Curriculum Explorer</h2>
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Loading courses...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-wrapper">
        <div className="dashboard-content">
          <h2 className="my-course-title">My Curriculum Explorer</h2>
          <div className="error-container">
            <FaExclamationTriangle className="error-icon" />
            <p className="error-text">{error}</p>
            <button className="retry-button" onClick={fetchCourses}>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (selectedCourse) {
    return (
      <div className="dashboard-wrapper">
        <div className="dashboard-content">
          <button onClick={() => setSelectedCourse(null)} className="back-button">
            <FaChevronLeft /> Back to List
          </button>
          <div className="glass-card detail-card">
            <div className="detail-header">
              <div className="detail-title">
                <span className="course-type-badge">
                  {courseTypeMapping[selectedCourse.type] || selectedCourse.type} Module
                </span>
                <h2 className="detail-course-code">{selectedCourse.code}</h2>
                <h3 className="detail-course-name">{selectedCourse.name}</h3>
              </div>
              <div className="credit-circle">
                <span>{selectedCourse.credits}</span>
                <small>Credits</small>
              </div>
            </div>
            <div className="info-section">
              <h4 className="section-title">
                <FaBookOpen /> Course Description
              </h4>
              <p className="description-text">
                {selectedCourse.desc || 'No description available.'}
              </p>
            </div>
            {selectedCourse.pre_requisite && (
              <div className="info-section">
                <h4 className="section-title">
                  <FaGraduationCap /> Prerequisites
                </h4>
                <p className="description-text">
                  {Array.isArray(selectedCourse.pre_requisite) 
                    ? selectedCourse.pre_requisite.join(', ')
                    : selectedCourse.pre_requisite}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper my-course-container">
      <div className="dashboard-content">
        <h2 className="my-course-title">My Curriculum Explorer</h2>
        
        <div className="top-controls">
          <div className="tab-container">
            <button 
              className={`tab-button ${activeTab === 'core' ? 'active' : ''}`}
              onClick={() => { setActiveTab('core'); setSemFilter('All'); }}
            >
              General Pathway
            </button>
            <button 
              className={`tab-button ${activeTab === 'spec' ? 'active' : ''}`}
              onClick={() => setActiveTab('spec')}
            >
              Core Specialisation 
            </button>
          </div>

          <div className="search-filter-row">
            <div className="search-box">
              <FaSearch className="search-icon" />
              <input 
                type="text" 
                placeholder="Search code/name..." 
                className="search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)} 
              />
            </div>
            
            {activeTab === 'core' && (
              <select 
                className="select-filter" 
                value={semFilter} 
                onChange={(e) => setSemFilter(e.target.value)}
              >
                <option value="All">All Semesters</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                  <option key={n} value={n.toString()}>Semester {n}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Sub-Tabs */}
        {activeTab === 'core' && (
          <div className="sub-tab-container">
            {['All', 'NR', 'UR', 'CC', 'CD'].map(type => (
              <button 
                key={type} 
                className={`sub-tab ${activeGeneralType === type ? 'active' : ''}`}
                onClick={() => setActiveGeneralType(type)}
              >
                {type}
              </button>
            ))}
          </div>
        )}

        {activeTab === 'spec' && (
          <div className="sub-tab-container">
            {['Offshore', 'Environmental', 'Sustainability', 'Renewable Energy'].map(s => (
              <button 
                key={s} 
                className={`sub-tab ${activeSpec === s ? 'active' : ''}`}
                onClick={() => setActiveSpec(s)}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="glass-card course-list-container">
          {filteredCourses.length === 0 ? (
            <div className="empty-state">
              <FaBookOpen className="empty-state-icon" />
              <p className="empty-state-text">
                No courses found {searchQuery ? `for "${searchQuery}"` : ''}.
              </p>
              {searchQuery && (
                <p>Try a different search term or clear the search filter.</p>
              )}
            </div>
          ) : (
            <>
              {/* Accordion view for mobile/tablet, table for desktop */}
              <div className="mobile-course-list">
                {sortedSections.map(semester => (
                  <div key={semester} className="semester-section">
                    <div 
                      className="semester-header-label clickable"
                      onClick={() => toggleSection(semester)}
                    >
                      <span>
                        {semester === 'Other' ? 'Other Courses' : `Semester ${semester}`}
                        <small style={{ marginLeft: '10px', opacity: 0.7 }}>
                          ({groupedCourses[semester].length} courses)
                        </small>
                      </span>
                      <span>{expandedSections[semester] ? '−' : '+'}</span>
                    </div>
                    
                    {expandedSections[semester] && (
                      <div className="semester-courses">
                        {groupedCourses[semester].map(course => (
                          <div 
                            key={course.code} 
                            className="draggable-item clickable-row"
                            onClick={() => setSelectedCourse(course)}
                          >
                            <div style={{color:'white', fontWeight:'bold'}}>
                              <span className="course-code-badge">{course.code}</span>
                              {course.name}
                            </div>
                            <div style={{fontSize: '12px', color: '#ccc', marginTop: '5px'}}>
                              Type: {courseTypeMapping[course.type] || course.type} 
                              | Credits: {course.credits}
                              {course.spec && ` | Specialization: ${course.spec}`}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Desktop table view */}
              <table className="course-table" style={{ display: 'none' }}>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Course Name</th>
                    <th style={{textAlign: 'center'}}>Type</th>
                    <th style={{textAlign: 'center'}}>Credits</th>
                    {activeTab === 'core' && <th style={{textAlign: 'center'}}>Semester</th>}
                    {activeTab === 'spec' && <th style={{textAlign: 'center'}}>Specialization</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredCourses.map(c => (
                    <tr 
                      key={c.code} 
                      className="clickable-row"
                      onClick={() => setSelectedCourse(c)}
                    >
                      <td style={{fontWeight: 'bold', color: '#9ad59d'}}>{c.code}</td>
                      <td>{c.name}</td>
                      <td style={{textAlign: 'center'}}>
                        <span className="course-type-badge">{c.type}</span>
                      </td>
                      <td style={{textAlign: 'center'}}>{c.credits}</td>
                      {activeTab === 'core' && (
                        <td style={{textAlign: 'center'}}>{c.sem || 'N/A'}</td>
                      )}
                      {activeTab === 'spec' && (
                        <td style={{textAlign: 'center'}}>{c.spec || 'General'}</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default MyCourse;