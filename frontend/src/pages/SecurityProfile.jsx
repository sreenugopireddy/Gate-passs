// pages/SecurityProfile.jsx - With Analytics Nav
import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { 
  FaArrowLeft, FaHome, FaHistory, FaUser, FaSignOutAlt, 
  FaEnvelope, FaIdCard, FaShieldAlt, FaUserCog,
  FaPhone, FaCalendarAlt, FaChartLine
} from 'react-icons/fa'

// Import CSS
import '../styles/security.css'

export default function SecurityProfile() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token')
      
      if (!token) {
        navigate('/login')
        return
      }

      const res = await axios.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setUser(res.data.user)
      
    } catch (err) {
      console.error('Failed to fetch profile:', err)
      if (err.response?.status === 401) {
        navigate('/login')
        return
      }
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const getInitials = (name) => {
    if (!name) return 'S'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  if (loading) {
    return (
      <div className="sec-container">
        <div className="sec-header">
          <Link to="/security" className="sec-back-btn">
            <FaArrowLeft size={18} />
          </Link>
          <h1>Profile</h1>
          <div style={{ width: 40 }}></div>
        </div>
        <div className="sec-loading">
          <div className="sec-spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="sec-container">
        <div className="sec-header">
          <Link to="/security" className="sec-back-btn">
            <FaArrowLeft size={18} />
          </Link>
          <h1>Profile</h1>
          <div style={{ width: 40 }}></div>
        </div>
        <div className="sec-error">{error || 'User not found'}</div>
      </div>
    )
  }

  return (
    <div className="sec-container">
      {/* Header */}
      <div className="sec-header">
        <Link to="/security" className="sec-back-btn">
          <FaArrowLeft size={18} />
        </Link>
        <h1>Profile</h1>
        <button className="sec-logout" onClick={handleLogout}>
          <FaSignOutAlt size={14} /> Logout
        </button>
      </div>

      {/* Profile Card */}
      <div className="sec-profile-card">
        <div className="sec-avatar">
          <span className="sec-avatar-text">{getInitials(user.name)}</span>
        </div>
        <h2 className="sec-profile-name">{user.name}</h2>
        <span className="sec-profile-role">{user.role?.toUpperCase() || 'Security'}</span>
      </div>

      {/* Profile Details */}
      <div className="sec-card">
        <div className="sec-detail-item">
          <div className="sec-detail-icon"><FaEnvelope /></div>
          <div className="sec-detail-info">
            <span className="sec-detail-label">Email</span>
            <span className="sec-detail-value">{user.email}</span>
          </div>
        </div>

        <div className="sec-detail-item">
          <div className="sec-detail-icon"><FaIdCard /></div>
          <div className="sec-detail-info">
            <span className="sec-detail-label">Employee ID</span>
            <span className="sec-detail-value">{user.employeeId || user.studentId || 'N/A'}</span>
          </div>
        </div>

        <div className="sec-detail-item">
          <div className="sec-detail-icon"><FaShieldAlt /></div>
          <div className="sec-detail-info">
            <span className="sec-detail-label">Role</span>
            <span className="sec-detail-value">{user.role || 'Security'}</span>
          </div>
        </div>

        <div className="sec-detail-item">
          <div className="sec-detail-icon"><FaUserCog /></div>
          <div className="sec-detail-info">
            <span className="sec-detail-label">Department</span>
            <span className="sec-detail-value">{user.department || 'Security Department'}</span>
          </div>
        </div>

        {user.mobile && (
          <div className="sec-detail-item">
            <div className="sec-detail-icon"><FaPhone /></div>
            <div className="sec-detail-info">
              <span className="sec-detail-label">Mobile</span>
              <span className="sec-detail-value">{user.mobile}</span>
            </div>
          </div>
        )}

        {user.lastLoginAt && (
          <div className="sec-detail-item">
            <div className="sec-detail-icon"><FaCalendarAlt /></div>
            <div className="sec-detail-info">
              <span className="sec-detail-label">Last Login</span>
              <span className="sec-detail-value">
                {new Date(user.lastLoginAt).toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Change Password Button */}
      <Link to="/change-password" className="sec-btn sec-btn-primary sec-change-password">
        <FaUserCog size={16} /> Change Password
      </Link>

      {/* Bottom Navigation - WITH ANALYTICS */}
      <div className="sec-nav">
        <Link to="/security" className="sec-nav-item">
          <FaHome size={18} />
          <span>Scan</span>
        </Link>
        <Link to="/security/history" className="sec-nav-item">
          <FaHistory size={18} />
          <span>History</span>
        </Link>
        <Link to="/security/analytics" className="sec-nav-item">
          <FaChartLine size={18} />
          <span>Analytics</span>
        </Link>
        <Link to="/security/profile" className="sec-nav-item active">
          <FaUser size={18} />
          <span>Profile</span>
        </Link>
      </div>
    </div>
  )
}