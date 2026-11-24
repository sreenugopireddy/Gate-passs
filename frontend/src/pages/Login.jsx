// src/pages/Login.jsx - Clean Modern Design (Mobile PWA + Web)
import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { FaEnvelope, FaLock, FaIdBadge, FaSpinner, FaEye, FaEyeSlash, FaGraduationCap, FaUserShield } from 'react-icons/fa'
import { motion, AnimatePresence } from 'framer-motion'

// Import CSS
import '../styles/login.css'

export default function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showDemo, setShowDemo] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  // Load saved email
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail')
    if (savedEmail) {
      setRememberMe(true)
      setTimeout(() => {
        const emailInput = document.querySelector('[name="email"]')
        if (emailInput) emailInput.value = savedEmail
      }, 100)
    }
  }, [])

  const onSubmit = async (data) => {
    setLoading(true)
    setError('')
    
    try {
      const res = await axios.post('/api/auth/login', {
        email: data.email,
        password: data.password,
        employeeId: data.employeeId || undefined
      })
      
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', data.email)
      } else {
        localStorage.removeItem('rememberedEmail')
      }
      
      if (res.data.user?.forcePasswordChange) {
        navigate('/change-password')
        return
      }
      
      const role = res.data.user?.role
      const redirectMap = {
        'student': '/student',
        'hod': '/hod',
        'security': '/security',
        'admin': '/admin'
      }
      navigate(redirectMap[role] || '/student')
      
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = (role) => {
    const demos = {
      admin: { email: 'admin@college.edu', password: 'password123' },
      hod: { email: 'hod@college.edu', password: 'password123' },
      security: { email: 'security@college.edu', password: 'password123' },
      student: { email: 'student@college.edu', password: 'password123' }
    }
    const creds = demos[role]
    if (creds) {
      document.querySelector('[name="email"]').value = creds.email
      document.querySelector('[name="password"]').value = creds.password
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Left Brand Section - Hidden on mobile */}
        <div className="login-brand">
          <div className="login-brand-content">
            <div className="login-brand-icon">
              <FaGraduationCap size={36} />
            </div>
            <h1 className="login-brand-title">GatePass</h1>
            <p className="login-brand-subtitle">Smart College Gate Pass<br />Management System</p>
            <div className="login-brand-features">
              <span className="login-feature">🔐 Secure</span>
              <span className="login-feature">⚡ Real-time</span>
              <span className="login-feature">📱 QR Code</span>
            </div>
          </div>
        </div>

        {/* Right Form Section */}
        <div className="login-form-section">
          <motion.div 
            className="login-form-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Mobile Logo - Shows only on mobile */}
            <div className="login-mobile-logo">
              <div className="login-mobile-icon">
                <FaGraduationCap size={28} />
              </div>
              <h2>GatePass</h2>
            </div>

            <div className="login-form-header">
              <h2>Welcome Back</h2>
              <p>Sign in to continue to your dashboard</p>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div 
                  className="login-error"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <span className="login-error-icon">⚠️</span>
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit(onSubmit)} className="login-form">
              {/* Employee ID */}
              <div className="login-field">
                <label className="login-label">Employee ID <span className="login-optional">(Optional for HOD)</span></label>
                <div className="login-input-group">
                  <FaIdBadge className="login-input-icon" />
                  <input 
                    type="text"
                    className="login-input"
                    placeholder="Enter Employee ID"
                    {...register('employeeId')}
                  />
                </div>
              </div>

              {/* Email */}
              <div className="login-field">
                <label className="login-label">Email Address</label>
                <div className="login-input-group">
                  <FaEnvelope className="login-input-icon" />
                  <input 
                    type="email"
                    className={`login-input ${errors.email ? 'error' : ''}`}
                    placeholder="you@example.com"
                    {...register('email', { 
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                  />
                </div>
                {errors.email && <span className="login-field-error">{errors.email.message}</span>}
              </div>

              {/* Password */}
              <div className="login-field">
                <label className="login-label">Password</label>
                <div className="login-input-group">
                  <FaLock className="login-input-icon" />
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    className={`login-input ${errors.password ? 'error' : ''}`}
                    placeholder="Enter your password"
                    {...register('password', { 
                      required: 'Password is required',
                      minLength: {
                        value: 6,
                        message: 'Password must be at least 6 characters'
                      }
                    })}
                  />
                  <button 
                    type="button"
                    className="login-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                  </button>
                </div>
                {errors.password && <span className="login-field-error">{errors.password.message}</span>}
              </div>

              {/* Options */}
              <div className="login-options">
                <label className="login-checkbox">
                  <input 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span className="login-checkbox-mark"></span>
                  Remember me
                </label>
                <a href="/forgot-password" className="login-forgot">Forgot password?</a>
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                className="login-submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <FaSpinner className="login-spinner" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* Demo Credentials Toggle */}
            <button 
              className="login-demo-toggle"
              onClick={() => setShowDemo(!showDemo)}
            >
              {showDemo ? 'Hide' : 'Show'} demo credentials
            </button>

            <AnimatePresence>
              {showDemo && (
                <motion.div 
                  className="login-demo-grid"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <button className="login-demo-chip admin" onClick={() => fillDemo('admin')}>
                    <span className="login-demo-role">Admin</span>
                    <span className="login-demo-email">admin@college.edu</span>
                  </button>
                  <button className="login-demo-chip hod" onClick={() => fillDemo('hod')}>
                    <span className="login-demo-role">HOD</span>
                    <span className="login-demo-email">hod@college.edu</span>
                  </button>
                  <button className="login-demo-chip security" onClick={() => fillDemo('security')}>
                    <span className="login-demo-role">Security</span>
                    <span className="login-demo-email">security@college.edu</span>
                  </button>
                  <button className="login-demo-chip student" onClick={() => fillDemo('student')}>
                    <span className="login-demo-role">Student</span>
                    <span className="login-demo-email">student@college.edu</span>
                  </button>
                  <div className="login-demo-hint">Password: <code>password123</code></div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="login-footer">
              <p>© 2026 GatePass System. All rights reserved.</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}