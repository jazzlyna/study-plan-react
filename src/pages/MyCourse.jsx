import React, { useState } from 'react';
import { FaSearch, FaChevronLeft, FaBookOpen } from 'react-icons/fa';
import '../style.css';

function MyCourse() {
  const [activeTab, setActiveTab] = useState('core');
  const [activeGeneralType, setActiveGeneralType] = useState('All'); 
  const [activeSpec, setActiveSpec] = useState('Offshore');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [semFilter, setSemFilter] = useState('All');

  const courses = [
    // SEMESTER 1
    { code: 'MPU3182 / MPU3142 ', name: 'Penghayatan Etika & Peradaban (PEP) / BM Komunikasi 2', type: 'NR', credits: 2, sem: 1, desc: 'MPU3142 - BM Komunikasi 2 is only or international student and can only be taken on January' },
    { code: 'PFB1012', name: 'Intro to Oil & Gas Industry', type: 'NR', credits: 2, sem: 1, desc: '' },
    { code: 'HFB2152', name: 'Ethics and Integrity', type: 'UR', credits: 2, sem: 1, desc: '' },
    { code: 'FFM1013', name: 'Engineering Mathematics 1', type: 'CC', credits: 3, sem: 1, desc: '' },
    { code: 'VFB1012', name: 'Civil Engineering Drawing', type: 'CD', credits: 2, sem: 1, desc: 'This course introduces to engineering drawing basic principle in CAD such as objectives, sketches, text and visualisation techniques, stc ; as the methods in deceloping 2D and 3D drawins. It also provides the ability to understand architectural, civil and structural drawings in a typical civil engineering project.' },
    { code: 'VFB1023', name: 'Engineering Mechanics', type: 'CD', credits: 3, sem: 1, desc: 'Engineering Mechanics is the first mechanics course in the civil engineering programme. This course deals with rigit-body mechanics and consists of 2 part: statistic that deals with the equilibrium of the bodies that are either at restor move with constant velocity and dynamics that deal with bodies in motion.' },

    // SEMESTER 2
    { code: 'MPU3192', name: 'Falsafah & Isu Semasa (FIS)', type: 'NR', credits: 2, sem: 2, desc:''},
    { code: 'FFM1023', name: 'Engineering Mathematics 2', type: 'CC', credits: 3, sem: 2, desc:'' },
    { code: 'CFB1033', name: 'Health, Safety & Environment', type: 'CC', credits: 2, sem: 2, desc: '' },
    { code: 'VFB1033', name: 'Mechanics of Solid', type: 'CD', credits: 3, sem: 2, desc: 'This course cover the fundumental concepts of solif mechanics covering carious structural elements such as beams, columns, shaft and thin- walled structures. The course deal with the various types of stress and strain due to axial load, bending, torsion and combinations. ' },
    { code: 'VFB1043', name: 'Geomatics', type: 'CD', credits: 3, sem: 2, desc: 'This course will cover relevant geomatics topics applicable for civil engineering application such as analysis of terrestrial base measurement for control in engineering survey, satellite-based positioning for offshore application and GIS for dicision making.' },
    { code: 'KXXxxx1', name: 'CO Curriculum I', type: 'UR', credits: 1, sem: 2, desc: '' },

    // SEMESTER 3
    { code: 'LFB1042', name: 'Academic Writing', type: 'UR', credits: 2, sem: 3, desc: '' },
    { code: 'HFB1022', name: 'Scientific Inquiry', type: 'UR', credits: 2, sem: 3, desc: '' },
    { code: 'FFM1063', name: 'Statistic & Application', type: 'CC', credits: 3, sem: 3, desc: '' },
    { code: 'VFB1063_F', name: 'Civil Engineering Fluid Mechanics', type: 'CD', credits: 2, sem: 3, desc: 'this course cover fluid characteristics, hydrostatics, fluid motion (hydrodynamics) and pipe flow. Students will be introduced to basic pricciple and equations of fluid mechanics in the context of civil engineering. They should be able to analyse the physical processes that covern the behaviour of fluid at rest and in motion and to analyse the flow in pipes upom complesion of this course. The student will also be introduced of the use of common CFD software to solve the problem associated with civil engineering' },
    { code: 'VFB1063_T', name: 'Theory of Structure', type: 'CD', credits: 3, sem: 3, desc: 'This course cover the funfamental concepts of analysis of determinate structures incluf=ding frames, cables and three-hinged arches. The course introduces the students to influence lines, deflection of 2D skeletal structures using various methods and buckling using Euler-Bernoulli beam theory' },
    { code: 'VFB1072', name: 'Traffic Engineering', type: 'CD', credits: 2, sem: 3, desc: 'to introduce the fundumental of traffic eengineering that includes civil engineering and transportation system, principle of traffic flow and traffic engineering studies, capacity studies, road intersection analysis, transport planninf and modeling, traffic impact assesment (TIA), traffic management system' },

    // SEMESTER 4
    { code: 'HFB20233', name: 'Professional Communication Skills Course', type: 'UR', credits: 3, sem: 4, desc: '' },
    { code: 'VFB2012', name: 'Sustainable Concrete Technology', type: 'CD', credits: 2, sem: 4, desc: 'This course focusses on the nature and performance as well as the physical and mechanical properties of concrete technology materials which include cement and aggregates. Ordinary cement concrete mix design is introduced to meet the constrution industry needs, coupled by othercement replacement materials and technologies in enhancing service life performance of concrete' },
    { code: 'VFB2023', name: 'Soil Mechanics', type: 'CD', credits: 3, sem: 4, desc: 'Soil in engineering formation of soil, description and classificatio, physical index properties of soil, soil in water, permeanility, capillarity ans seepage, stresses in soil, soil compaction, soil consolidation ans shear strenghth' },
    { code: 'VFB2033', name: 'Structural Analysis', type: 'CD', credits: 3, sem: 4, desc: 'THis course deals with structure=al analysis of indeterminate structures. Four methods are emphasised namely forced method, slope displacement method, moment distribution method ans stiffness methods. Also included are two-hinged arch, plastic collapse analysis and introc=duction to principles of dynamics of structures.' },
    { code: 'VFB2043', name: 'Hydraulics', type: 'CD', credits: 3, sem: 4, desc: 'This course emphasise the use of the fundumental of open channel flows in the design of hydraulic structures such as weirs, culverts, concrete gravity dams,spillways and energy dissipation structure.' },

    // SEMESTER 5
    { code: 'MPU2', name: 'One (1) MPU2 Course', type: 'NR', credits: 2, sem: 5, desc: '' },
    { code: 'FFM2063', name: 'Data Analytics', type: 'CC', credits: 3, sem: 5, desc: '' },
    { code: 'GFB2102', name: 'Entrepreneurship', type: 'UR', credits: 2, sem: 5, desc: '' },
    { code: 'MFB2061', name: 'Engineering Team Project I', type: 'CC', credits: 1, sem: 5, desc: '' },
    { code: 'VFB2052', name: 'Civil Engineering Laboratory I', type: 'CD', credits: 2, sem: 5, desc: 'To introduce laboratory experimental works and investigation in geotechnics, material and structure. TO develop the techniques of conducting measurements, data analysis and interpret result in written report, and to enhance the ability to participate efffectiveky in a laboratory environment and be able to work as part of a team' },
    { code: 'VFB2063', name: 'Hydrology', type: 'CD', credits: 3, sem: 5, desc: 'This course introduces the fundumental concepts of hydrology whithin a watershed. It gaves an overview of the fundamentals of hydrologic cycle through the usage of water budget, and other related equations. The course focusses on precipitation and streamflow, runoff and hydrograph, flood estimation and flood control, and flood routing. Theories of groundwater flow an sedimentation are also covered, hydrologic modelling and application of software in hydrologic simulation are introduced. ' },

    // SEMESTER 6
    { code: 'MPU4', name: 'Community Engagement Project', type: 'NR', credits: 2, sem: 6, desc: '' },
    { code: 'MFB2062', name: 'Engineering Team project II', type: 'CC', credits: 2, sem: 6, desc: '' },
    { code: 'VFB2073', name: 'Highway Engineering', type: 'CD', credits: 3, sem: 6, desc: 'the course covers introduction to the fundamental of highway engineering that includes highway materials and mix design, pavement design, geometric design, highway construction, highway maintenance and environmental impact of highway project.' },
    { code: 'VFB2082', name: 'Design of Steel Structures', type: 'CD', credits: 2, sem: 6, desc: 'This course will cover the concept and design philosophy, the analysing techniques and design method associated with the design of steel structures folloeing apecific design code practice. Introduction to design software is also included.' },
    { code: 'VFB2092', name: 'Civil Engineering laboratory II', type: 'CD', credits: 2, sem: 6, desc: 'To introcuce laboratory experimental works and investigation in hydrology, hydrolics and fluid mechanics, develop the techniques of conducting measurements, data analysis and interpret result in written report and enhance the ability to participate effectively in laboratory environment and able to work as part of a team.' },
    { code: 'VFB2102', name: 'Water Supply Engineering', type: 'CD', credits: 2, sem: 6, desc: 'The course introduce the fundumentals of water trratment analysis, principle of water quality and water treatment processes. The course also covers the design of water tratment ubits for a water treatment plant and its water distrubution network. Added content on water secutity and sustainable water treatment processes. At the end of the course, the student will eb able to evaluate various water sources and design the suitable eater treatment processes to meet the drinking water quality standards.' },

    // SEMESTER 7
    { code: 'MPU3', name: 'One (1) MPU3 Course', type: 'NR', credits: 2, sem: 7, desc: '' },
    { code: 'KXXxxx2', name: 'Co Curriculum II', type: 'UR', credits: 1, sem: 7, desc: '' },
    { code: 'VFB3012', name: 'Civil Engineering Laboratory III', type: 'CD', credits: 2, sem: 7, desc: 'To introduce laboratory experimental work and investigation in highway, environmental and waste water engineering, to developt the techniques of conducting measurement, data analysis and interpret result in written report and to enhance the ability to participate effectively in laboratory environment and be able to work as a part of a team' },
    { code: 'VBF3022', name: 'Design of Reinforced Concrete Structure I', type: 'CD', credits: 2, sem: 7, desc: 'This course introduces the principle and methods of limit state design for contrete structurs. It provide an understanding of the basic theory and guide to design procedures according to the Erocode 2. The design and detailing of beam, slab, short column and pad footing are covered. Introduction to design software is also included.' },
    { code: 'VFB3033', name: 'Waste Water Engineering', type: 'CD', credits: 3, sem: 7, desc: 'This course covers wastewater engineering topics which includes sources, characteristics, reaction kinetics of wastewater and design of sewerage reticulation network. This course also covers design of various processes or aerobic and anaerobic wastewater treatment for suspended and attached growth systems. Added content and sustainable wastewater treatment processes is included. .' },
    { code: 'VFB3042', name: 'Design of Foundation', type: 'CD', credits: 2, sem: 7, desc: '' },

    // SEMESTER 8
    { code: 'VFB4013', name: 'Construction Project Management', type: 'CD', credits: 3, sem: 8, desc: 'This course provides insight about [ractice in managing construction projects. It analyses issues faced by construction industry and strategy to reengineer its current practice regarding work process flow and procurement system. The course covers teh overview of the construction industry in Malaysia and the main playersand provides the knowledge for managing the construction of engineering projects successfully. Added focus on digitalization/IoT and planning tool is provided in this course.' },
    { code: 'VFB4022', name: 'Design of Reinforced Concrete Structures II', type: 'CD', credits: 2, sem: 8, desc: 'The course will cover the fundumental concept of design of RC slender column, straicase, combined and pile cap foundations. The design and detailing of members are according ro the Erocode 2. Also, introduction to pre- Stssed Concrete (Priciple and method) are covered Introduction to design software is also included.' },
    { code: 'VFB4032', name: 'Building Information Modelling', type: 'CD', credits: 2, sem: 8, desc: 'the course on Introduction Building Information Modelling (BIM) is Designed to create knowledge on the principles, methods and application in the building life cyclewith a focus on the design process; includes computer- aided design, parametric modelling, database, web technologies, design performance simulation and visualisation. ' },
    { code: 'VFB4042', name: 'Civil Engineering Design I', type: 'CD', credits: 2, sem: 8, desc: '	This course addresses key issues related to the initial conceptual planning stage and development of data project. Students will integrate all acquired academic knowledge from prior classes. Students will be prepared under the real-life design and implementation practice. Students will be exposed to standard contracts for procurement, standards and requirements, interpretation of concept design into actual design, preparation of traffic and environmental impact assessment. Client brief and architectural initial plan will be used to subject to capital project for economical design. Financial assessment and feasibility study will be introduced from quality surveying activity. Project life cycle for a sustainable design, implementation, and operation will be also introduced. External experts from industry will be invited for assessment of students works.' },
    { code: 'VFB4052', name: 'Design Of Earth Retaining Structure', type: 'CD', credits: 2, sem: 8, desc: 'This course will provide working knowledge to analyse and design earth retaining structure.' },

    // SEMESTER 9
    { code: 'PFB4102', name: 'Engineering Economics', type: 'CC', credits: 2, sem: 9, desc: '' },
    { code: 'VFB4063', name: 'Civil Engineering Design II', type: 'CD', credits: 3, sem: 9, desc: '' },
    { code: 'VFB4072', name: 'Final Year Project I', type: 'CD', credits: 2, sem: 9, desc: 'In the final year project student will apply and put into practice all the skills and technical knowledge gained throughout the civil & engineering programme to design and implement a solution to a research or practice.' },
    { code: 'VFB4082', name: 'Computational Method for Civil Engineers', type: 'CD', credits: 2, sem: 9, desc: 'Civil engineering practice involves a lot eith approximate solutions due to the complexity of the problems. The approximate solutions, on the other hand, are usually obtain by numarical method thus making the knowledge as pertinent to all civil engineers. This course will draw examples from all the civil engineering discipline.' },
    { code: 'VFBXX3_1', name: 'Core Specialisation I', type: '-', credits: 3, sem: 9, desc: '' },

    // SEMESTER 10
    { code: 'EFB4073', name: 'Engineers in Society', type: 'CC', credits: 3, sem: 10, desc: '' },
    { code: 'VFB4094', name: 'Final Year Project II', type: 'CD', credits: 4, sem: 10, desc: 'This is an individual research project in connection with special engineering problem and under the guidance of faculty member. The project undertaken may fall under one of the following areas: mathematical analysis, experimental test, computer simulation, hardare and/or software development, device fabrication.' },
    { code: 'VFBXX3_2', name: 'Core Specialisation II', type: '-', credits: 3, sem: 10, desc: '' },
    { code: 'VFBXX3_3', name: 'Core Specialisation III', type: '-', credits: 3, sem: 10, desc: '' },

    // CORE SPECIALISATION
    { code: 'VFB4113', name: 'Fixed Offshore Structures', type: 'CSp', spec: 'Offshore', credits: 3, desc: 'This course covers introduction to jacket platforms, Gravity Based Structure (GBS), & Jack-up platforms,various steps in the structural design of offshore platform components, overall design of fixed platforms using software, solutions for industry requirements and preparation of working drawing at various stages of design.' },
    { code: 'VFB4123', name: 'Wave Hydrodynamics', type: 'CSp', spec: 'Offshore', credits: 3, desc: 'Wave loading consists of the largest contribution to the loading of offshore structures. Therefore, a good understanding of hydrodynamics is essential for the design of any offshore structure. This course covers wave theories, wave mechanics, forces on marine structures, numerical and physical modelling.' },
    { code: 'VFB4133', name: 'Offshore Hydrodynamics', type: 'CSp', spec: 'Offshore', credits: 3, desc: 'Wave loading consists of the largest contribution to the loading of offshore structures. Therefore, a good understanding of hydrodynamics is essential for the design of any offshore structure. This course covers wave theories, wave mechanics, forces on marine structures, numerical and physical modelling.' },
    { code: 'VFB4213', name: 'Sludge Management and Disposal', type: 'CSp', spec: 'Environmental', credits: 3, desc: 'Project management in offshore applications is an important area in which a successful offshore project is dependent on. This course exposes students to various aspects of project management and engineering, covering theory and practice to develop and improve project management skills where the work scope includes oil and gas projects.' },
    { code: 'VFB422', name: 'Advanced Physical-Chemical Treatment Technologies', type: 'CSp', spec: 'Environmental', credits: 3, desc: 'Overview of the physical and chemical process to treat industrial wastewater as well as sludge. The focused processes include chemical precipitation, coagulation-flocculation, filtration, adsorption, disinfection, ion exchange, membrane process, and chemical oxidation.' },
    { code: 'VFB423', name: 'Air Pollution Prevention', type: 'CSp', spec: 'Environmental', credits: 3, desc: '	This course will discuss the basic chemical processes occurring in each region of the atmosphere, we can communicate with them. The main goal is to ensure that the environment is maintained by the people who are working on a new environment. This means that the environment is maintained by the people who are working on a new environment. We can also provide an opportunity to understand the environment and how it is maintained.' },
    { code: 'VFB4413', name: 'Construction Materials & Sustainability', type: 'CSp', spec: 'Sustainability', credits: 3, desc: 'This course deals with the physical and mechanical properties of major construction materials and their impacts to sustainability. At the end of this course, the students will be able to effectively evaluate, select and apply knowledge on the materials to improve the sustainability of construction practices.' },
    { code: 'VFB4423', name: 'Low Carbon Building Design and Construction', type: 'CSp', spec: 'Sustainability', credits: 3, desc: 'This course develops the competencies and skills for low carbon buildings design and construction to enable performance of low carbon buildings and the integration of low carbon energy systems, with the specifics of reducing design and construction business risk. This greatest attention to low carbon has revealed that greenhouse gas (GHG) emissions associated with materials used in buildings design and construction.' },
    { code: 'VFB4433', name: 'Sustainable Transport Infrastructure Engineering', type: 'CSp', spec: 'Sustainability', credits: 3, desc: 'This course introduces the basic concepts of transport infrastructure and describe the methods of planning or evaluation of sustainable transport infrastructure. Methods to design travelways are also explained. Safety and intelligence aspects of transportation systems are also elaborated. At the end of this course, students will be able to plan and evaluate the design and construction of sustainable transport infrastructure with consideration in sustainability, safety and intelligence aspects through the adoption of information technology.' },
    { code: 'MFB4123', name: 'Energy Management and Environment', type: 'CSp', spec: 'Renewable Energy', credits: 3, desc: 'The course covers topics on energy auditing – site survey, data acquisition, analysis and reporting. Strategies: Energy conservation strategies, energy management systems, requirements, demand site management, efficiency assessment issues, environmental compliance, resource cases, Carbon trading, etc.: Project investment costs, payback periods, net present value method, life cycle analysis, etc.' },
    { code: 'MFB4513', name: 'Renewable Energy I', type: 'CSp', spec: 'Renewable Energy', credits: 3, desc: 'This course covers topics on wind power, simple theory of the wind turbine’s performance & present development, level reduction, and pumped storage systems. Solar thermal power is a global power. Design of low temperature solar heaters for domestic use. Performance characteristics. Description of solar systems for power generation.' },
    { code: 'MFB4523', name: 'Renewable Energy II', type: 'CSp', spec: 'Renewable Energy', credits: 3, desc: 'This course covers topics on the wave & tidal energy - physical principles of wave energy, various types of wave energy converters and other external impacts and economics; fuel cell - principles of fuel cell and hydrogen production; and chemical energy - the physics of geothermal resources, technologies for geothermal processes and platforms of the environmental implications. Biomass energy including microelectronic biomass types and resources, biomass as a fuel, energy crops, environmental benefits and economics of biomass.' },
  ];

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

  if (selectedCourse) {
    return (
      <div className="dashboard-wrapper">
        <div className="dashboard-content">
          <button onClick={() => setSelectedCourse(null)} style={styles.backBtn}><FaChevronLeft /> Back to List</button>
          <div className="glass-card" style={styles.detailCard}>
            <div style={styles.detailHeader}>
               <div>
                  <span style={styles.badge}>{selectedCourse.type} Module</span>
                  <h2 style={{color: 'white', margin: '10px 0'}}>{selectedCourse.code}</h2>
                  <h3 style={{color: '#81c784', margin: 0}}>{selectedCourse.name}</h3>
               </div>
               <div style={styles.creditCircle}><span>{selectedCourse.credits}</span><small>Credit</small></div>
            </div>
            <div style={styles.infoSection}>
               <h4 style={styles.sectionTitle}><FaBookOpen /> Course Description</h4>
               <p style={styles.descriptionText}>{selectedCourse.desc || 'No description available.'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-content">
        <h2 className="dashboard-title">My Curriculum Explorer</h2>
        
        <div style={styles.topControls}>
          <div style={styles.tabContainer}>
            <button 
              style={activeTab === 'core' ? styles.activeTab : styles.inactiveTab} 
              onClick={() => { setActiveTab('core'); setSemFilter('All'); }}
            >
              General Pathway
            </button>
            <button 
              style={activeTab === 'spec' ? styles.activeTab : styles.inactiveTab} 
              onClick={() => setActiveTab('spec')}
            >
              Core Specialisation 
            </button>
          </div>

          <div style={{display: 'flex', gap: '10px'}}>
             <div style={styles.searchBox}>
                <FaSearch style={{opacity: 0.4, marginRight: '10px'}} />
                <input 
                  type="text" 
                  placeholder="   Search code/name..." 
                  style={styles.searchInput} 
                  onChange={(e)=>setSearchQuery(e.target.value)} 
                />
             </div>
             
             {activeTab === 'core' && (
                <select style={styles.selectFilter} value={semFilter} onChange={(e) => setSemFilter(e.target.value)}>
                   <option value="All" style={styles.optionItem}>All Semesters</option>
                   {[1,2,3,4,5,6,7,8,9,10].map(n => (
                     <option key={n} value={n.toString()} style={styles.optionItem}>Semester {n}</option>
                   ))}
                </select>
             )}
          </div>
        </div>

        {/* --- Sub-Tabs --- */}
        {activeTab === 'core' && (
          <div style={styles.subTabContainer}>
            {['All', 'NR', 'UR', 'CC', 'CD'].map(type => (
              <button 
                key={type} 
                style={activeGeneralType === type ? styles.activeSubTab : styles.inactiveSubTab} 
                onClick={() => setActiveGeneralType(type)}
              >
                {type}
              </button>
            ))}
          </div>
        )}

        {activeTab === 'spec' && (
          <div style={styles.subTabContainer}>
            {['Offshore', 'Environmental', 'Sustainability', 'Renewable Energy'].map(s => (
              <button 
                key={s} 
                style={activeSpec === s ? styles.activeSubTab : styles.inactiveSubTab} 
                onClick={() => setActiveSpec(s)}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="details-container glass-card" style={{marginTop: '20px', padding: '10px'}}>
          <table className="course-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Course Name</th>
                <th style={{textAlign: 'center'}}>Type</th>
                <th style={{textAlign: 'center'}}>Credits</th>
              </tr>
            </thead>
            <tbody>
              {filteredCourses.map(c => (
                <tr key={c.code} onClick={() => setSelectedCourse(c)} style={styles.clickableRow}>
                  <td style={{fontWeight: 'bold', color: '#9ad59d'}}>{c.code}</td>
                  <td>{c.name}</td>
                  <td style={{textAlign: 'center'}}><span style={styles.badge}>{c.type}</span></td>
                  <td style={{textAlign: 'center'}}>{c.credits}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const styles = {
  topControls: { display: 'flex', justifyContent: 'space-between', alignItems: 'stretch', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' },
  tabContainer: { display: 'flex', gap: '10px' },
  activeTab: { background: 'white', color: 'black', padding: '12px 20px', borderRadius: '10px', border: 'none', fontWeight: 'bold', cursor: 'pointer' },
  inactiveTab: { background: 'rgba(255,255,255,0.05)', color: 'white', padding: '12px 20px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' },
  subTabContainer: { display: 'flex', gap: '8px', marginBottom: '15px' },
  activeSubTab: { background: '#81c784', color: 'black', padding: '6px 16px', borderRadius: '20px', border: 'none', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' },
  inactiveSubTab: { background: 'transparent', color: 'white', padding: '6px 16px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.2)', fontSize: '12px', cursor: 'pointer' },
  searchBox: { display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '0 15px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', width: '250px' },
  searchInput: { background: 'none', border: 'none', color: 'white', outline: 'none', width: '100%', padding: '10px 0' },
  selectFilter: { background: 'rgba(255, 255, 255, 0.05)', color: 'white', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', padding: '0 15px', outline: 'none', cursor: 'pointer' },
  optionItem: { background: '#1a1a1a', color: 'white' },
  badge: { background: 'rgba(255,255,255,0.08)', padding: '4px 10px', borderRadius: '5px', fontSize: '11px', color: '#aaa', border: '1px solid rgba(255,255,255,0.1)' },
  clickableRow: { cursor: 'pointer' },
  backBtn: { background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' },
  detailCard: { padding: '40px', borderLeft: '4px solid #81c784' },
  detailHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' },
  creditCircle: { background: '#fcfcfc', color: 'black', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' },
  sectionTitle: { color: 'white', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', fontSize: '18px' },
  descriptionText: { color: '#aaa', lineHeight: '1.7', fontSize: '15px' },
  infoSection: { marginBottom: '25px' }
};

export default MyCourse;