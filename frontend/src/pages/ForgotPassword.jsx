// src/pages/ForgotPassword.jsx
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { FaEnvelope, FaSpinner, FaArrowLeft } from 'react-icons/fa'
import { motion } from 'framer-motion'

export default function ForgotPassword() {
  const { register, handleSubmit, formState: { errors } } = useForm()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const onSubmit = async (data) => {
    setLoading(true)
    setError('')
    try {
      await axios.post('/api/auth/forgot-password', { email: data.email })
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="forgot-password-wrapper">
      <div className="forgot-password-container">
        <Link to="/login" className="back-to-login">
          <FaArrowLeft /> Back to Login
        </Link>

        <motion.div 
          className="forgot-password-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="forgot-password-header">
            <div className="forgot-icon">🔐</div>
            <h1>Forgot Password?</h1>
            <p>Enter your email to receive reset instructions</p>
          </div>

          {error && <div className="error-alert">{error}</div>}
          
          {success ? (
            <div className="success-message">
              <div className="success-icon">✅</div>
              <h3>Email Sent!</h3>
              <p>Check your email for password reset instructions</p>
              <Link to="/login" className="btn-back-login">Back to Login</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="forgot-form">
              <div className="form-group">
                <label>Email Address</label>
                <div className="input-wrapper">
                  <FaEnvelope className="input-icon" />
                  <input 
                    type="email"
                    placeholder="Enter your registered email"
                    {...register('email', { 
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                  />
                </div>
                {errors.email && <span className="field-error">{errors.email.message}</span>}
              </div>

              <button type="submit" className="reset-btn" disabled={loading}>
                {loading ? <><FaSpinner className="spinner" /> Sending...</> : 'Send Reset Link'}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  )
}