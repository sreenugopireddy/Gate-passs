// src/pages/HodRequestDetails.jsx - PWA Mobile View
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
  ArrowLeft, CheckCircle, XCircle, AlertTriangle, 
  Clock, User, Mail, Phone, MapPin, Calendar,
  FileText, Printer, Home, Users, BarChart3, UserCog,
  Download, Eye, Shield, Info, X
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// Import PWA CSS
import '../styles/hod.css'

export default function HodRequestDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [remarks, setRemarks] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [error, setError] = useState(null)
  const token = localStorage.getItem('token')

  useEffect(() => {
    fetchRequestDetails()
  }, [id])

  const fetchRequestDetails = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.get(`/api/hod/request/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setData(res.data)
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.message || 'Failed to load request details')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!remarks.trim()) {
      alert('Please enter approval remarks')
      return
    }
    try {
      await axios.put(
        `/api/hod/request/${id}/approve`,
        { remarks },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      alert('✅ Request approved successfully!')
      setShowApproveModal(false)
      fetchRequestDetails()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve request')
    }
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('Please enter rejection reason')
      return
    }
    try {
      await axios.put(
        `/api/hod/request/${id}/reject`,
        { remarks: rejectReason },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      alert('❌ Request rejected!')
      setShowRejectModal(false)
      fetchRequestDetails()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject request')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="hod-pwa-container">
        <div className="hod-pwa-header">
          <h1>Request Details</h1>
          <div className="hod-pwa-header-actions">
            <button className="hod-pwa-logout" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
        <div className="hod-pwa-loading">
          <div className="hod-pwa-spinner"></div>
          <p>Loading request details...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="hod-pwa-container">
        <div className="hod-pwa-header">
          <h1>Request Details</h1>
          <div className="hod-pwa-header-actions">
            <button className="hod-pwa-logout" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
        <div className="hod-pwa-empty">
          <AlertTriangle size={48} style={{ color: '#ef4444' }} />
          <h4>{error || 'Request not found'}</h4>
          <p>Please go back and try again</p>
          <button 
            className="hod-pwa-btn hod-pwa-btn-view"
            onClick={() => navigate('/hod/requests')}
            style={{ padding: '10px 24px' }}
          >
            <ArrowLeft size={16} /> Back to Requests
          </button>
        </div>
      </div>
    )
  }

  const { request, history, attendancePercent, risk } = data
  const isHighRisk = risk?.riskLevel === 'High'

  return (
    <div className="hod-pwa-container">
      {/* Header */}
      <div className="hod-pwa-header">
        <h1>Request Details</h1>
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
        onClick={() => navigate('/hod/requests')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'none',
          border: 'none',
          color: '#667eea',
          fontSize: '13px',
          fontWeight: '500',
          padding: '8px 0',
          marginBottom: '12px',
          cursor: 'pointer',
          fontFamily: 'inherit'
        }}
      >
        <ArrowLeft size={16} /> Back to Requests
      </button>

      {/* Status Banner */}
      <div style={{
        padding: '12px 16px',
        borderRadius: '12px',
        marginBottom: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: request.status === 'approved' ? '#d1fae5' : 
                    request.status === 'rejected' ? '#fee2e2' : '#fef3c7',
        color: request.status === 'approved' ? '#065f46' : 
               request.status === 'rejected' ? '#991b1b' : '#92400e'
      }}>
        <span style={{ fontWeight: '600', fontSize: '14px' }}>
          {request.status === 'approved' ? '✅ Approved' : 
           request.status === 'rejected' ? '❌ Rejected' : '⏳ Pending'}
        </span>
        {request.emergency && (
          <span style={{
            padding: '4px 12px',
            background: '#dc2626',
            color: 'white',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: '600'
          }}>
            🚨 Emergency
          </span>
        )}
        {request.status === 'pending' && (
          <div style={{ display: 'flex', gap: '6px' }}>
            <button 
              className="hod-pwa-btn hod-pwa-btn-approve"
              onClick={() => setShowApproveModal(true)}
              style={{ padding: '4px 12px' }}
            >
              Approve
            </button>
            <button 
              className="hod-pwa-btn hod-pwa-btn-reject"
              onClick={() => setShowRejectModal(true)}
              style={{ padding: '4px 12px' }}
            >
              Reject
            </button>
          </div>
        )}
      </div>

      {/* Student Profile Card */}
      <div className="hod-pwa-card">
        <div className="hod-pwa-card-header">
          <span className="hod-pwa-card-title">👤 Student Profile</span>
          <span className="hod-pwa-card-badge">{request.passId}</span>
        </div>
        <div className="hod-pwa-detail-profile" style={{ flexDirection: 'row', padding: 0 }}>
          <div className="hod-pwa-detail-avatar" style={{ width: '56px', height: '56px', fontSize: '22px' }}>
            {request.student?.photoUrl ? (
              <img src={request.student.photoUrl} alt={request.student.name} />
            ) : (
              request.student?.name?.charAt(0) || 'S'
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div className="hod-pwa-detail-name">{request.student?.name}</div>
            <div className="hod-pwa-detail-sub">{request.student?.studentId}</div>
            <div className="hod-pwa-detail-sub" style={{ fontSize: '11px' }}>
              {request.student?.department} • Year {request.student?.year} • {request.student?.section || 'N/A'}
            </div>
          </div>
        </div>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '6px', 
          marginTop: '12px',
          paddingTop: '12px',
          borderTop: '1px solid #f3f4f6'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#6b7280' }}>
            <Mail size={14} /> {request.student?.email}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#6b7280' }}>
            <Phone size={14} /> {request.student?.mobile || 'N/A'}
          </div>
        </div>

        {/* Risk Analysis */}
        <div className={`hod-pwa-risk ${isHighRisk ? 'high' : risk?.riskLevel === 'Medium' ? 'medium' : 'low'}`}
             style={{ marginTop: '12px' }}>
          <Shield size={18} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: '600' }}>
              {risk?.riskLevel || 'Low'} Risk • Score: {risk?.riskScore || 0}
            </div>
            <div style={{ fontSize: '11px', color: '#6b7280' }}>
              Passes: {history?.totalTaken || 0} • Approved: {history?.approvedCount || 0} • Rejected: {history?.rejectedCount || 0}
            </div>
          </div>
          {isHighRisk && <AlertTriangle size={18} style={{ color: '#dc2626' }} />}
        </div>
      </div>

      {/* Request Information */}
      <div className="hod-pwa-card">
        <div className="hod-pwa-card-header">
          <span className="hod-pwa-card-title">📋 Request Information</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div className="hod-pwa-detail-info-item">
            <div className="hod-pwa-detail-info-label">Reason</div>
            <div className="hod-pwa-detail-info-value">{request.reason}</div>
          </div>
          <div className="hod-pwa-detail-info-item">
            <div className="hod-pwa-detail-info-label">Destination</div>
            <div className="hod-pwa-detail-info-value">{request.destination}</div>
          </div>
          <div className="hod-pwa-detail-info-item">
            <div className="hod-pwa-detail-info-label">Out Time</div>
            <div className="hod-pwa-detail-info-value">
              {request.outTime ? new Date(request.outTime).toLocaleString() : '-'}
            </div>
          </div>
          <div className="hod-pwa-detail-info-item">
            <div className="hod-pwa-detail-info-label">Return Time</div>
            <div className="hod-pwa-detail-info-value">
              {request.expectedReturnTime ? new Date(request.expectedReturnTime).toLocaleString() : '-'}
            </div>
          </div>
        </div>

        {/* Supporting Documents */}
        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f3f4f6' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500', marginBottom: '6px' }}>
            Supporting Documents
          </div>
          {request.supportingDocs?.length > 0 ? (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {request.supportingDocs.map((doc, i) => (
                <a 
                  key={i} 
                  href={doc.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 12px',
                    background: '#f3f4f6',
                    borderRadius: '6px',
                    color: '#667eea',
                    textDecoration: 'none',
                    fontSize: '12px'
                  }}
                >
                  <FileText size={14} /> Doc {i + 1}
                </a>
              ))}
            </div>
          ) : (
            <span style={{ fontSize: '13px', color: '#9ca3af' }}>No documents uploaded</span>
          )}
        </div>
      </div>

      {/* Student History */}
      <div className="hod-pwa-card">
        <div className="hod-pwa-card-header">
          <span className="hod-pwa-card-title">📊 Previous History</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#1a1a2e' }}>{history?.totalTaken || 0}</div>
            <div style={{ fontSize: '9px', color: '#6b7280', textTransform: 'uppercase' }}>Total</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#10b981' }}>{history?.approvedCount || 0}</div>
            <div style={{ fontSize: '9px', color: '#6b7280', textTransform: 'uppercase' }}>Approved</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#ef4444' }}>{history?.rejectedCount || 0}</div>
            <div style={{ fontSize: '9px', color: '#6b7280', textTransform: 'uppercase' }}>Rejected</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#667eea' }}>{attendancePercent || 'N/A'}%</div>
            <div style={{ fontSize: '9px', color: '#6b7280', textTransform: 'uppercase' }}>Attendance</div>
          </div>
        </div>
        {history?.totalTaken > 10 && (
          <div style={{
            marginTop: '10px',
            padding: '8px 12px',
            background: '#fef3c7',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            color: '#92400e'
          }}>
            <AlertTriangle size={16} /> Student has more than 10 gate passes this month
          </div>
        )}
      </div>

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

      {/* Approve Modal */}
      <AnimatePresence>
        {showApproveModal && (
          <div className="hod-pwa-modal-overlay" onClick={() => setShowApproveModal(false)}>
            <motion.div 
              className="hod-pwa-modal"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="hod-pwa-modal-title">✅ Approve Request</div>
                <button 
                  onClick={() => setShowApproveModal(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '24px',
                    cursor: 'pointer',
                    color: '#6b7280'
                  }}
                >
                  <X size={20} />
                </button>
              </div>
              <div className="hod-pwa-modal-sub">Please enter your approval remarks</div>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter approval remarks (e.g., Approved for medical visit)"
                rows={4}
              />
              <div className="hod-pwa-modal-actions">
                <button 
                  className="hod-pwa-modal-cancel"
                  onClick={() => setShowApproveModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="hod-pwa-modal-approve"
                  onClick={handleApprove}
                >
                  <CheckCircle size={18} /> Confirm Approve
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reject Modal */}
      <AnimatePresence>
        {showRejectModal && (
          <div className="hod-pwa-modal-overlay" onClick={() => setShowRejectModal(false)}>
            <motion.div 
              className="hod-pwa-modal"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="hod-pwa-modal-title">❌ Reject Request</div>
                <button 
                  onClick={() => setShowRejectModal(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '24px',
                    cursor: 'pointer',
                    color: '#6b7280'
                  }}
                >
                  <X size={20} />
                </button>
              </div>
              <div className="hod-pwa-modal-sub">Please provide a reason for rejection</div>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter rejection reason (e.g., Insufficient justification)"
                rows={4}
              />
              <div className="hod-pwa-modal-actions">
                <button 
                  className="hod-pwa-modal-cancel"
                  onClick={() => setShowRejectModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="hod-pwa-modal-reject"
                  onClick={handleReject}
                >
                  <XCircle size={18} /> Confirm Reject
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}