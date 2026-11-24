// pages/HodProfile.jsx - Updated to use HOD route
import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { 
  ArrowLeft, User, Mail, Building, Camera, Upload, 
  CheckCircle, AlertCircle, LogOut, Home, FileText, 
  Users, BarChart3, UserCog, Edit, Save, X
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// Import PWA CSS
import '../styles/hod.css'

export default function HodProfile() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [file, setFile] = useState(null)
  const [filePreview, setFilePreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    mobile: ''
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await axios.get('/api/auth/me', { 
        headers: { Authorization: `Bearer ${token}` } 
      })
      setUser(res.data.user)
      setFormData({
        name: res.data.user.name || '',
        email: res.data.user.email || '',
        department: res.data.user.department || '',
        mobile: res.data.user.mobile || ''
      })
    } catch (err) { 
      console.error(err)
      if (err.response?.status === 401) {
        navigate('/login')
      }
    }
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg']
      if (!validTypes.includes(selectedFile.type)) {
        setMessage({ 
          type: 'error', 
          text: 'Please upload a valid image (JPG or PNG)' 
        })
        return
      }
      
      // Validate file size (max 2MB)
      if (selectedFile.size > 2 * 1024 * 1024) {
        setMessage({ 
          type: 'error', 
          text: 'File size should be less than 2MB' 
        })
        return
      }
      
      setFile(selectedFile)
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setFilePreview(reader.result)
      }
      reader.readAsDataURL(selectedFile)
      setMessage({ type: '', text: '' })
    }
  }

  const uploadSignature = async () => {
    if (!file) {
      setMessage({ type: 'error', text: 'Please select a signature image' })
      return
    }
    
    setUploading(true)
    setMessage({ type: '', text: '' })
    
    try {
      const token = localStorage.getItem('token')
      const formData = new FormData()
      formData.append('signature', file)
      
      console.log('📤 Uploading signature...')
      
      // ✅ Use HOD route instead of admin route
      const res = await axios.post(
        '/api/hod/upload-signature',  // Changed from admin to hod
        formData, 
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data' 
          } 
        }
      )
      
      console.log('✅ Upload response:', res.data)
      
      setUser({ ...user, signatureUrl: res.data.signatureUrl })
      setMessage({ type: 'success', text: 'Signature uploaded successfully!' })
      setFile(null)
      setFilePreview(null)
      
      // Clear file input
      document.getElementById('signatureInput').value = ''
      
    } catch (err) { 
      console.error('❌ Upload error:', err)
      
      let errorMessage = 'Upload failed. Please try again.'
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message
      }
      
      if (err.response?.status === 500) {
        errorMessage = 'Server error. Please check Cloudinary configuration.'
      }
      
      setMessage({ 
        type: 'error', 
        text: errorMessage 
      })
    } finally { 
      setUploading(false) 
    }
  }

  const handleEditToggle = () => {
    setEditMode(!editMode)
    if (!editMode) {
      setFormData({
        name: user?.name || '',
        email: user?.email || '',
        department: user?.department || '',
        mobile: user?.mobile || ''
      })
    }
    setMessage({ type: '', text: '' })
  }

  const handleInputChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const saveProfile = async () => {
    setSaving(true)
    setMessage({ type: '', text: '' })
    
    try {
      const token = localStorage.getItem('token')
      const res = await axios.put(
        `/api/hod/profile`, 
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      setUser(res.data.user || { ...user, ...formData })
      setMessage({ type: 'success', text: 'Profile updated successfully!' })
      setEditMode(false)
      
    } catch (err) {
      console.error(err)
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'Failed to update profile' 
      })
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const getInitials = (name) => {
    if (!name) return 'H'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  if (!user) {
    return (
      <div className="hod-pwa-container">
        <div className="hod-pwa-header">
          <h1>Profile</h1>
          <div className="hod-pwa-header-actions">
            <button className="hod-pwa-logout" onClick={handleLogout}>
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>
        <div className="hod-pwa-loading">
          <div className="hod-pwa-spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="hod-pwa-container">
      {/* Header */}
      <div className="hod-pwa-header">
        <h1><UserCog size={18} /> Profile</h1>
        <div className="hod-pwa-header-actions">
          <span className="user-name">{user.name || 'HOD'}</span>
          <button className="hod-pwa-logout" onClick={handleLogout}>
            <LogOut size={14} /> Logout
          </button>
        </div>
      </div>

      {/* Message Alert */}
      <AnimatePresence>
        {message.text && (
          <motion.div 
            className={`hod-pwa-message ${message.type}`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Card */}
      <div className="hod-pwa-card" style={{ textAlign: 'center' }}>
        <div className="hod-pwa-detail-profile" style={{ flexDirection: 'column', background: 'transparent' }}>
          <div className="hod-pwa-detail-avatar" style={{ width: '80px', height: '80px', fontSize: '28px' }}>
            {user.photoUrl ? (
              <img src={user.photoUrl} alt={user.name} />
            ) : (
              getInitials(user.name)
            )}
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1a1a2e', margin: '8px 0 2px 0' }}>
            {user.name}
          </h2>
          <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
            {user.role?.toUpperCase() || 'HOD'}
          </p>
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px', justifyContent: 'center' }}>
            <button 
              className="hod-pwa-btn hod-pwa-btn-view"
              onClick={handleEditToggle}
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              {editMode ? <X size={14} /> : <Edit size={14} />}
              {editMode ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>
        </div>
      </div>

      {/* Profile Details */}
      <div className="hod-pwa-card">
        <div className="hod-pwa-card-header">
          <span className="hod-pwa-card-title">📋 Profile Details</span>
        </div>

        {editMode ? (
          <div>
            <div className="hod-pwa-detail-info-item" style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="hod-pwa-input"
              />
            </div>
            <div className="hod-pwa-detail-info-item" style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                disabled
                className="hod-pwa-input"
              />
              <small style={{ fontSize: '10px', color: '#9ca3af' }}>Email cannot be changed</small>
            </div>
            <div className="hod-pwa-detail-info-item" style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Department</label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                className="hod-pwa-input"
              />
            </div>
            <div className="hod-pwa-detail-info-item" style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Mobile</label>
              <input
                type="text"
                name="mobile"
                value={formData.mobile}
                onChange={handleInputChange}
                className="hod-pwa-input"
              />
            </div>
            <button 
              className="hod-pwa-btn hod-pwa-btn-approve"
              onClick={saveProfile}
              disabled={saving}
              style={{ width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px' }}
            >
              {saving ? 'Saving...' : <><Save size={16} /> Save Changes</>}
            </button>
          </div>
        ) : (
          <div>
            <div className="hod-pwa-detail-info-item" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
              <span style={{ color: '#6b7280', fontSize: '13px' }}>Name</span>
              <span style={{ color: '#1a1a2e', fontSize: '13px', fontWeight: '500' }}>{user.name}</span>
            </div>
            <div className="hod-pwa-detail-info-item" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
              <span style={{ color: '#6b7280', fontSize: '13px' }}>Email</span>
              <span style={{ color: '#1a1a2e', fontSize: '13px', fontWeight: '500' }}>{user.email}</span>
            </div>
            <div className="hod-pwa-detail-info-item" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
              <span style={{ color: '#6b7280', fontSize: '13px' }}>Department</span>
              <span style={{ color: '#1a1a2e', fontSize: '13px', fontWeight: '500' }}>{user.department || 'Not assigned'}</span>
            </div>
            <div className="hod-pwa-detail-info-item" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
              <span style={{ color: '#6b7280', fontSize: '13px' }}>Role</span>
              <span style={{ color: '#1a1a2e', fontSize: '13px', fontWeight: '500' }}>{user.role?.toUpperCase() || 'HOD'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Signature Upload */}
      <div className="hod-pwa-card">
        <div className="hod-pwa-card-header">
          <span className="hod-pwa-card-title">✍️ Signature</span>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500', display: 'block', marginBottom: '4px' }}>
            Current Signature
          </label>
          {user.signatureUrl ? (
            <div style={{ 
              background: '#f8fafc', 
              borderRadius: '8px', 
              padding: '12px',
              textAlign: 'center',
              border: '1px solid #e5e7eb'
            }}>
              <img 
                src={user.signatureUrl} 
                alt="signature" 
                style={{ maxWidth: '200px', maxHeight: '60px' }} 
              />
            </div>
          ) : (
            <div style={{ 
              background: '#f8fafc', 
              borderRadius: '8px', 
              padding: '16px',
              textAlign: 'center',
              color: '#9ca3af',
              fontSize: '13px',
              border: '1px dashed #d1d5db'
            }}>
              No signature uploaded
            </div>
          )}
        </div>

        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500', display: 'block', marginBottom: '4px' }}>
            Upload New Signature
          </label>
          <input 
            type="file" 
            id="signatureInput"
            className="hod-pwa-file-input"
            accept="image/jpeg,image/png,image/jpg" 
            onChange={handleFileChange}
          />
          {filePreview && (
            <div style={{ marginTop: '8px', textAlign: 'center' }}>
              <img 
                src={filePreview} 
                alt="preview" 
                style={{ maxWidth: '150px', maxHeight: '50px', borderRadius: '4px' }} 
              />
              <p style={{ fontSize: '11px', color: '#6b7280', margin: '4px 0 0 0' }}>{file?.name}</p>
            </div>
          )}
        </div>

        <button 
          className="hod-pwa-btn hod-pwa-btn-approve"
          onClick={uploadSignature}
          disabled={uploading || !file}
          style={{ 
            width: '100%', 
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '14px',
            opacity: (!file || uploading) ? '0.6' : '1'
          }}
        >
          {uploading ? 'Uploading...' : <><Upload size={16} /> Upload Signature</>}
        </button>
      </div>

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
        <Link to="/hod/reports" className="hod-pwa-nav-item">
          <BarChart3 size={20} />
          <span>Reports</span>
        </Link>
        <Link to="/hod/profile" className="hod-pwa-nav-item active">
          <UserCog size={20} />
          <span>Profile</span>
        </Link>
      </div>
    </div>
  )
}