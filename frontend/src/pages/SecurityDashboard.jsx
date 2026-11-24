// pages/SecurityDashboard.jsx - Fetch stats from backend
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { useNavigate, Link } from 'react-router-dom'
import { FaHome, FaHistory, FaUser, FaSignOutAlt, FaChartLine } from 'react-icons/fa'

// Import CSS
import '../styles/security.css'

export default function SecurityDashboard() {
  const navigate = useNavigate()
  const [scanned, setScanned] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [isValid, setIsValid] = useState(null)
  const [user, setUser] = useState(null)

  useEffect(() => {
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}')
      setUser(userData)
    } catch (e) {}
  }, [])

  useEffect(() => {
    const scanner = new Html5QrcodeScanner('reader', { 
      fps: 10, 
      qrbox: 250 
    })
    scanner.render(onScanSuccess, onScanError)
    return () => { 
      scanner.clear().catch(() => {}) 
    }
  }, [])

  const onScanSuccess = async (decodedText) => {
    if (loading) return
    setScanned(decodedText)
    setLoading(true)
    setIsValid(null)
    
    try {
      const token = localStorage.getItem('token')
      const res = await axios.post('/api/security/scan', 
        { token: decodedText }, 
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      const valid = res.data.valid !== false && res.data.gatepass?.status === 'approved'
      setIsValid(valid)
      setResult(res.data)
      
    } catch (err) {
      console.error(err)
      setIsValid(false)
      const errorMsg = err.response?.data?.message || 'Scan failed'
      setResult({ error: errorMsg })
    } finally {
      setLoading(false)
    }
  }

  const onScanError = (err) => {
    // ignore
  }

  const markExit = async () => {
    if (!result?.gatepass?.passId && !scanned) {
      alert('No pass to mark exit')
      return
    }
    const passId = result?.gatepass?.passId || prompt('Enter Pass ID')
    if (!passId) return
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const res = await axios.post('/api/security/mark-exit', 
        { passId }, 
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      setResult(prev => ({
        ...prev,
        gatepass: { ...prev.gatepass, exitTime: new Date().toISOString() }
      }))
      
      alert('✅ Exit recorded: ' + res.data.exitTime)
    } catch (err) {
      console.error(err)
      alert('❌ Mark exit failed: ' + (err.response?.data?.message || err.message))
    } finally {
      setLoading(false)
    }
  }

  const markEntry = async () => {
    if (!result?.gatepass?.passId && !scanned) {
      alert('No pass to mark entry')
      return
    }
    const passId = result?.gatepass?.passId || prompt('Enter Pass ID')
    if (!passId) return
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const res = await axios.post('/api/security/mark-entry', 
        { passId }, 
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      setResult(prev => ({
        ...prev,
        gatepass: { 
          ...prev.gatepass, 
          entryTime: new Date().toISOString(),
          durationMinutes: res.data.durationMinutes 
        }
      }))
      
      alert('✅ Entry recorded: ' + res.data.entryTime + ' Duration: ' + res.data.durationMinutes + ' mins')
    } catch (err) {
      console.error(err)
      alert('❌ Mark entry failed: ' + (err.response?.data?.message || err.message))
    } finally {
      setLoading(false)
    }
  }

  const manualVerify = async () => {
    if (!scanned) {
      alert('No token input')
      return
    }
    try {
      setLoading(true)
      setIsValid(null)
      const token = localStorage.getItem('token')
      const res = await axios.post('/api/security/scan', 
        { token: scanned }, 
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      const valid = res.data.valid !== false && res.data.gatepass?.status === 'approved'
      setIsValid(valid)
      setResult(res.data)
      
    } catch (err) {
      console.error(err)
      setIsValid(false)
      const errorMsg = err.response?.data?.message || 'Scan failed'
      setResult({ error: errorMsg })
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const getStatusColor = () => {
    if (isValid === null) return ''
    return isValid ? 'valid' : 'invalid'
  }

  return (
    <div className="sec-container">
      {/* Header */}
      <div className="sec-header">
        <h1>🔒 Security</h1>
        <button className="sec-logout" onClick={handleLogout}>
          <FaSignOutAlt size={16} /> Logout
        </button>
      </div>

      {/* Scanner Card */}
      <div className="sec-card">
        <div id="reader" className="sec-scanner"></div>

        {/* Manual Input */}
        <div className="sec-input-group">
          <input 
            className="sec-input" 
            value={scanned} 
            onChange={(e) => setScanned(e.target.value)} 
            placeholder="Enter QR token..."
          />
          <button className="sec-btn sec-btn-primary" onClick={manualVerify} disabled={loading}>
            {loading ? '...' : 'Verify'}
          </button>
        </div>
      </div>

      {/* Result Card */}
      <div className={`sec-card ${getStatusColor()}`}>
        {isValid !== null && (
          <div className={`sec-status-banner ${isValid ? 'valid' : 'invalid'}`}>
            {isValid ? (
              <>
                <span className="sec-status-icon">✅</span>
                <span className="sec-status-text">VALID PASS</span>
              </>
            ) : (
              <>
                <span className="sec-status-icon">❌</span>
                <span className="sec-status-text">INVALID PASS</span>
              </>
            )}
          </div>
        )}

        <h5 className="sec-result-title">Scan Result</h5>
        
        {result ? (
          result.error ? (
            <div className="sec-error">{result.error}</div>
          ) : (
            <div className="sec-result">
              <div className="sec-row">
                <span className="sec-label">Student</span>
                <span className="sec-value">
                  {result.gatepass?.student?.name} ({result.gatepass?.student?.studentId})
                </span>
              </div>
              <div className="sec-row">
                <span className="sec-label">Pass ID</span>
                <span className="sec-value sec-pass">{result.gatepass?.passId}</span>
              </div>
              <div className="sec-row">
                <span className="sec-label">Reason</span>
                <span className="sec-value">{result.gatepass?.reason}</span>
              </div>
              <div className="sec-row">
                <span className="sec-label">Out Time</span>
                <span className="sec-value">
                  {result.gatepass?.outTime ? new Date(result.gatepass.outTime).toLocaleString() : 'N/A'}
                </span>
              </div>
              <div className="sec-row">
                <span className="sec-label">Return</span>
                <span className="sec-value">
                  {result.gatepass?.expectedReturnTime ? new Date(result.gatepass.expectedReturnTime).toLocaleString() : 'N/A'}
                </span>
              </div>
              <div className="sec-row">
                <span className="sec-label">Status</span>
                <span className={`sec-value ${result.gatepass?.status === 'approved' ? 'sec-approved' : 'sec-pending'}`}>
                  {result.gatepass?.status?.toUpperCase() || 'UNKNOWN'}
                </span>
              </div>
              {result.gatepass?.exitTime && (
                <div className="sec-row sec-exit-row">
                  <span className="sec-label">Exit Time</span>
                  <span className="sec-value sec-exit-time">
                    {new Date(result.gatepass.exitTime).toLocaleString()}
                  </span>
                </div>
              )}
              {result.gatepass?.entryTime && (
                <div className="sec-row sec-entry-row">
                  <span className="sec-label">Entry Time</span>
                  <span className="sec-value sec-entry-time">
                    {new Date(result.gatepass.entryTime).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          )
        ) : (
          <div className="sec-empty">No scan yet</div>
        )}

        <div className="sec-actions">
          <button 
            className="sec-btn sec-btn-exit" 
            onClick={markExit} 
            disabled={loading || !result || result?.gatepass?.exitTime}
          >
            🚪 Exit
          </button>
          <button 
            className="sec-btn sec-btn-entry" 
            onClick={markEntry} 
            disabled={loading || !result || !result?.gatepass?.exitTime || result?.gatepass?.entryTime}
          >
            🚶 Entry
          </button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="sec-nav">
        <Link to="/security" className="sec-nav-item active">
          <FaHome size={18} />
          <span>Scan</span>
        </Link>
        <Link to="/security/history" className="sec-nav-item">
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