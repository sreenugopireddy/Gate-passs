// pages/StudentProfile.jsx
import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { 
  FaArrowLeft, FaUser, FaEnvelope, FaIdCard, 
  FaGraduationCap, FaPhone, FaSignOutAlt, 
  FaLock, FaHome, FaPlus, FaClock
} from 'react-icons/fa'

// IMPORT CSS - CRITICAL
import '../styles/student.css'

export default function StudentProfile() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token')
        const res = await axios.get('/api/auth/me', { 
          headers: { Authorization: `Bearer ${token}` } 
        })
        setUser(res.data.user)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="student-loading-container">
        <div className="student-spinner-icon"></div>
        <p>Loading profile...</p>
      </div>
    )
  }

  return (
    <div className="student-profile-container">
      {/* Header */}
      <div className="student-profile-header">
        <Link to="/student" className="student-back-btn">
          <FaArrowLeft />
        </Link>
        <h2>Profile</h2>
        <div style={{ width: 40 }}></div>
      </div>

      {/* Profile Card */}
      <div className="student-profile-card">
        <div className="student-profile-avatar">
          <div className="student-avatar-circle">
            <span className="student-avatar-text">
              {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </span>
          </div>
        </div>
        <h3 className="student-profile-name">{user?.name}</h3>
        <p className="student-profile-role">{user?.role?.toUpperCase()}</p>
      </div>

      {/* Info List */}
      <div className="student-profile-info-list">
        <div className="student-profile-info-item">
          <div className="student-profile-info-icon"><FaEnvelope /></div>
          <div className="student-profile-info-content">
            <span className="student-profile-info-label">Email</span>
            <span className="student-profile-info-value">{user?.email}</span>
          </div>
        </div>

        <div className="student-profile-info-item">
          <div className="student-profile-info-icon"><FaIdCard /></div>
          <div className="student-profile-info-content">
            <span className="student-profile-info-label">Student ID</span>
            <span className="student-profile-info-value">{user?.studentId || 'Not assigned'}</span>
          </div>
        </div>

        <div className="student-profile-info-item">
          <div className="student-profile-info-icon"><FaGraduationCap /></div>
          <div className="student-profile-info-content">
            <span className="student-profile-info-label">Department</span>
            <span className="student-profile-info-value">{user?.department || 'Not assigned'}</span>
          </div>
        </div>

        <div className="student-profile-info-item">
          <div className="student-profile-info-icon"><FaGraduationCap /></div>
          <div className="student-profile-info-content">
            <span className="student-profile-info-label">Year & Section</span>
            <span className="student-profile-info-value">
              {user?.year || 'N/A'} {user?.section ? `- ${user.section}` : ''}
            </span>
          </div>
        </div>

        <div className="student-profile-info-item">
          <div className="student-profile-info-icon"><FaPhone /></div>
          <div className="student-profile-info-content">
            <span className="student-profile-info-label">Mobile</span>
            <span className="student-profile-info-value">{user?.mobile || 'Not provided'}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="student-profile-actions">
        <Link to="/change-password" className="student-action-btn">
          <FaLock />
          <span>Change Password</span>
          <FaArrowLeft className="student-arrow-right" />
        </Link>
        <button className="student-action-btn student-logout" onClick={handleLogout}>
          <FaSignOutAlt />
          <span>Logout</span>
          <FaArrowLeft className="student-arrow-right" />
        </button>
      </div>

      {/* Bottom Navigation */}
      <div className="student-bottom-nav">
        <Link to="/student" className="student-nav-item">
          <FaHome />
          <span>Home</span>
        </Link>
        <Link to="/student/apply" className="student-nav-item">
          <FaPlus />
          <span>Apply</span>
        </Link>
        <Link to="/student/history" className="student-nav-item">
          <FaClock />
          <span>History</span>
        </Link>
        <Link to="/student/profile" className="student-nav-item student-active">
          <FaUser />
          <span>Profile</span>
        </Link>
      </div>
    </div>
  )
}