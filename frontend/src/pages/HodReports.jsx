// src/pages/HodReports.jsx - PWA Mobile View
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  FileText, Download, Calendar, Filter, X, 
  Home, Users, BarChart3, UserCog, FileSpreadsheet,
  CheckCircle, AlertCircle, Loader, ChevronRight,
  TrendingUp, Clock, Printer
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// Import PWA CSS
import '../styles/hod.css'

const HodReports = () => {
  const navigate = useNavigate()
  const [filters, setFilters] = useState({
    type: 'monthly',
    format: 'excel',
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [reportData, setReportData] = useState(null)
  const [success, setSuccess] = useState(null)
  const [showFilters, setShowFilters] = useState(false)

  const token = localStorage.getItem('token')

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters(prev => ({ ...prev, [name]: value }))
    setError(null)
    setSuccess(null)
  }

  const generateReport = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)
    setReportData(null)

    try {
      const params = new URLSearchParams({
        type: filters.type,
        format: filters.format,
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
      })

      const response = await fetch(`/api/hod/reports?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to generate report: ${response.statusText}`)
      }

      if (filters.format === 'json') {
        const data = await response.json()
        setReportData(data)
        setSuccess(`Report generated: ${data.length} records`)
      } else {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `report-${filters.type}-${new Date().getTime()}.${getExtension(filters.format)}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        setSuccess(`${filters.format.toUpperCase()} report downloaded successfully`)
      }
    } catch (err) {
      setError(err.message || 'Error generating report')
    } finally {
      setLoading(false)
    }
  }

  const getExtension = (format) => {
    const extensions = { csv: 'csv', excel: 'xlsx', pdf: 'pdf', json: 'json' }
    return extensions[format] || format
  }

  const getFormatIcon = (format) => {
    const icons = {
      excel: <FileSpreadsheet size={16} />,
      csv: <FileText size={16} />,
      pdf: <FileText size={16} />,
      json: <FileText size={16} />
    }
    return icons[format] || <FileText size={16} />
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  return (
    <div className="hod-pwa-container">
      {/* Header */}
      <div className="hod-pwa-header">
        <h1>
          <FileText size={18} /> Reports
        </h1>
        <div className="hod-pwa-header-actions">
          <span className="user-name">HOD</span>
          <button className="hod-pwa-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {/* Error/Success Messages */}
      <AnimatePresence>
        {error && (
          <motion.div 
            className="hod-pwa-message error"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <AlertCircle size={18} />
            {error}
          </motion.div>
        )}
        {success && (
          <motion.div 
            className="hod-pwa-message success"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <CheckCircle size={18} />
            {success}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter Toggle Button */}
      <button 
        className="hod-pwa-filter-toggle"
        onClick={() => setShowFilters(!showFilters)}
        style={{
          width: '100%',
          padding: '12px 16px',
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '14px',
          fontSize: '14px',
          fontWeight: '500',
          color: '#1a1a2e',
          cursor: 'pointer',
          fontFamily: 'inherit'
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={18} /> Filter Options
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>
            {filters.type} • {filters.format}
          </span>
          <ChevronRight size={16} style={{ transform: showFilters ? 'rotate(90deg)' : 'none', transition: 'transform 0.3s' }} />
        </span>
      </button>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div 
            className="hod-pwa-filters-panel"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              overflow: 'hidden',
              marginBottom: '14px'
            }}
          >
            <div className="hod-pwa-card" style={{ marginBottom: 0 }}>
              <form onSubmit={generateReport}>
                <div className="hod-pwa-filter-group" style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500', display: 'block', marginBottom: '4px' }}>
                    Report Type
                  </label>
                  <select
                    name="type"
                    value={filters.type}
                    onChange={handleFilterChange}
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1.5px solid #e5e7eb',
                      borderRadius: '10px',
                      fontSize: '14px',
                      background: 'white',
                      outline: 'none',
                      fontFamily: 'inherit',
                      color: '#1a1a2e'
                    }}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="semester">Semester</option>
                  </select>
                </div>

                <div className="hod-pwa-filter-group" style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500', display: 'block', marginBottom: '4px' }}>
                    Export Format
                  </label>
                  <select
                    name="format"
                    value={filters.format}
                    onChange={handleFilterChange}
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1.5px solid #e5e7eb',
                      borderRadius: '10px',
                      fontSize: '14px',
                      background: 'white',
                      outline: 'none',
                      fontFamily: 'inherit',
                      color: '#1a1a2e'
                    }}
                  >
                    <option value="excel">Excel (.xlsx)</option>
                    <option value="csv">CSV</option>
                    <option value="pdf">PDF</option>
                    <option value="json">JSON (View in Page)</option>
                  </select>
                </div>

                <div className="hod-pwa-filter-group" style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500', display: 'block', marginBottom: '4px' }}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={filters.startDate}
                    onChange={handleFilterChange}
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1.5px solid #e5e7eb',
                      borderRadius: '10px',
                      fontSize: '14px',
                      outline: 'none',
                      fontFamily: 'inherit',
                      color: '#1a1a2e'
                    }}
                  />
                </div>

                <div className="hod-pwa-filter-group" style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500', display: 'block', marginBottom: '4px' }}>
                    End Date
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={filters.endDate}
                    onChange={handleFilterChange}
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1.5px solid #e5e7eb',
                      borderRadius: '10px',
                      fontSize: '14px',
                      outline: 'none',
                      fontFamily: 'inherit',
                      color: '#1a1a2e'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  className="hod-pwa-btn hod-pwa-btn-approve"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    opacity: loading ? '0.6' : '1'
                  }}
                >
                  {loading ? (
                    <>
                      <Loader size={18} className="hod-pwa-spinning" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download size={18} />
                      Generate Report
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Stats */}
      {reportData && reportData.length > 0 && (
        <div className="hod-pwa-card" style={{ marginBottom: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#1a1a2e' }}>{reportData.length}</div>
              <div style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase' }}>Total</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#10b981' }}>
                {reportData.filter(r => r.status === 'approved').length}
              </div>
              <div style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase' }}>Approved</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#ef4444' }}>
                {reportData.filter(r => r.status === 'rejected').length}
              </div>
              <div style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase' }}>Rejected</div>
            </div>
          </div>
        </div>
      )}

      {/* Report Data */}
      {reportData && reportData.length > 0 ? (
        <div className="hod-pwa-card">
          <div className="hod-pwa-card-header">
            <span className="hod-pwa-card-title">📊 Report Data</span>
            <span className="hod-pwa-card-badge">{reportData.length} records</span>
          </div>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {reportData.slice(0, 20).map((record, idx) => (
              <div key={idx} className="hod-pwa-request-item" style={{ marginBottom: '6px' }}>
                <div className="hod-pwa-request-top">
                  <span className="hod-pwa-request-id">{record.passId || record._id}</span>
                  <span className={`hod-pwa-request-status ${record.status}`}>
                    {record.status}
                  </span>
                </div>
                <div className="hod-pwa-request-info">
                  <span className="hod-pwa-request-student">{record.student?.name || record.studentName || 'N/A'}</span>
                  <span className="hod-pwa-request-detail">{record.department}</span>
                </div>
                <div className="hod-pwa-request-bottom">
                  <span className="hod-pwa-request-time">
                    {record.outTime ? new Date(record.outTime).toLocaleDateString() : '-'}
                  </span>
                  <span className="hod-pwa-request-time">
                    {record.returnTime ? new Date(record.returnTime).toLocaleDateString() : '-'}
                  </span>
                </div>
              </div>
            ))}
          </div>
          {reportData.length > 20 && (
            <p style={{ fontSize: '11px', color: '#6b7280', textAlign: 'center', marginTop: '10px' }}>
              Showing 20 of {reportData.length} records. Download as file to see all.
            </p>
          )}
        </div>
      ) : !loading && !error && (
        <div className="hod-pwa-empty">
          <FileText size={48} style={{ opacity: 0.5 }} />
          <h4>No report generated yet</h4>
          <p>Select filters and click "Generate Report"</p>
        </div>
      )}

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
        <Link to="/hod/students" className="hod-pwa-nav-item">
          <Users size={20} />
          <span>Students</span>
        </Link>
        <Link to="/hod/reports" className="hod-pwa-nav-item active">
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

export default HodReports