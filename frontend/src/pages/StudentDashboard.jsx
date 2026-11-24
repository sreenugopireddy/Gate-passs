// pages/StudentDashboard.jsx - Full updated version
import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { 
  FaPlus, FaClock, FaCheckCircle, FaTimesCircle, 
  FaHourglassHalf, FaDownload, FaChevronRight, 
  FaExclamationTriangle, FaHome, FaUser, FaBell,
  FaEye
} from 'react-icons/fa'
import { motion, AnimatePresence } from 'framer-motion'

// IMPORT CSS
import '../styles/student.css'

export default function StudentDashboard() {
  const navigate = useNavigate()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 })
  const [user, setUser] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token')
        const userData = JSON.parse(localStorage.getItem('user') || '{}')
        setUser(userData)

        const res = await axios.get('/api/gatepass/history', { 
          headers: { Authorization: `Bearer ${token}` } 
        })
        setHistory(res.data.history || [])
        
        const pending = res.data.history.filter(h => h.status === 'pending').length
        const approved = res.data.history.filter(h => h.status === 'approved').length
        const rejected = res.data.history.filter(h => h.status === 'rejected').length
        setStats({ pending, approved, rejected })
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Download function
  const downloadPass = async (passId, id) => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/gatepass/download/${id}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      })
      if (!res.ok) return alert('Download failed')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${passId}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) { 
      console.error(err)
      alert('Download error') 
    }
  }

  // Preview function - navigates to preview page
  const previewPass = (passId, id) => {
    navigate('/student/preview', { 
      state: { 
        passId: passId,
        requestId: id
      } 
    })
  }

  const getStatusClass = (status) => {
    const classes = {
      pending: 'student-status-pending',
      approved: 'student-status-approved',
      rejected: 'student-status-rejected'
    }
    return classes[status] || 'student-status-pending'
  }

  return (
    <div className="student-panel-container">
      {/* Header */}
      <div className="student-panel-header">
        <div>
          <h1>Hello, {user?.name?.split(' ')[0] || 'Student'} 👋</h1>
          <p>Manage your gate passes</p>
        </div>
        <div className="student-panel-header-actions">
          <button className="student-notif-btn">
            <FaBell />
            <span className="student-notif-dot"></span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="student-stats-grid">
        <div className="student-stat-card student-stat-pending">
          <div className="student-stat-icon"><FaHourglassHalf /></div>
          <div className="student-stat-info">
            <span className="student-stat-value">{stats.pending}</span>
            <span className="student-stat-label">Pending</span>
          </div>
        </div>
        <div className="student-stat-card student-stat-approved">
          <div className="student-stat-icon"><FaCheckCircle /></div>
          <div className="student-stat-info">
            <span className="student-stat-value">{stats.approved}</span>
            <span className="student-stat-label">Approved</span>
          </div>
        </div>
        <div className="student-stat-card student-stat-rejected">
          <div className="student-stat-icon"><FaTimesCircle /></div>
          <div className="student-stat-info">
            <span className="student-stat-value">{stats.rejected}</span>
            <span className="student-stat-label">Rejected</span>
          </div>
        </div>
      </div>

      {/* Quick Action */}
      <Link to="/student/apply" className="student-quick-action">
        <div className="student-quick-action-content">
          <div className="student-quick-icon"><FaPlus /></div>
          <div className="student-quick-text">
            <h3>Apply for Gate Pass</h3>
            <p>Submit a new gate pass request</p>
          </div>
          <FaChevronRight className="student-quick-arrow" />
        </div>
      </Link>

      {/* Recent Requests */}
      <div className="student-section-header">
        <h3>Recent Requests</h3>
        <span className="student-request-count">{history.length} total</span>
      </div>

      {loading ? (
        <div className="student-loading-spinner">
          <div className="student-spinner-icon"></div>
          <p>Loading your requests...</p>
        </div>
      ) : history.length === 0 ? (
        <div className="student-empty-state">
          <div className="student-empty-icon">📋</div>
          <h4>No requests yet</h4>
          <p>Apply for your first gate pass now</p>
          <Link to="/student/apply" className="student-empty-action">Apply Now</Link>
        </div>
      ) : (
        <AnimatePresence>
          {history.slice(0, 10).map((h, index) => (
            <motion.div 
              key={h._id}
              className="student-request-item"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="student-request-header">
                <div className="student-request-id">
                  <span className="student-request-id-label">Pass ID</span>
                  <span className="student-request-id-value">{h.passId}</span>
                </div>
                <span className={`student-status-badge ${getStatusClass(h.status)}`}>
                  {h.status.charAt(0).toUpperCase() + h.status.slice(1)}
                </span>
              </div>
              
              <div className="student-request-body">
                <div className="student-request-info">
                  <span className="student-request-label">Reason</span>
                  <span className="student-request-value">{h.reason}</span>
                </div>
                <div className="student-request-info">
                  <span className="student-request-label">Destination</span>
                  <span className="student-request-value">{h.destination}</span>
                </div>
                <div className="student-request-info">
                  <span className="student-request-label">Out Time</span>
                  <span className="student-request-value">
                    {h.outTime ? new Date(h.outTime).toLocaleString() : '-'}
                  </span>
                </div>
                {h.emergency && (
                  <div className="student-emergency-badge">
                    <FaExclamationTriangle /> Emergency
                  </div>
                )}
              </div>
              
              <div className="student-request-footer">
                <span className="student-request-date">
                  {new Date(h.createdAt).toLocaleDateString()}
                </span>
                <div className="student-action-buttons">
                  {h.status === 'approved' && (
                    <>
                      <button 
                        className="student-btn-preview"
                        onClick={() => previewPass(h.passId, h._id)}
                        title="Preview Pass"
                      >
                        <FaEye /> Preview
                      </button>
                      <button 
                        className="student-btn-download"
                        onClick={() => downloadPass(h.passId, h._id)}
                        title="Download Pass"
                      >
                        <FaDownload /> Download
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      )}

      {history.length > 10 && (
        <Link to="/student/history" className="student-view-all">
          View All Requests <FaChevronRight />
        </Link>
      )}

      {/* Bottom Navigation */}
      <div className="student-bottom-nav-fixed">
        <Link to="/student" className="student-nav-item student-active">
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
        <Link to="/student/profile" className="student-nav-item">
          <FaUser />
          <span>Profile</span>
        </Link>
      </div>
    </div>
  )
}