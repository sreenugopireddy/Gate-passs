// src/pages/ImportResults.jsx - PWA Mobile View
import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { 
  CheckCircle, XCircle, AlertCircle, BarChart2, Users, 
  Download, ArrowLeft, Eye, FileSpreadsheet, Home, 
  FileText, UserPlus, BarChart3, UserCog, Printer
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// Import PWA CSS
import '../styles/hod.css'

export default function ImportResults() {
  const navigate = useNavigate()
  const location = useLocation()
  const [results, setResults] = useState(null)
  const [activeTab, setActiveTab] = useState('summary')

  useEffect(() => {
    if (location.state?.results) {
      setResults(location.state.results)
    } else {
      navigate('/hod/students')
    }
  }, [location, navigate])

  const getStatusColor = (rate) => {
    if (rate >= 80) return 'success'
    if (rate >= 50) return 'warning'
    return 'danger'
  }

  const getStatusIcon = (rate) => {
    if (rate >= 80) return <CheckCircle size={24} className="text-success" />
    if (rate >= 50) return <AlertCircle size={24} className="text-warning" />
    return <XCircle size={24} className="text-danger" />
  }

  const handleBack = () => {
    navigate('/hod/students')
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  if (!results) {
    return (
      <div className="hod-pwa-container">
        <div className="hod-pwa-header">
          <h1>Import Results</h1>
          <button className="hod-pwa-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
        <div className="hod-pwa-loading">
          <div className="hod-pwa-spinner"></div>
          <p>Loading results...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="hod-pwa-container">
      {/* Header */}
      <div className="hod-pwa-header">
        <h1><FileSpreadsheet size={18} /> Import Results</h1>
        <div className="hod-pwa-header-actions">
          <span className="user-name">HOD</span>
          <button className="hod-pwa-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {/* Back Button */}
      <button 
        className="hod-pwa-back-btn"
        onClick={handleBack}
      >
        <ArrowLeft size={16} /> Back to Students
      </button>

      {/* Timestamp */}
      <div className="hod-pwa-timestamp">
        📅 {new Date().toLocaleString()}
      </div>

      {/* Summary Stats Cards */}
      <div className="hod-pwa-stats-grid">
        <div className="hod-pwa-stat-card" style={{ borderLeftColor: '#667eea' }}>
          <div className="hod-pwa-stat-icon blue"><Users size={18} /></div>
          <div className="hod-pwa-stat-value">{results.totalRecords}</div>
          <div className="hod-pwa-stat-label">Total Records</div>
        </div>
        <div className="hod-pwa-stat-card" style={{ borderLeftColor: '#10b981' }}>
          <div className="hod-pwa-stat-icon green"><CheckCircle size={18} /></div>
          <div className="hod-pwa-stat-value" style={{ color: '#10b981' }}>{results.created}</div>
          <div className="hod-pwa-stat-label">Created</div>
        </div>
        <div className="hod-pwa-stat-card" style={{ borderLeftColor: '#ef4444' }}>
          <div className="hod-pwa-stat-icon red"><XCircle size={18} /></div>
          <div className="hod-pwa-stat-value" style={{ color: '#ef4444' }}>{results.failed}</div>
          <div className="hod-pwa-stat-label">Failed</div>
        </div>
        <div className="hod-pwa-stat-card" style={{ borderLeftColor: '#3b82f6' }}>
          <div className="hod-pwa-stat-icon info"><BarChart2 size={18} /></div>
          <div className={`hod-pwa-stat-value text-${getStatusColor(results.successRate)}`}>
            {results.successRate}%
          </div>
          <div className="hod-pwa-stat-label">Success Rate</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="hod-pwa-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <span style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>Import Progress</span>
          <span style={{ fontSize: '13px', fontWeight: '700', color: results.successRate >= 80 ? '#10b981' : results.successRate >= 50 ? '#f59e0b' : '#ef4444' }}>
            {results.successRate}% Complete
          </span>
        </div>
        <div style={{ 
          width: '100%', 
          height: '8px', 
          background: '#e5e7eb', 
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <div style={{ 
            width: `${results.successRate}%`, 
            height: '100%', 
            background: results.successRate >= 80 ? '#10b981' : results.successRate >= 50 ? '#f59e0b' : '#ef4444',
            borderRadius: '4px',
            transition: 'width 0.5s ease'
          }} />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="hod-pwa-tabs">
        <button 
          className={`hod-pwa-tab ${activeTab === 'summary' ? 'active' : ''}`}
          onClick={() => setActiveTab('summary')}
        >
          <BarChart2 size={16} /> Summary
        </button>
        <button 
          className={`hod-pwa-tab ${activeTab === 'success' ? 'active' : ''}`}
          onClick={() => setActiveTab('success')}
        >
          <CheckCircle size={16} /> Success ({results.successList?.length || 0})
        </button>
        <button 
          className={`hod-pwa-tab ${activeTab === 'errors' ? 'active' : ''}`}
          onClick={() => setActiveTab('errors')}
        >
          <XCircle size={16} /> Errors ({results.errors?.length || 0})
        </button>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'summary' && (
          <motion.div
            key="summary"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {/* Overall Status */}
            <div className={`hod-pwa-status-banner ${results.created === results.totalRecords ? 'approved' : results.created > 0 ? 'pending' : 'rejected'}`}>
              {getStatusIcon(results.successRate)}
              <span>
                {results.created === results.totalRecords ? (
                  <>✅ <strong>All {results.totalRecords}</strong> records imported successfully!</>
                ) : results.created > 0 ? (
                  <>⚠️ <strong>{results.created}</strong> of <strong>{results.totalRecords}</strong> imported. <strong>{results.failed}</strong> failed.</>
                ) : (
                  <>❌ <strong>All {results.totalRecords}</strong> records failed. Check errors below.</>
                )}
              </span>
            </div>

            {/* Summary Chips */}
            {results.summary && (
              <div className="hod-pwa-card">
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a2e', marginBottom: '12px' }}>
                  📊 Import Summary
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase' }}>By Year</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center', marginTop: '4px' }}>
                      {Object.entries(results.summary.byYear || {}).map(([key, count]) => (
                        <span key={key} style={{ fontSize: '11px', background: '#667eea', color: 'white', padding: '2px 8px', borderRadius: '12px' }}>
                          {key}: {count}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase' }}>By Branch</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center', marginTop: '4px' }}>
                      {Object.entries(results.summary.byBranch || {}).map(([key, count]) => (
                        <span key={key} style={{ fontSize: '11px', background: '#6b7280', color: 'white', padding: '2px 8px', borderRadius: '12px' }}>
                          {key}: {count}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase' }}>By Section</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', justifyContent: 'center', marginTop: '4px' }}>
                      {Object.entries(results.summary.bySection || {}).map(([key, count]) => (
                        <span key={key} style={{ fontSize: '11px', background: '#f59e0b', color: 'white', padding: '2px 8px', borderRadius: '12px' }}>
                          {key}: {count}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="hod-pwa-result-actions">
              <button className="hod-pwa-result-btn primary" onClick={handleBack}>
                <ArrowLeft size={18} /> Back
              </button>
              {results.created > 0 && (
                <button className="hod-pwa-result-btn success" onClick={handleBack}>
                  <Eye size={18} /> View Students
                </button>
              )}
              <button className="hod-pwa-result-btn secondary" onClick={() => window.print()}>
                <Printer size={18} /> Print
              </button>
            </div>
          </motion.div>
        )}

        {activeTab === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <div className="hod-pwa-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#059669' }}>
                  <CheckCircle size={16} /> Successfully Created
                </span>
                <span style={{ fontSize: '12px', background: '#d1fae5', color: '#059669', padding: '2px 12px', borderRadius: '12px' }}>
                  {results.successList?.length || 0}
                </span>
              </div>
              {results.successList && results.successList.length > 0 ? (
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {results.successList.map((item, idx) => (
                    <div key={idx} className="hod-pwa-result-item">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontWeight: '600', color: '#1a1a2e', fontSize: '14px' }}>{item.name}</div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>{item.email}</div>
                          <div style={{ fontSize: '11px', color: '#667eea' }}>ID: {item.studentId}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '10px', color: '#6b7280' }}>Row {item.row}</span>
                          <div style={{ fontSize: '11px', background: '#f1f3f5', padding: '2px 8px', borderRadius: '4px', fontFamily: 'monospace', marginTop: '2px' }}>
                            {item.defaultPassword}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="hod-pwa-empty">
                  <CheckCircle size={40} style={{ opacity: 0.3 }} />
                  <h4>No successful records</h4>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'errors' && (
          <motion.div
            key="errors"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <div className="hod-pwa-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#dc2626' }}>
                  <XCircle size={16} /> Failed Records
                </span>
                <span style={{ fontSize: '12px', background: '#fee2e2', color: '#dc2626', padding: '2px 12px', borderRadius: '12px' }}>
                  {results.errors?.length || 0}
                </span>
              </div>
              {results.errors && results.errors.length > 0 ? (
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {results.errors.map((err, idx) => (
                    <div key={idx} className="hod-pwa-result-item error">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontWeight: '600', color: '#1a1a2e', fontSize: '14px' }}>{err.name || 'Unknown'}</div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>{err.email}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '10px', color: '#6b7280' }}>Row {err.row}</span>
                        </div>
                      </div>
                      <div style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px', background: '#fee2e2', padding: '4px 8px', borderRadius: '4px' }}>
                        {err.reason}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="hod-pwa-empty">
                  <XCircle size={40} style={{ opacity: 0.3 }} />
                  <h4>No errors</h4>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <div className="hod-pwa-bottom-nav">
        <Link to="/hod" className="hod-pwa-nav-item">
          <Home size={20} />
          <span>Home</span>
        </Link>
        <Link to="/hod/requests" className="hod-pwa-nav-item">
          <FileText size={20} />
          <span>Requests</span>
        </Link>
        <Link to="/hod/students" className="hod-pwa-nav-item active">
          <Users size={20} />
          <span>Students</span>
        </Link>
        <Link to="/hod/reports" className="hod-pwa-nav-item">
          <BarChart3 size={20} />
          <span>Reports</span>
        </Link>
        <Link to="/hod/profile" className="hod-pwa-nav-item">
          <UserCog size={20} />
          <span>Profile</span>
        </Link>
      </div>
    </div>
  )
}