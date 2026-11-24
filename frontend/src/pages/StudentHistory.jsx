// pages/StudentHistory.jsx
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { 
  FaArrowLeft, FaDownload, FaFilter, FaHome, 
  FaPlus, FaClock, FaUser, FaChevronRight 
} from 'react-icons/fa'
import { motion, AnimatePresence } from 'framer-motion'

// IMPORT CSS - CRITICAL
import '../styles/student.css'

export default function StudentHistory() {
  const [history, setHistory] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [showFilter, setShowFilter] = useState(false)

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem('token')
        const res = await axios.get('/api/gatepass/history', { 
          headers: { Authorization: `Bearer ${token}` } 
        })
        setHistory(res.data.history || [])
        setFiltered(res.data.history || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchHistory()
  }, [])

  useEffect(() => {
    if (filter === 'all') {
      setFiltered(history)
    } else {
      setFiltered(history.filter(h => h.status === filter))
    }
  }, [filter, history])

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

  const getStatusClass = (status) => {
    const classes = {
      pending: 'student-status-pending',
      approved: 'student-status-approved',
      rejected: 'student-status-rejected'
    }
    return classes[status] || 'student-status-pending'
  }

  const filterOptions = [
    { value: 'all', label: 'All Requests' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' }
  ]

  const getStatusCount = (status) => {
    if (status === 'all') return history.length
    return history.filter(h => h.status === status).length
  }

  return (
    <div className="student-history-container">
      {/* Header */}
      <div className="student-history-header">
        <Link to="/student" className="student-back-btn">
          <FaArrowLeft />
        </Link>
        <h2>Request History</h2>
        <button 
          className="student-filter-btn"
          onClick={() => setShowFilter(!showFilter)}
        >
          <FaFilter />
        </button>
      </div>

      {/* Filter Dropdown */}
      {showFilter && (
        <motion.div 
          className="student-filter-dropdown"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {filterOptions.map(option => (
            <button
              key={option.value}
              className={`student-filter-option ${filter === option.value ? 'student-active' : ''}`}
              onClick={() => {
                setFilter(option.value)
                setShowFilter(false)
              }}
            >
              {option.label}
              <span className="student-filter-check">
                {filter === option.value && '✓'}
              </span>
            </button>
          ))}
        </motion.div>
      )}

      {/* Stats Summary */}
      <div className="student-history-stats">
        <div className="student-stat-item">
          <span className="student-stat-number">{getStatusCount('all')}</span>
          <span className="student-stat-label-sm">Total</span>
        </div>
        <div className="student-stat-item">
          <span className="student-stat-number student-stat-number-pending">
            {getStatusCount('pending')}
          </span>
          <span className="student-stat-label-sm">Pending</span>
        </div>
        <div className="student-stat-item">
          <span className="student-stat-number student-stat-number-approved">
            {getStatusCount('approved')}
          </span>
          <span className="student-stat-label-sm">Approved</span>
        </div>
        <div className="student-stat-item">
          <span className="student-stat-number student-stat-number-rejected">
            {getStatusCount('rejected')}
          </span>
          <span className="student-stat-label-sm">Rejected</span>
        </div>
      </div>

      {/* History List */}
      <div className="student-history-list">
        {loading ? (
          <div className="student-loading-spinner">
            <div className="student-spinner-icon"></div>
            <p>Loading history...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="student-empty-state">
            <div className="student-empty-icon">📋</div>
            <h4>No requests found</h4>
            <p>You haven't submitted any gate pass requests yet</p>
            <Link to="/student/apply" className="student-empty-action">
              Apply Now
            </Link>
          </div>
        ) : (
          filtered.map((h, index) => (
            <motion.div 
              key={h._id}
              className="student-history-item"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="student-history-item-header">
                <span className="student-history-pass-id">{h.passId}</span>
                <span className={`student-status-badge ${getStatusClass(h.status)}`}>
                  {h.status.charAt(0).toUpperCase() + h.status.slice(1)}
                </span>
              </div>
              
              <div className="student-history-body">
                <div className="student-history-detail">
                  <span className="student-history-label">Reason</span>
                  <span className="student-history-value">{h.reason}</span>
                </div>
                <div className="student-history-detail">
                  <span className="student-history-label">Destination</span>
                  <span className="student-history-value">{h.destination}</span>
                </div>
                <div className="student-history-detail">
                  <span className="student-history-label">Out Time</span>
                  <span className="student-history-value">
                    {h.outTime ? new Date(h.outTime).toLocaleString() : '-'}
                  </span>
                </div>
                {h.emergency && (
                  <div className="student-emergency-badge">
                    ⚠️ Emergency
                  </div>
                )}
              </div>
              
              <div className="student-history-footer">
                <span className="student-history-date">
                  {new Date(h.createdAt).toLocaleDateString()}
                </span>
                {h.status === 'approved' && (
                  <button 
                    className="student-btn-download"
                    onClick={() => downloadPass(h.passId, h._id)}
                  >
                    <FaDownload /> Download PDF
                  </button>
                )}
              </div>
            </motion.div>
          ))
        )}
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
        <Link to="/student/history" className="student-nav-item student-active">
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