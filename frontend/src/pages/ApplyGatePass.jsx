// pages/ApplyGatePass.jsx
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import { 
  FaArrowLeft, FaUpload, FaFileAlt, FaTimes, 
  FaExclamationTriangle, FaCalendarAlt, FaMapMarkerAlt,
  FaCheck, FaSpinner, FaHome, FaClock, FaUser, FaPlus
} from 'react-icons/fa'
import { motion, AnimatePresence } from 'framer-motion'

// IMPORT CSS - CRITICAL
import '../styles/student.css'

export default function ApplyGatePass() {
  const { register, handleSubmit, watch, formState: { errors } } = useForm()
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const emergency = watch('emergency')

  const onSubmit = async (data) => {
    setUploading(true)
    setError('')
    
    try {
      const token = localStorage.getItem('token')
      const formData = new FormData()
      formData.append('reason', data.reason)
      formData.append('destination', data.destination)
      formData.append('outTime', data.outTime)
      formData.append('expectedReturnTime', data.expectedReturnTime)
      formData.append('emergency', data.emergency || false)
      
      if (files.length > 0) {
        files.forEach(file => {
          formData.append('supportingDocs', file)
        })
      }

      const res = await axios.post('/api/gatepass/apply', formData, { 
        headers: { 
          'Content-Type': 'multipart/form-data', 
          Authorization: `Bearer ${token}` 
        } 
      })
      
      setSubmitSuccess(true)
      setTimeout(() => {
        navigate('/student')
      }, 2000)
      
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.message || 'Failed to submit request')
      setUploading(false)
    }
  }

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files || [])
    const validFiles = selectedFiles.filter(file => {
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
      return validTypes.includes(file.type) && file.size <= 5 * 1024 * 1024
    })
    
    setFiles(prev => [...prev, ...validFiles])
  }

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  if (submitSuccess) {
    return (
      <div className="student-apply-success">
        <motion.div 
          className="student-success-content"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="student-success-icon">✅</div>
          <h2>Request Submitted!</h2>
          <p>Your gate pass request has been submitted successfully.</p>
          <p className="student-success-subtext">Redirecting to dashboard...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="student-apply-container">
      {/* Header */}
      <div className="student-apply-header">
        <Link to="/student" className="student-back-btn">
          <FaArrowLeft />
        </Link>
        <h2>Apply for Gate Pass</h2>
        <div style={{ width: 40 }}></div>
      </div>

      {/* Form Content - with bottom padding for fixed nav */}
      <div className="student-apply-content">
        <form onSubmit={handleSubmit(onSubmit)} className="student-apply-form">
          {/* Emergency Toggle */}
          <div className="student-form-group">
            <div className="student-emergency-toggle">
              <label className="student-switch">
                <input type="checkbox" {...register('emergency')} />
                <span className="student-slider"></span>
              </label>
              <div className="student-emergency-label">
                <FaExclamationTriangle className={emergency ? 'student-active' : ''} />
                <span>Mark as Emergency</span>
              </div>
            </div>
            {emergency && (
              <motion.div 
                className="student-emergency-warning"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
              >
                <FaExclamationTriangle />
                <span>Emergency requests will be prioritized</span>
              </motion.div>
            )}
          </div>

          {/* Reason */}
          <div className="student-form-group">
            <label><FaFileAlt /> Reason *</label>
            <select 
              className={`student-form-select ${errors.reason ? 'student-form-input-error' : ''}`}
              {...register('reason', { required: 'Reason is required' })}
            >
              <option value="">Select reason</option>
              <option value="Medical">Medical</option>
              <option value="Personal">Personal</option>
              <option value="Family Emergency">Family Emergency</option>
              <option value="Placement Drive">Placement Drive</option>
              <option value="Academic Work">Academic Work</option>
              <option value="Others">Others</option>
            </select>
            {errors.reason && <span className="student-error-text">{errors.reason.message}</span>}
          </div>

          {/* Destination */}
          <div className="student-form-group">
            <label><FaMapMarkerAlt /> Destination *</label>
            <input 
              className={`student-form-input ${errors.destination ? 'student-form-input-error' : ''}`}
              placeholder="Enter destination address"
              {...register('destination', { required: 'Destination is required' })}
            />
            {errors.destination && <span className="student-error-text">{errors.destination.message}</span>}
          </div>

          {/* Date/Time */}
          <div className="student-form-row">
            <div className="student-form-group">
              <label><FaCalendarAlt /> Out Time *</label>
              <input 
                type="datetime-local" 
                className={`student-form-input ${errors.outTime ? 'student-form-input-error' : ''}`}
                {...register('outTime', { required: 'Out time is required' })}
              />
              {errors.outTime && <span className="student-error-text">{errors.outTime.message}</span>}
            </div>
            <div className="student-form-group">
              <label><FaCalendarAlt /> Return Time *</label>
              <input 
                type="datetime-local" 
                className={`student-form-input ${errors.expectedReturnTime ? 'student-form-input-error' : ''}`}
                {...register('expectedReturnTime', { required: 'Return time is required' })}
              />
              {errors.expectedReturnTime && <span className="student-error-text">{errors.expectedReturnTime.message}</span>}
            </div>
          </div>

          {/* File Upload */}
          <div className="student-form-group">
            <label>Supporting Documents</label>
            <div className="student-upload-area">
              <input 
                type="file" 
                id="fileUpload" 
                onChange={handleFileChange} 
                multiple 
                accept=".jpg,.jpeg,.png,.pdf"
                style={{ display: 'none' }}
              />
              <label htmlFor="fileUpload" className="student-upload-label">
                <FaUpload />
                <span>Upload Documents</span>
                <small>JPG, PNG, PDF (Max 5MB each)</small>
              </label>
            </div>
            
            {files.length > 0 && (
              <div className="student-file-list">
                <AnimatePresence>
                  {files.map((file, index) => (
                    <motion.div 
                      key={index}
                      className="student-file-item"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                    >
                      <span className="student-file-name">{file.name}</span>
                      <span className="student-file-size">
                        {(file.size / 1024).toFixed(1)} KB
                      </span>
                      <button 
                        type="button" 
                        className="student-file-remove"
                        onClick={() => removeFile(index)}
                      >
                        <FaTimes />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="student-form-error">
              <FaExclamationTriangle />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button 
            type="submit" 
            className="student-submit-btn"
            disabled={uploading}
          >
            {uploading ? (
              <>
                <FaSpinner className="student-spinning" />
                Submitting...
              </>
            ) : (
              <>
                <FaCheck /> Submit Request
              </>
            )}
          </button>

          {/* Extra bottom padding for fixed nav */}
          <div style={{ height: '80px' }}></div>
        </form>
      </div>

      {/* Fixed Bottom Navigation */}
      <div className="student-bottom-nav-fixed">
        <Link to="/student" className="student-nav-item">
          <FaHome />
          <span>Home</span>
        </Link>
        <Link to="/student/apply" className="student-nav-item student-active">
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