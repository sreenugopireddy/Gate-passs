// pages/SecurityHistory.jsx - Fetch from Backend
import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { 
  FaArrowLeft, FaHome, FaHistory, FaUser, FaSignOutAlt, 
  FaCheckCircle, FaTimesCircle, FaClock, FaChartLine,
  FaSync
} from 'react-icons/fa'

// Import CSS
import '../styles/security.css'

export default function SecurityHistory() {
  const navigate = useNavigate()
  const [scans, setScans] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [error, setError] = useState(null)

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        navigate('/login')
        return
      }

      const res = await axios.get('/api/security/history', {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (res.data && res.data.scans) {
        setScans(res.data.scans)
        console.log('✅ History loaded from DB:', res.data.scans.length, 'records')
      } else {
        setScans([])
      }
    } catch (err) {
      console.error('Failed to load history:', err)
      setError('Failed to load history. Please try again.')
      setScans([])
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const filteredScans = filter === 'all' 
    ? scans 
    : scans.filter(s => s.status === filter)

  return (
    <div className="sec-container">
      {/* Header */}
      <div className="sec-header">
        <Link to="/security" className="sec-back-btn">
          <FaArrowLeft size={18} />
        </Link>
        <h1>Scan History</h1>
        <div className="header-actions">
          <button className="sec-refresh-btn" onClick={loadHistory} title="Refresh">
            <FaSync size={14} />
          </button>
          <button className="sec-logout" onClick={handleLogout}>
            <FaSignOutAlt size={14} /> Logout
          </button>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="sec-filters">
        <button 
          className={`sec-filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({scans.length})
        </button>
        <button 
          className={`sec-filter-btn success ${filter === 'success' ? 'active' : ''}`}
          onClick={() => setFilter('success')}
        >
          ✅ Valid ({scans.filter(s => s.status === 'success').length})
        </button>
        <button 
          className={`sec-filter-btn error ${filter === 'error' ? 'active' : ''}`}
          onClick={() => setFilter('error')}
        >
          ❌ Invalid ({scans.filter(s => s.status === 'error').length})
        </button>
      </div>

      {/* History List */}
      {loading ? (
        <div className="sec-loading">
          <div className="sec-spinner"></div>
          <p>Loading history...</p>
        </div>
      ) : error ? (
        <div className="sec-error">
          {error}
          <button className="sec-retry-btn" onClick={loadHistory}>Retry</button>
        </div>
      ) : filteredScans.length === 0 ? (
        <div className="sec-empty-state">
          <FaHistory size={40} />
          <h4>No scans yet</h4>
          <p>Scan QR codes to see them here</p>
          <Link to="/security" className="sec-btn sec-btn-primary">Go to Scanner</Link>
        </div>
      ) : (
        <div className="sec-history-list">
          {filteredScans.map((scan) => (
            <div key={scan.id} className={`sec-history-item ${scan.status}`}>
              <div className="sec-history-icon">
                {scan.status === 'success' ? (
                  <FaCheckCircle className="sec-icon-success" />
                ) : (
                  <FaTimesCircle className="sec-icon-error" />
                )}
              </div>
              <div className="sec-history-info">
                <div className="sec-history-pass">{scan.passId || 'N/A'}</div>
                <div className="sec-history-student">{scan.student || 'Unknown'}</div>
                <div className="sec-history-time">
                  <FaClock size={12} />
                  {scan.timestamp ? new Date(scan.timestamp).toLocaleString() : 'Just now'}
                </div>
                {scan.scannedBy && (
                  <div className="sec-history-scanned-by">
                    Scanned by: {scan.scannedBy}
                  </div>
                )}
              </div>
              <div className={`sec-history-status ${scan.status}`}>
                {scan.status === 'success' ? 'Valid' : 'Failed'}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="sec-nav">
        <Link to="/security" className="sec-nav-item">
          <FaHome size={18} />
          <span>Scan</span>
        </Link>
        <Link to="/security/history" className="sec-nav-item active">
          <FaHistory size={18} />
          <span>History</span>
        </Link>
        <Link to="/security/analytics" className="sec-nav-item">
          <FaChartLine size={18} />
          <span>Analytics</span>
        </Link>
        <Link to="/security/profile" className="sec-nav-item">
          <FaUser size={18} />
          <span>Profile</span>
        </Link>
      </div>
    </div>
  )
}