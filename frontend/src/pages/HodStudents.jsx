// src/pages/HodStudents.jsx - Complete with Proper CSS
import React, { useEffect, useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import { 
  Download, Upload, UserPlus, FileSpreadsheet, Edit, 
  Trash2, Eye, Filter, X, Home, Users, BarChart3, 
  UserCog, FileText, Search, Loader,
  AlertCircle, CheckCircle, Mail, Phone, User
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// ✅ IMPORT CSS - Make sure this path is correct
import '../styles/hod.css'

export default function HodStudents() {
  const navigate = useNavigate()
  const [students, setStudents] = useState([])
  const [filteredStudents, setFilteredStudents] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [file, setFile] = useState(null)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [formValues, setFormValues] = useState({ 
    name: '', 
    email: '', 
    studentId: '', 
    year: '', 
    mobile: '', 
    parentMobile: '', 
    section: '' 
  })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    year: '',
    section: '',
    search: ''
  })
  
  const formRef = useRef(null)
  const fileInputRef = useRef(null)
  const token = localStorage.getItem('token')

  useEffect(() => { 
    fetchStudents() 
  }, [])

  useEffect(() => {
    applyFilters()
  }, [students, filters])

  // ========== FETCH STUDENTS ==========
  const fetchStudents = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/hod/students', { 
        headers: { Authorization: `Bearer ${token}` } 
      })
      setStudents(res.data.students)
      setError(null)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch students')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // ========== FILTERS ==========
  const applyFilters = () => {
    let filtered = [...students]
    if (filters.year) filtered = filtered.filter(s => s.year === filters.year)
    if (filters.section) filtered = filtered.filter(s => s.section === filters.section)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(searchLower) ||
        s.email.toLowerCase().includes(searchLower) ||
        (s.studentId && s.studentId.toLowerCase().includes(searchLower))
      )
    }
    setFilteredStudents(filtered)
  }

  const clearFilters = () => {
    setFilters({ year: '', section: '', search: '' })
    setShowFilters(false)
  }

  const getUniqueYears = () => {
    const years = new Set()
    students.forEach(s => { if (s.year) years.add(s.year) })
    return Array.from(years).sort()
  }

  const getUniqueSections = () => {
    const sections = new Set()
    students.forEach(s => { if (s.section) sections.add(s.section) })
    return Array.from(sections).sort()
  }

  // ========== BULK IMPORT ==========
  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      const validExtensions = ['.csv', '.xlsx']
      const fileExt = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase()
      if (!validExtensions.includes(fileExt)) {
        setError('Please upload a CSV or Excel (.xlsx) file')
        setFile(null)
        return
      }
      setFile(selectedFile)
      setError(null)
      setSuccess(null)
    }
  }

  const handleBulkImport = async (e) => {
    e.preventDefault()
    if (!file) {
      setError('Please select a file first')
      return
    }

    setUploading(true)
    setError(null)
    setSuccess(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await axios.post('/api/hod/students/bulk-import', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      })
      
      navigate('/hod/import-results', { 
        state: { results: response.data.results } 
      })
      
    } catch (err) {
      setError(err.response?.data?.message || 'Error importing students')
      console.error(err)
    } finally {
      setUploading(false)
      setFile(null)
      if (formRef.current) formRef.current.reset()
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const downloadTemplate = async () => {
    try {
      const response = await axios.get('/api/hod/download-template', {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'student_import_template.xlsx')
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      setSuccess('Template downloaded successfully!')
    } catch (err) {
      setError('Failed to download template')
      console.error(err)
    }
  }

  // ========== CREATE STUDENT ==========
  const handleInputChange = (e) => {
    setFormValues(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleCreateStudent = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const payload = { ...formValues }
      const res = await axios.post('/api/hod/students', payload, { 
        headers: { Authorization: `Bearer ${token}` } 
      })
      setSuccess(res.data.message || 'Student created successfully!')
      setFormValues({ name: '', email: '', studentId: '', year: '', mobile: '', parentMobile: '', section: '' })
      setShowForm(false)
      await fetchStudents()
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create student')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  // ========== UPDATE STUDENT ==========
  const handleEditStudent = (student) => {
    setSelectedStudent(student)
    setFormValues({
      name: student.name || '',
      email: student.email || '',
      studentId: student.studentId || '',
      year: student.year || '',
      mobile: student.mobile || '',
      parentMobile: student.parentMobile || '',
      section: student.section || ''
    })
    setShowEditModal(true)
  }

  const handleUpdateStudent = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const payload = { 
        name: formValues.name,
        studentId: formValues.studentId,
        year: formValues.year,
        mobile: formValues.mobile,
        parentMobile: formValues.parentMobile,
        section: formValues.section
      }
      const res = await axios.put(`/api/hod/students/${selectedStudent._id}`, payload, { 
        headers: { Authorization: `Bearer ${token}` } 
      })
      setSuccess(res.data.message || 'Student updated successfully!')
      setShowEditModal(false)
      setSelectedStudent(null)
      await fetchStudents()
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update student')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  // ========== DELETE STUDENT ==========
  const confirmDelete = (id) => {
    setDeleteId(id)
    setShowDeleteConfirm(true)
  }

  const handleDeleteStudent = async () => {
    setDeleting(true)
    try {
      await axios.delete(`/api/hod/students/${deleteId}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      })
      setSuccess('Student deleted successfully!')
      setShowDeleteConfirm(false)
      setDeleteId(null)
      await fetchStudents()
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete student')
      console.error(err)
    } finally {
      setDeleting(false)
    }
  }

  // ========== VIEW STUDENT ==========
  const viewStudent = (student) => {
    setSelectedStudent(student)
    setShowViewModal(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const activeFilterCount = Object.keys(filters).filter(key => filters[key]).length

  return (
    <div className="hod-students-pwa">
      {/* ===== HEADER ===== */}
      <div className="hod-students-header">
        <h1><Users size={18} /> Students</h1>
        <button className="hod-students-logout" onClick={handleLogout}>
          Logout
        </button>
      </div>

      {/* ===== MESSAGES ===== */}
      <AnimatePresence>
        {error && (
          <div className="hod-students-message error">
            <AlertCircle size={18} /> {error}
          </div>
        )}
        {success && (
          <div className="hod-students-message success">
            <CheckCircle size={18} /> {success}
          </div>
        )}
      </AnimatePresence>

      {/* ===== QUICK ACTIONS ===== */}
      <div className="hod-students-actions">
        <button 
          className="hod-students-btn primary"
          onClick={() => setShowForm(true)}
        >
          <UserPlus size={18} /> Add
        </button>
        <button 
          className="hod-students-btn secondary"
          onClick={downloadTemplate}
        >
          <Download size={18} /> Template
        </button>
      </div>

      {/* ===== BULK IMPORT ===== */}
      <div className="hod-students-card">
        <div className="hod-students-card-title">
          <Upload size={16} /> Bulk Import
        </div>
        <form ref={formRef} onSubmit={handleBulkImport}>
          <div className="hod-students-upload">
            <input 
              type="file" 
              ref={fileInputRef}
              accept=".csv,.xlsx" 
              onChange={handleFileChange} 
              disabled={uploading}
              className="hod-students-file-input"
              id="bulkFileInput"
            />
            <label htmlFor="bulkFileInput" className="hod-students-file-label">
              {file ? (
                <span className="hod-students-file-name">📄 {file.name}</span>
              ) : (
                <span className="hod-students-file-placeholder">
                  <Upload size={20} /> Click to upload CSV or Excel
                </span>
              )}
            </label>
          </div>
          <div className="hod-students-hint">
            Name, Roll, Email, Mobile, ParentMobile, Year, Branch, Section
          </div>
          <button
            type="submit"
            className="hod-students-import"
            disabled={uploading || !file}
          >
            {uploading ? (
              <>
                <Loader size={18} className="spinning" />
                Importing...
              </>
            ) : (
              <>
                <Upload size={18} />
                Import {file ? `(${file.name})` : ''}
              </>
            )}
          </button>
        </form>
      </div>

      {/* ===== SEARCH & FILTER ===== */}
      <div className="hod-students-search">
        <div className="hod-students-search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search students..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          />
        </div>
        <button
          className={`hod-students-filter-btn ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={16} />
          {activeFilterCount > 0 && (
            <span className="hod-students-filter-badge">{activeFilterCount}</span>
          )}
        </button>
      </div>

      {/* ===== FILTERS PANEL ===== */}
      {showFilters && (
        <div className="hod-students-filters">
          <div className="hod-students-filters-grid">
            <div className="hod-students-filter-group">
              <label>Year</label>
              <select
                value={filters.year}
                onChange={(e) => setFilters(prev => ({ ...prev, year: e.target.value }))}
              >
                <option value="">All</option>
                {getUniqueYears().map(year => (
                  <option key={year} value={year}>Year {year}</option>
                ))}
              </select>
            </div>
            <div className="hod-students-filter-group">
              <label>Section</label>
              <select
                value={filters.section}
                onChange={(e) => setFilters(prev => ({ ...prev, section: e.target.value }))}
              >
                <option value="">All</option>
                {getUniqueSections().map(section => (
                  <option key={section} value={section}>Section {section}</option>
                ))}
              </select>
            </div>
          </div>
          <button className="hod-students-clear" onClick={clearFilters}>
            <X size={14} /> Clear
          </button>
        </div>
      )}

      {/* ===== STUDENT COUNT ===== */}
      <div className="hod-students-count">
        <span>{filteredStudents.length} students</span>
        {loading && <span className="hod-students-spinner"></span>}
      </div>

      {/* ===== STUDENT LIST ===== */}
      {loading && students.length === 0 ? (
        <div className="hod-students-loading">
          <div className="hod-students-spinner-lg"></div>
          <p>Loading students...</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="hod-students-empty">
          <Users size={48} />
          <h4>No students found</h4>
          <p>Add students or adjust filters</p>
        </div>
      ) : (
        <div className="hod-students-list">
          {filteredStudents.slice(0, 20).map((s) => (
            <div key={s._id} className="hod-students-item">
              <div className="hod-students-item-header">
                <span className="hod-students-item-name">{s.name}</span>
                <span className="hod-students-item-id">{s.studentId || '-'}</span>
              </div>
              <div className="hod-students-item-info">
                <span><Mail size={12} /> {s.email}</span>
                <span>Year {s.year || '-'} • Section {s.section || '-'}</span>
                <span><Phone size={12} /> {s.mobile || '-'}</span>
              </div>
              <div className="hod-students-item-actions">
                <span className="hod-students-item-dept">{s.department || 'N/A'}</span>
                <div className="hod-students-item-buttons">
                  <button className="hod-students-icon view" onClick={() => viewStudent(s)} title="View">
                    <Eye size={16} />
                  </button>
                  <button className="hod-students-icon edit" onClick={() => handleEditStudent(s)} title="Edit">
                    <Edit size={16} />
                  </button>
                  <button className="hod-students-icon delete" onClick={() => confirmDelete(s._id)} title="Delete">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filteredStudents.length > 20 && (
            <p className="hod-students-more">Showing 20 of {filteredStudents.length}</p>
          )}
        </div>
      )}

      {/* ===== BOTTOM NAVIGATION ===== */}
      <div className="hod-students-nav">
        <Link to="/hod" className="hod-students-nav-item">
          <Home size={20} />
          <span>Home</span>
        </Link>
        <Link to="/hod/requests" className="hod-students-nav-item">
          <FileText size={20} />
          <span>Requests</span>
        </Link>
        <Link to="/hod/students" className="hod-students-nav-item active">
          <Users size={20} />
          <span>Students</span>
        </Link>
        <Link to="/hod/reports" className="hod-students-nav-item">
          <BarChart3 size={20} />
          <span>Reports</span>
        </Link>
        <Link to="/hod/profile" className="hod-students-nav-item">
          <UserCog size={20} />
          <span>Profile</span>
        </Link>
      </div>

      {/* Add Student Modal - simplified inline styles for demo */}
      {showForm && (
        <div className="hod-students-modal" onClick={() => setShowForm(false)}>
          <div className="hod-students-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="hod-students-modal-header">
              <h3><UserPlus size={20} /> Add Student</h3>
              <button className="hod-students-modal-close" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateStudent}>
              <input name="name" value={formValues.name} onChange={handleInputChange} placeholder="Full Name *" required />
              <input type="email" name="email" value={formValues.email} onChange={handleInputChange} placeholder="Email *" required />
              <input name="studentId" value={formValues.studentId} onChange={handleInputChange} placeholder="Roll Number" />
              <select name="year" value={formValues.year} onChange={handleInputChange}>
                <option value="">Year</option>
                <option value="1">1st</option><option value="2">2nd</option>
                <option value="3">3rd</option><option value="4">4th</option>
              </select>
              <select name="section" value={formValues.section} onChange={handleInputChange}>
                <option value="">Section</option>
                <option value="A">A</option><option value="B">B</option>
                <option value="C">C</option><option value="D">D</option>
              </select>
              <input name="mobile" value={formValues.mobile} onChange={handleInputChange} placeholder="Mobile" />
              <input name="parentMobile" value={formValues.parentMobile} onChange={handleInputChange} placeholder="Parent Mobile" />
              <div className="hod-students-modal-actions">
                <button type="button" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" disabled={saving}>{saving ? 'Creating...' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal - simplified */}
      {showEditModal && (
        <div className="hod-students-modal" onClick={() => setShowEditModal(false)}>
          <div className="hod-students-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="hod-students-modal-header">
              <h3><Edit size={20} /> Edit Student</h3>
              <button className="hod-students-modal-close" onClick={() => setShowEditModal(false)}>✕</button>
            </div>
            <form onSubmit={handleUpdateStudent}>
              <input name="name" value={formValues.name} onChange={handleInputChange} placeholder="Full Name *" required />
              <input type="email" value={formValues.email} disabled placeholder="Email" />
              <input name="studentId" value={formValues.studentId} onChange={handleInputChange} placeholder="Roll Number" />
              <select name="year" value={formValues.year} onChange={handleInputChange}>
                <option value="">Year</option>
                <option value="1">1st</option><option value="2">2nd</option>
                <option value="3">3rd</option><option value="4">4th</option>
              </select>
              <select name="section" value={formValues.section} onChange={handleInputChange}>
                <option value="">Section</option>
                <option value="A">A</option><option value="B">B</option>
                <option value="C">C</option><option value="D">D</option>
              </select>
              <input name="mobile" value={formValues.mobile} onChange={handleInputChange} placeholder="Mobile" />
              <input name="parentMobile" value={formValues.parentMobile} onChange={handleInputChange} placeholder="Parent Mobile" />
              <div className="hod-students-modal-actions">
                <button type="button" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button type="submit" disabled={saving}>{saving ? 'Updating...' : 'Update'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal - simplified */}
      {showViewModal && selectedStudent && (
        <div className="hod-students-modal" onClick={() => setShowViewModal(false)}>
          <div className="hod-students-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="hod-students-modal-header">
              <h3><Eye size={20} /> Student Details</h3>
              <button className="hod-students-modal-close" onClick={() => setShowViewModal(false)}>✕</button>
            </div>
            <div className="hod-students-view">
              <div className="hod-students-view-avatar">{selectedStudent.name?.charAt(0) || 'S'}</div>
              <h4>{selectedStudent.name}</h4>
              <p>{selectedStudent.studentId || 'No ID'}</p>
              <div className="hod-students-view-grid">
                <div><label>Email</label><span>{selectedStudent.email}</span></div>
                <div><label>Mobile</label><span>{selectedStudent.mobile || 'N/A'}</span></div>
                <div><label>Department</label><span>{selectedStudent.department || 'N/A'}</span></div>
                <div><label>Year</label><span>{selectedStudent.year || 'N/A'}</span></div>
                <div><label>Section</label><span>{selectedStudent.section || 'N/A'}</span></div>
                <div><label>Parent Mobile</label><span>{selectedStudent.parentMobile || 'N/A'}</span></div>
              </div>
              <div className="hod-students-modal-actions">
                <button type="button" onClick={() => setShowViewModal(false)}>Close</button>
                <button type="button" onClick={() => { setShowViewModal(false); handleEditStudent(selectedStudent) }}>Edit</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal - simplified */}
      {showDeleteConfirm && (
        <div className="hod-students-modal" onClick={() => setShowDeleteConfirm(false)}>
          <div className="hod-students-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="hod-students-delete">
              <Trash2 size={48} />
              <h3>Confirm Delete</h3>
              <p>Are you sure? This cannot be undone.</p>
              <div className="hod-students-modal-actions">
                <button type="button" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
                <button type="button" className="danger" onClick={handleDeleteStudent} disabled={deleting}>
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}