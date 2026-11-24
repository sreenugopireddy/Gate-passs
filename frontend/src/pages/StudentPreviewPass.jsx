// pages/StudentPreviewPass.jsx
import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import axios from 'axios'
import { 
  FaArrowLeft, FaDownload, FaPrint, FaHome, 
  FaPlus, FaClock, FaUser, FaCheck, FaSpinner
} from 'react-icons/fa'
import { motion } from 'framer-motion'

// IMPORT CSS
import '../styles/student.css'

export default function StudentPreviewPass() {
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(true)
  const [pdfUrl, setPdfUrl] = useState(null)
  const [passData, setPassData] = useState(null)
  const [error, setError] = useState(null)

  // Get pass data from location state or URL params
  const passId = location.state?.passId || null
  const requestId = location.state?.requestId || null

  useEffect(() => {
    if (!passId || !requestId) {
      setError('No pass selected')
      setLoading(false)
      return
    }

    fetchPass()
  }, [passId, requestId])

  const fetchPass = async () => {
    setLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem('token')
      
      // Get pass details
      const detailsRes = await axios.get(`/api/gatepass/status/${requestId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setPassData(detailsRes.data.gatepass)

      // Download PDF for preview
      const pdfRes = await fetch(`/api/gatepass/download/${requestId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!pdfRes.ok) {
        throw new Error('Failed to load PDF')
      }

      const blob = await pdfRes.blob()
      const url = URL.createObjectURL(blob)
      setPdfUrl(url)

    } catch (err) {
      console.error('Error loading pass:', err)
      setError(err.message || 'Failed to load pass')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/gatepass/download/${requestId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) return alert('Download failed')
      
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${passId}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
      alert('Download error')
    }
  }

  const handlePrint = () => {
    const printWindow = window.open(pdfUrl, '_blank')
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print()
      }
    }
  }

  const handleBack = () => {
    navigate('/student')
  }

  if (loading) {
    return (
      <div className="student-preview-container">
        <div className="student-loading-container">
          <div className="student-spinner-icon"></div>
          <p>Loading your gate pass...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="student-preview-container">
        <div className="student-error-container">
          <div className="student-error-icon">❌</div>
          <h3>Failed to Load Pass</h3>
          <p>{error}</p>
          <button className="student-btn-primary" onClick={handleBack}>
            <FaArrowLeft /> Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="student-preview-container">
      {/* Header */}
      <div className="student-preview-header">
        <button className="student-back-btn" onClick={handleBack}>
          <FaArrowLeft />
        </button>
        <h2>Gate Pass Preview</h2>
        <div style={{ width: 40 }}></div>
      </div>

      {/* Pass Info Bar */}
      {passData && (
        <div className="student-preview-info-bar">
          <div className="preview-info-item">
            <span className="preview-info-label">Pass ID</span>
            <span className="preview-info-value">{passData.passId}</span>
          </div>
          <div className="preview-info-item">
            <span className="preview-info-label">Status</span>
            <span className={`preview-info-value student-status-badge student-status-${passData.status}`}>
              {passData.status.charAt(0).toUpperCase() + passData.status.slice(1)}
            </span>
          </div>
          <div className="preview-info-item">
            <span className="preview-info-label">Reason</span>
            <span className="preview-info-value">{passData.reason}</span>
          </div>
          {passData.emergency && (
            <div className="preview-info-item emergency">
              <span className="preview-info-label">🚨 Emergency</span>
            </div>
          )}
        </div>
      )}

      {/* PDF Viewer */}
      <div className="student-pdf-viewer">
        {pdfUrl ? (
          <embed
            src={pdfUrl}
            type="application/pdf"
            width="100%"
            height="100%"
            className="student-pdf-embed"
          />
        ) : (
          <div className="student-no-pdf">
            <div className="no-pdf-icon">📄</div>
            <p>No PDF available</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="student-preview-actions">
        <button className="student-btn-preview" onClick={handleBack}>
          <FaArrowLeft /> Back
        </button>
        <button className="student-btn-secondary" onClick={handlePrint}>
          <FaPrint /> Print
        </button>
        <button className="student-btn-download" onClick={handleDownload}>
          <FaDownload /> Download
        </button>
      </div>

      {/* Bottom Navigation */}
      <div className="student-bottom-nav-fixed">
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