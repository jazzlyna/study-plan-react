import React, { useState, useRef, useEffect } from 'react';
import { FaEnvelope, FaCheck, FaCalendarAlt, FaCamera, FaIdBadge, FaBuilding, FaStethoscope, FaCalendarPlus } from 'react-icons/fa';
import { api } from "../utils/api";
import defaultAvatar from "../image/default_avatar.jpg";
import './Profile.css';

function Profile({ user }) {
  const fileInputRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  // State to hold the specialized graduation analysis data
  const [gotAnalysis, setGotAnalysis] = useState(null);
  
  const [formData, setFormData] = useState({
    student_id: "",
    student_name: "",
    student_email: "",
    student_image: defaultAvatar,
    student_GOT: "",
    intake_session: "",
    student_department: "",
    cgpa: "0.00",
    credits: "0",
    deferment_medical: "0",
    deferment_normal: "0"
  });

  useEffect(() => {
    const fetchAllData = async () => {
      if (!user?.student_id) return;
      try {
        // Added api.getGraduateOnTime to the concurrent requests
        const [profileData, summaryData, gotResponse] = await Promise.all([
          api.getProfile(user.student_id),
          api.getCourseSummary(user.student_id),
          api.getGraduateOnTime(user.student_id)
        ]);

        setFormData({
          student_id: profileData.student_id,
          student_name: profileData.student_name || "",
          student_email: profileData.student_email || "",
          student_image: profileData.student_image || defaultAvatar,
          student_GOT: (profileData.student_GOT === "string" || !profileData.student_GOT) ? "" : profileData.student_GOT,
          intake_session: (profileData.intake_session === "string" || !profileData.intake_session) ? "" : profileData.intake_session,
          student_department: profileData.student_department || "",
          cgpa: summaryData.student_cgpa?.toFixed(2) || "0.00",
          credits: summaryData.count_completed_course || "0",
          deferment_medical: profileData.deferment_medical?.toString() || "0",
          deferment_normal: profileData.deferment_normal?.toString() || "0"
        });

        // Store the GOT analysis if successful
        if (gotResponse && gotResponse.success) {
          setGotAnalysis(gotResponse.analysis);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchAllData();
  }, [user?.student_id]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setFormData(prev => ({ ...prev, student_image: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    try {
      const updatePayload = {
        student_name: formData.student_name,
        student_image: formData.student_image,
        student_GOT: formData.student_GOT || null,
        intake_session: formData.intake_session || null,
        student_department: formData.student_department || null,
        deferment_medical: parseInt(formData.deferment_medical) || 0,
        deferment_normal: parseInt(formData.deferment_normal) || 0
      };
      await api.updateProfile(user.student_id, updatePayload);
      setIsEditing(false);
      alert("Profile Saved!");
    } catch (error) {
      alert("Update failed.");
    }
  };

  return (
    <div className="course-container">
      <h2 className="title-text">User Profile</h2>
      
      <div className="profile-main-grid">
        {/* LEFT COLUMN - Avatar & Mini Stats */}
        <div className="profile-left-column">
          <div className="profile-avatar-card">
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleFileChange} />
            <div 
              className="profile-image-wrapper" 
              style={{ cursor: isEditing ? 'pointer' : 'default' }}
              onClick={() => isEditing && fileInputRef.current.click()}
            >
              <img src={formData.student_image} className="profile-img" alt="Profile" />
              {isEditing && (
                <div className="profile-camera-overlay">
                  <FaCamera size={24} />
                  <span style={{fontSize: '10px', marginTop: '5px'}}>Change</span>
                </div>
              )}
            </div>
            
            {isEditing ? (
              <input 
                className="profile-edit-input-center" 
                value={formData.student_name} 
                onChange={(e) => setFormData({ ...formData, student_name: e.target.value })} 
              />
            ) : (
              <h3 className="profile-user-name">{formData.student_name || "Loading..."}</h3>
            )}
          </div>

          <div className="profile-stats-row">
            <div className="profile-stat-mini-card">
              <label className="profile-label">Current CGPA</label>
              <p className="profile-stat-value">{formData.cgpa}</p>
            </div>
            <div className="profile-stat-mini-card">
              <label className="profile-label">Completed</label>
              <p className="profile-stat-value">{formData.credits}</p>
            </div>
          </div>
          {/* Optional: Add Progress Bar here if desired, using gotAnalysis.progress_percentage */}
          {gotAnalysis && (
            <div className="profile-stat-mini-card" style={{ gridColumn: 'span 2' }}>
              <label className="profile-label">Degree Progress</label>
              <div style={{ width: '100%', height: '8px', background: '#eee', borderRadius: '4px', marginTop: '10px', overflow: 'hidden', border: '1px solid #000' }}>
                <div style={{ width: `${gotAnalysis.progress_percentage}%`, height: '100%', background: '#00427c' }}></div>
              </div>
              <p style={{ fontSize: '12px', fontWeight: 'bold', marginTop: '5px' }}>{gotAnalysis.progress_percentage}%</p>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN - Main Details */}
        <div className="profile-details-card">
          <h4 className="profile-section-title">Student Details</h4>
          
          <div className="profile-info-list">
            
            <div className="profile-info-item">
              <div className="profile-icon-circle"><FaEnvelope /></div>
              <div>
                <label className="profile-label">User Email</label>
                <p className="profile-value">{formData.student_email}</p>
              </div>
            </div>

            <div className="profile-info-item">
              <div className="profile-icon-circle"><FaBuilding /></div>
              <div>
                <label className="profile-label">Department</label>
                {isEditing ? (
                  <select 
                    value={formData.student_department}
                    onChange={(e) => setFormData({ ...formData, student_department: e.target.value })}
                    className="profile-edit-input-center"
                    style={{ width: '100%' }}
                  >
                        <option value="">Select Department</option>
                        <option value="CE">Chemical Engineering</option>
                        <option value="CEE">Civil & Environmental Engineering</option>
                        <option value="EEE">Electrical & Electronic Engineering</option>
                        <option value="IE">Integrated Engineering</option>
                        <option value="ME">Mechanical Engineering</option>
                        <option value="PE">Petroleum Engineering</option>
                        <option value="FASD">Applied Science</option>
                        <option value="GSC">Geosciences</option>
                        <option value="DM">Management</option>
                        <option value="Other">Other</option>
                  </select>
                ) : (
                  <p className="profile-value">{formData.student_department || "Not Set"}</p>
                )}
              </div>
            </div>

            <div className="profile-info-item">
              <div className="profile-icon-circle"><FaCalendarAlt /></div>
              <div style={{ flex: 1 }}>
                <label className="profile-label">Intake Session</label>
                {isEditing ? (
                  <input type="date" className="profile-date-input" style={{width: '100%'}} value={formData.intake_session} onChange={(e) => setFormData({ ...formData, intake_session: e.target.value })} />
                ) : (
                  <p className="profile-value">{formData.intake_session || "Not Set"}</p>
                )}
              </div>
            </div>

            {/* Deferment Fields */}
            <div className="profile-info-item">
              <div className="profile-icon-circle"><FaStethoscope /></div>
              <div style={{ flex: 1 }}>
                <label className="profile-label">Medical Deferment</label>
                {isEditing ? (
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                      type="number"
                      min="0"
                      value={formData.deferment_medical}
                      onChange={(e) => setFormData({ ...formData, deferment_medical: e.target.value })}
                      className="profile-edit-input-center"
                      style={{ width: '80px', textAlign: 'center' }}
                    />
                    <span style={{ fontSize: '12px', color: '#666' }}>semesters</span>
                  </div>
                ) : (
                  <p className="profile-value">
                    {formData.deferment_medical} semester{parseInt(formData.deferment_medical) !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>

            <div className="profile-info-item">
              <div className="profile-icon-circle"><FaCalendarPlus /></div>
              <div style={{ flex: 1 }}>
                <label className="profile-label">Regular Deferment</label>
                {isEditing ? (
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                      type="number"
                      min="0"
                      value={formData.deferment_normal}
                      onChange={(e) => setFormData({ ...formData, deferment_normal: e.target.value })}
                      className="profile-edit-input-center"
                      style={{ width: '80px', textAlign: 'center' }}
                    />
                    <span style={{ fontSize: '12px', color: '#666' }}>semesters</span>
                  </div>
                ) : (
                  <p className="profile-value">
                    {formData.deferment_normal} semester{parseInt(formData.deferment_normal) !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>

            <div className="profile-info-item">
              <div className="profile-icon-circle"><FaCheck /></div>
              <div style={{ flex: 1 }}>
                <label className="profile-label">Expected Graduation</label>
                <div className="profile-value">
                  {/* Displaying GOT analysis data */}
                  {gotAnalysis ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ color: gotAnalysis.extra_semesters > 0 ? '#d32f2f' : 'inherit' }}>
                        {gotAnalysis.graduate_on_time_date}
                      </span>
                      {gotAnalysis.extra_semesters > 0 && (
                        <span style={{ 
                          fontSize: '10px', 
                          padding: '2px 8px', 
                          background: '#000', 
                          color: '#fff', 
                          borderRadius: '4px',
                          textTransform: 'uppercase'
                        }}>
                          +{gotAnalysis.extra_semesters} Sem Delay
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="profile-value">{formData.student_GOT || "Not Set"}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="profile-button-group">
            {isEditing ? (
              <>
                <button onClick={handleSave} className="profile-save-btn">Save Changes</button>
                <button onClick={() => setIsEditing(false)} className="profile-edit-btn" style={{background: 'none'}}>Cancel</button>
              </>
            ) : (
              <button onClick={() => setIsEditing(true)} className="profile-edit-btn">Edit Profile</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
