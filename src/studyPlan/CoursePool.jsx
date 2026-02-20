import React, { useEffect } from 'react';
import { FaSearch } from 'react-icons/fa';
import './StudyPlan.css';

const CoursePool = ({
  searchQuery,
  setSearchQuery,
  activeMainTab,
  setActiveMainTab,
  activeSubTab,
  setActiveSubTab,
  curriculumPool,
  expandedSem,
  setExpandedSem,
  handleAddCourse,
  fetchPool
}) => {
  const handleTabClick = (tab) => {
    setActiveSubTab(tab);
    fetchPool(tab);
  };

  useEffect(() => {
  if (activeMainTab === 'spec') {
    
    fetchPool('spec');
  } else {
    
    fetchPool(activeSubTab);
  }
}, [activeMainTab, fetchPool, activeSubTab]);

  
  const handleDragStart = (e, course) => {
    e.dataTransfer.setData("course", JSON.stringify(course));
  };

  const tabLabels = {
  'All': 'All Courses',
  'NR': 'National Requirement',
  'UR': 'University Requirement',
  'CC': 'Common Course',
  'CD': 'Core Discipline',
  'EM': 'Elective / Minor',
  'CI': 'Internship'
};

  return (
    <div className="glass-card pool-card">
      <div className="search-box">
        <FaSearch className="search-icon" />
        <input 
          type="text" 
          placeholder="Search..." 
          className="search-input" 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)} 
        />
      </div>
      
      <div className="course-type-toggle-group">
        <button 
          className={`course-type-tab ${activeMainTab === 'core' ? 'active' : ''}`}
          onClick={() => setActiveMainTab('core')}
        >
          General Pathway
        </button>
        <button 
          className={`course-type-tab ${activeMainTab === 'spec' ? 'active' : ''}`}
          onClick={() => setActiveMainTab('spec')}
        >
          Core Specialisation
        </button>
      </div>
      
     {activeMainTab === 'core' && (
        <div className="sub-tabs">
          
          {['All','NR','UR','CC','CD', 'EM', 'CI'].map(sub => (
            <button 
              key={sub}
              className={`sub-tab ${activeSubTab === sub ? 'active' : ''}`}
              onClick={() => handleTabClick(sub)}
              title={tabLabels[sub]}
            >
              {sub}
            </button>
          ))}
        </div>
      )}
      

      
      <div className="pool-list-fixed">
        {Object.keys(curriculumPool).length > 0 ? (
          Object.keys(curriculumPool)
            .sort((a, b) => (parseInt(a) || 0) - (parseInt(b) || 0))
            .map(sem => {
              //  Apply search filter to this semester's courses
              const filteredCourses = curriculumPool[sem].filter(c => 
                c.course_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                c.course_code?.toLowerCase().includes(searchQuery.toLowerCase())
              );
              
              // Don't show semester if it has no matching courses 
              if (searchQuery.trim() !== '' && filteredCourses.length === 0) {
                return null;
              }
              
              return (
                <div key={sem} style={{ marginBottom: '10px' }}>
                  <div 
                    className="semester-header-label clickable" 
                    onClick={() => setExpandedSem(expandedSem === sem ? null : sem)} 
                    style={{ background: expandedSem === sem ? 'rgba(129, 199, 132, 0.1)' : 'rgba(255,255,255,0.03)' }}
                  >
                    <span style={{ fontWeight: 'bold' }}>Semester {sem}</span>
                    <span>{expandedSem === sem ? '−' : '+'}</span>
                  </div>
                  
                  {/* SHOW COURSES WHEN: expanded OR when searching  */}
                  {(expandedSem === sem || searchQuery.trim() !== '') && (
                    <div className="semester-courses">
                      {filteredCourses.map(course => (
                        <div 
                          key={course.course_code} 
                          draggable 
                          onDragStart={(e) => handleDragStart(e, course)}
                          onClick={() => handleAddCourse(course)}
                          className="draggable-item"
                        >
                          <div className="course-code">{course.course_code}</div>
                          <div style={{fontSize: '13px', color: 'var(--text-main)'}}>{course.course_name}</div>
                          <div style={{fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px'}}>
                             {course.credit_hour} Credits • Pre: {course.pre_requisite || 'None'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
        ) : (
          <div className="empty-state">
            {searchQuery.trim() !== '' 
              ? 'No matching courses found' 
              : 'Select a category or semester'}
          </div>
        )}
        
        {/* Show "no results" message when searching and no semesters are displayed */}
        {Object.keys(curriculumPool).length > 0 && 
         searchQuery.trim() !== '' && 
         Object.keys(curriculumPool)
           .filter(sem => 
             curriculumPool[sem].some(c => 
               c.course_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
               c.course_code?.toLowerCase().includes(searchQuery.toLowerCase())
             )
           ).length === 0 && (
          <div className="empty-state">
            No courses match "{searchQuery}"
          </div>
        )}
      </div>
    </div>
  );
};

export default CoursePool;