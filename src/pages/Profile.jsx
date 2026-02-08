import React, { useState, useRef, useEffect } from 'react';
import { FaEnvelope, FaCheck, FaCalendarAlt, FaCamera, FaIdBadge } from 'react-icons/fa';
import { api } from "../utils/api";
import defaultAvatar from "../image/default_avatar.jpg";
import './Profile.css';

function Profile({ user }) {
  const fileInputRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    student_id: "",
    student_name: "",
    student_email: "",
    student_image: defaultAvatar,
    student_GOT: "",
    intake_session: "",
    cgpa: "0.00",
    credits: "0"
  });

  useEffect(() => {
    const fetchAllData = async () => {
      if (!user?.student_id) return;
      try {
        const [profileData, summaryData] = await Promise.all([
          api.getProfile(user.student_id),
          api.getCourseSummary(user.student_id)
        ]);

        setFormData({
          student_id: profileData.student_id,
          student_name: profileData.student_name || "",
          student_email: profileData.student_email || "",
          student_image: profileData.student_image || defaultAvatar,
          student_GOT: (profileData.student_GOT === "string" || !profileData.student_GOT) ? "" : profileData.student_GOT,
          intake_session: (profileData.intake_session === "string" || !profileData.intake_session) ? "" : profileData.intake_session,
          cgpa: summaryData.student_cgpa?.toFixed(2) || "0.00",
          credits: summaryData.count_completed_course || "0"
        });
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
        intake_session: formData.intake_session || null
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
        </div>

        {/* RIGHT COLUMN - Main Details */}
        <div className="profile-details-card">
          <h4 className="profile-section-title">Student Details</h4>
          
          <div className="profile-info-list">
            <div className="profile-info-item">
              <div className="profile-icon-circle"><FaIdBadge /></div>
              <div>
                <label className="profile-label">Student ID</label>
                <p className="profile-value">{formData.student_id}</p>
              </div>
            </div>

            <div className="profile-info-item">
              <div className="profile-icon-circle"><FaEnvelope /></div>
              <div>
                <label className="profile-label">Official Email</label>
                <p className="profile-value">{formData.student_email}</p>
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

            <div className="profile-info-item">
              <div className="profile-icon-circle"><FaCheck /></div>
              <div style={{ flex: 1 }}>
                <label className="profile-label">Expected Graduation</label>
                {isEditing ? (
                  <input type="date" className="profile-date-input" style={{width: '100%'}} value={formData.student_GOT} onChange={(e) => setFormData({ ...formData, student_GOT: e.target.value })} />
                ) : (
                  <p className="profile-value">{formData.student_GOT || "Not Set"}</p>
                )}
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