// src/pages/HodRequests.jsx - PWA Mobile View
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Link, useNavigate } from 'react-router-dom'
import { 
  Search, Filter, Download, ChevronLeft, ChevronRight,
  Home, Users, BarChart3, UserCog, FileText,
  X, Calendar, User, BookOpen, AlertTriangle,
  CheckCircle, XCircle, Clock, Eye
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// Import PWA CSS
import '../styles/hod.css'

export default function HodRequests() {
  const navigate = useNavigate()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    search: '',
    rollNumber: '',
    year: '',
    section: '',
    status: '',
    emergency: '',
    startDate: '',
    endDate: '',
    sort: 'latest'
  })
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0 })
  const [error, setError] = useState(null)

  const token = localStorage.getItem('token')

  useEffect(() => {
    fetchRequests()
  }, [filters, pagination.page])

  const fetchRequests = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      })
      const res = await axios.get(`/api/hod/requests?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setRequests(res.data.requests || [])
      setPagination(prev => ({ ...prev, total: res.data.total || 0 }))
    } catch (err) {
      console.error(err)
      setError('Failed to load requests')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters(prev => ({ ...prev, [name]: value }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleSort = (sortType) => {
    setFilters(prev => ({ ...prev, sort: sortType }))
    setPagination(prev => ({ ...prev, page: 1 }))
    setShowFilters(false)
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      rollNumber: '',
      year: '',
      section: '',
      status: '',
      emergency: '',
      startDate: '',
      endDate: '',
      sort: 'latest'
    })
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'pending',
      approved: 'approved',
      rejected: 'rejected',
      cancelled: 'pending'
    }
    return badges[status] || 'pending'
  }

  const getStatusIcon = (status) => {
    const icons = {
      pending: <Clock size={14} />,
      approved: <CheckCircle size={14} />,
      rejected: <XCircle size={14} />,
      cancelled: <X size={14} />
    }
    return icons[status] || <Clock size={14} />
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  // Count active filters
  const activeFilterCount = Object.keys(filters).filter(key => 
    filters[key] && key !== 'sort'
  ).length

  return (
    <div className="hod-pwa-container">
      {/* Header */}
      <div className="hod-pwa-header">
        <h1>
          <FileText size={18} /> Requests
        </h1>
        <div className="hod-pwa-header-actions">
          <span className="user-name">HOD</span>
          <button className="hod-pwa-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginBottom: '14px',
        alignItems: 'center'
      }}>
        <div style={{ 
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          background: 'white',
          borderRadius: '12px',
          padding: '0 14px',
          border: '1px solid #e5e7eb'
        }}>
          <Search size={18} style={{ color: '#9ca3af' }} />
          <input
            type="text"
            name="search"
            placeholder="Search students..."
            value={filters.search}
            onChange={handleFilterChange}
            style={{
              flex: 1,
              padding: '10px 12px',
              border: 'none',
              outline: 'none',
              fontSize: '14px',
              background: 'transparent',
              fontFamily: 'inherit',
              color: '#1a1a2e'
            }}
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          style={{
            padding: '10px 14px',
            background: showFilters ? '#667eea' : 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            color: showFilters ? 'white' : '#1a1a2e',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            fontWeight: '500',
            fontFamily: 'inherit',
            position: 'relative'
          }}
        >
          <Filter size={18} />
          {activeFilterCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              background: '#ef4444',
              color: 'white',
              fontSize: '9px',
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700'
            }}>
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            style={{ overflow: 'hidden', marginBottom: '14px' }}
          >
            <div className="hod-pwa-card" style={{ marginBottom: 0 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: '500', display: 'block', marginBottom: '2px' }}>
                    Year
                  </label>
                  <select
                    name="year"
                    value={filters.year}
                    onChange={handleFilterChange}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      border: '1.5px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '13px',
                      background: 'white',
                      outline: 'none',
                      fontFamily: 'inherit',
                      color: '#1a1a2e'
                    }}
                  >
                    <option value="">All Years</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: '500', display: 'block', marginBottom: '2px' }}>
                    Section
                  </label>
                  <select
                    name="section"
                    value={filters.section}
                    onChange={handleFilterChange}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      border: '1.5px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '13px',
                      background: 'white',
                      outline: 'none',
                      fontFamily: 'inherit',
                      color: '#1a1a2e'
                    }}
                  >
                    <option value="">All Sections</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: '500', display: 'block', marginBottom: '2px' }}>
                    Status
                  </label>
                  <select
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      border: '1.5px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '13px',
                      background: 'white',
                      outline: 'none',
                      fontFamily: 'inherit',
                      color: '#1a1a2e'
                    }}
                  >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: '500', display: 'block', marginBottom: '2px' }}>
                    Type
                  </label>
                  <select
                    name="emergency"
                    value={filters.emergency}
                    onChange={handleFilterChange}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      border: '1.5px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '13px',
                      background: 'white',
                      outline: 'none',
                      fontFamily: 'inherit',
                      color: '#1a1a2e'
                    }}
                  >
                    <option value="">All</option>
                    <option value="true">Emergency</option>
                    <option value="false">Normal</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: '500', display: 'block', marginBottom: '2px' }}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={filters.startDate}
                    onChange={handleFilterChange}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      border: '1.5px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '13px',
                      outline: 'none',
                      fontFamily: 'inherit',
                      color: '#1a1a2e'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#6b7280', fontWeight: '500', display: 'block', marginBottom: '2px' }}>
                    End Date
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={filters.endDate}
                    onChange={handleFilterChange}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      border: '1.5px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '13px',
                      outline: 'none',
                      fontFamily: 'inherit',
                      color: '#1a1a2e'
                    }}
                  />
                </div>
              </div>
              <div style={{ 
                display: 'flex', 
                gap: '8px', 
                marginTop: '12px',
                paddingTop: '12px',
                borderTop: '1px solid #f3f4f6',
                flexWrap: 'wrap'
              }}>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', flex: 1 }}>
                  <button 
                    className={`hod-pwa-filter-btn ${filters.sort === 'latest' ? 'active' : ''}`}
                    onClick={() => handleSort('latest')}
                    style={{ fontSize: '11px' }}
                  >
                    Latest
                  </button>
                  <button 
                    className={`hod-pwa-filter-btn ${filters.sort === 'oldest' ? 'active' : ''}`}
                    onClick={() => handleSort('oldest')}
                    style={{ fontSize: '11px' }}
                  >
                    Oldest
                  </button>
                  <button 
                    className={`hod-pwa-filter-btn ${filters.sort === 'emergency' ? 'active' : ''}`}
                    onClick={() => handleSort('emergency')}
                    style={{ fontSize: '11px', color: filters.sort === 'emergency' ? '#dc2626' : '' }}
                  >
                    🚨 Emergency
                  </button>
                </div>
                <button 
                  className="hod-pwa-btn hod-pwa-btn-reject"
                  onClick={clearFilters}
                  style={{ padding: '4px 14px', fontSize: '11px' }}
                >
                  <X size={14} /> Clear
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Count */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px',
        fontSize: '13px',
        color: '#6b7280'
      }}>
        <span>{pagination.total} requests found</span>
        {loading && <span className="hod-pwa-spinning" style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid #e5e7eb', borderTopColor: '#667eea', borderRadius: '50%' }}></span>}
      </div>

      {/* Requests List */}
      {error ? (
        <div className="hod-pwa-empty">
          <AlertTriangle size={48} style={{ color: '#ef4444' }} />
          <h4>{error}</h4>
          <p>Please try again</p>
          <button 
            className="hod-pwa-btn hod-pwa-btn-view"
            onClick={fetchRequests}
            style={{ padding: '10px 24px' }}
          >
            Retry
          </button>
        </div>
      ) : loading && requests.length === 0 ? (
        <div className="hod-pwa-loading">
          <div className="hod-pwa-spinner"></div>
          <p>Loading requests...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="hod-pwa-empty">
          <FileText size={48} style={{ opacity: 0.5 }} />
          <h4>No requests found</h4>
          <p>Try adjusting your filters</p>
        </div>
      ) : (
        <div>
          {requests.map((req) => (
            <div key={req._id} className={`hod-pwa-request-item ${req.emergency ? 'emergency' : ''}`}>
              <div className="hod-pwa-request-top">
                <span className="hod-pwa-request-id">{req.passId}</span>
                <span className={`hod-pwa-request-status ${getStatusBadge(req.status)}`}>
                  {getStatusIcon(req.status)} {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                </span>
              </div>
              <div className="hod-pwa-request-info">
                <span className="hod-pwa-request-student">
                  {req.student?.name} ({req.student?.studentId})
                </span>
                <span className="hod-pwa-request-detail">
                  {req.reason} • {req.destination}
                </span>
                <span className="hod-pwa-request-detail">
                  {req.student?.year} • {req.student?.section || 'N/A'}
                </span>
              </div>
              <div className="hod-pwa-request-bottom">
                <span className="hod-pwa-request-time">
                  {req.outTime ? new Date(req.outTime).toLocaleDateString() : '-'}
                </span>
                <div className="hod-pwa-request-actions">
                  {req.emergency && <span style={{ fontSize: '10px', color: '#dc2626', fontWeight: '600' }}>🚨</span>}
                  <Link to={`/hod/request/${req._id}`} className="hod-pwa-btn hod-pwa-btn-view">
                    <Eye size={14} /> View
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.total > pagination.limit && (
        <div className="hod-pwa-pagination">
          <button 
            disabled={pagination.page === 1}
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
          >
            <ChevronLeft size={16} /> Prev
          </button>
          <span>
            {pagination.page} / {Math.ceil(pagination.total / pagination.limit) || 1}
          </span>
          <button 
            disabled={pagination.page * pagination.limit >= pagination.total}
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="hod-pwa-bottom-nav">
        <Link to="/hod" className="hod-pwa-nav-item">
          <Home size={20} />
          <span>Home</span>
        </Link>
        <Link to="/hod/requests" className="hod-pwa-nav-item active">
          <FileText size={20} />
          <span>Requests</span>
        </Link>
        <Link to="/hod/students" className="hod-pwa-nav-item">
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