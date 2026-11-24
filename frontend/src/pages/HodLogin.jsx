// src/pages/HodLogin.jsx
import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import axios from 'axios'
import { useNavigate, Link } from 'react-router-dom'
import { FaIdBadge, FaLock, FaSpinner, FaEye, FaEyeSlash, FaUserShield, FaArrowLeft } from 'react-icons/fa'
import { motion } from 'framer-motion'

export default function HodLogin() {
  const { register, handleSubmit, formState: { errors } } = useForm()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [show2FA, setShow2FA] = useState(false)
  const [twoFACode, setTwoFACode] = useState('')
  const [tempToken, setTempToken] = useState('')

  const onSubmit = async (data) => {
    setLoading(true)
    setError('')
    
    try {
      const res = await axios.post('/api/auth/hod-login', {
        employeeId: data.employeeId,
        password: data.password
      })
      
      // If 2FA enabled
      if (res.data.require2FA) {
        setTempToken(res.data.tempToken)
        setShow2FA(true)
        setLoading(false)
        return
      }
      
      // Normal login
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      navigate('/hod')
      
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials')
      setLoading(false)
    }
  }

  const handle2FA = async () => {
    try {
      const res = await axios.post('/api/auth/verify-2fa', {
        tempToken: tempToken,
        code: twoFACode
      })
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      navigate('/hod')
    } catch (err) {
      setError('Invalid 2FA code')
    }
  }

  return (
    <div className="hod-login-wrapper">
      <div className="hod-login-container">
        <Link to="/" className="back-to-home">
          <FaArrowLeft /> Back to Home
        </Link>
        
        <motion.div 
          className="hod-login-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="hod-login-header">
            <div className="hod-login-icon">
              <FaUserShield size={32} />
            </div>
            <h1>HOD Login</h1>
            <p>Department Head Access Portal</p>
          </div>

          {error && (
            <div className="error-alert">{error}</div>
          )}

          {!show2FA ? (
            <form onSubmit={handleSubmit(onSubmit)} className="hod-login-form">
              <div className="form-group">
                <label>Employee ID</label>
                <div className="input-wrapper">
                  <FaIdBadge className="input-icon" />
                  <input 
                    type="text"
                    placeholder="Enter your Employee ID"
                    {...register('employeeId', { required: 'Employee ID is required' })}
                  />
                </div>
                {errors.employeeId && <span className="field-error">{errors.employeeId.message}</span>}
              </div>

              <div className="form-group">
                <label>Password</label>
                <div className="input-wrapper">
                  <FaLock className="input-icon" />
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    {...register('password', { required: 'Password is required' })}
                  />
                  <button 
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {errors.password && <span className="field-error">{errors.password.message}</span>}
              </div>

              <div className="form-options">
                <Link to="/forgot-password" className="forgot-link">Forgot Password?</Link>
              </div>

              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? <><FaSpinner className="spinner" /> Signing in...</> : 'Sign In'}
              </button>
            </form>
          ) : (
            <div className="twofa-section">
              <h3>Two-Factor Authentication</h3>
              <p>Enter the 6-digit code sent to your registered email</p>
              <div className="twofa-input">
                <input 
                  type="text"
                  maxLength="6"
                  placeholder="123456"
                  value={twoFACode}
                  onChange={(e) => setTwoFACode(e.target.value)}
                />
              </div>
              <button className="verify-btn" onClick={handle2FA}>Verify</button>
            </div>
          )}

          <div className="hod-login-footer">
            <p>Secure access for department heads only</p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}