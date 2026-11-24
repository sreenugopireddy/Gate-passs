// src/components/RequestNotification.jsx
import React, { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FaUser, FaIdCard, FaClock, FaMapMarkerAlt, 
  FaExclamationTriangle, FaTimes, FaBell,
  FaCheckCircle, FaVolumeUp
} from 'react-icons/fa'

// Import CSS
import '../styles/notification.css'

// Play notification sound using Web Audio API
const playNotificationSound = () => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    
    // First beep - higher pitch
    const oscillator1 = audioContext.createOscillator()
    const gainNode1 = audioContext.createGain()
    oscillator1.connect(gainNode1)
    gainNode1.connect(audioContext.destination)
    oscillator1.frequency.value = 880
    oscillator1.type = 'sine'
    gainNode1.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
    oscillator1.start(audioContext.currentTime)
    oscillator1.stop(audioContext.currentTime + 0.3)
    
    // Second beep - lower pitch
    setTimeout(() => {
      const oscillator2 = audioContext.createOscillator()
      const gainNode2 = audioContext.createGain()
      oscillator2.connect(gainNode2)
      gainNode2.connect(audioContext.destination)
      oscillator2.frequency.value = 660
      oscillator2.type = 'sine'
      gainNode2.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4)
      oscillator2.start(audioContext.currentTime)
      oscillator2.stop(audioContext.currentTime + 0.4)
    }, 200)
    
    // Third beep - even lower
    setTimeout(() => {
      const oscillator3 = audioContext.createOscillator()
      const gainNode3 = audioContext.createGain()
      oscillator3.connect(gainNode3)
      gainNode3.connect(audioContext.destination)
      oscillator3.frequency.value = 440
      oscillator3.type = 'sine'
      gainNode3.gain.setValueAtTime(0.2, audioContext.currentTime)
      gainNode3.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4)
      oscillator3.start(audioContext.currentTime)
      oscillator3.stop(audioContext.currentTime + 0.4)
    }, 450)
    
    return true
  } catch (err) {
    console.log('Sound not available')
    return false
  }
}

// Text-to-Speech function
const speakStudentDetails = (studentName, studentId, department, isEmergency) => {
  try {
    if (!window.speechSynthesis) {
      console.log('Speech synthesis not supported')
      return
    }

    window.speechSynthesis.cancel()

    let message = `New gate pass request from ${studentName}`
    
    if (studentId && studentId !== 'N/A') {
      message += `, Student ID ${studentId}`
    }
    
    if (department && department !== 'N/A') {
      message += `, Department of ${department}`
    }
    
    if (isEmergency) {
      message = `🚨 Emergency! ${message}`
    }

    const utterance = new SpeechSynthesisUtterance(message)
    utterance.rate = 0.9
    utterance.pitch = 1.1
    utterance.volume = 1
    
    const voices = window.speechSynthesis.getVoices()
    const preferredVoice = voices.find(voice => 
      voice.lang.startsWith('en') && voice.name.includes('Female')
    ) || voices.find(voice => voice.lang.startsWith('en'))
    
    if (preferredVoice) {
      utterance.voice = preferredVoice
    }

    window.speechSynthesis.speak(utterance)
    console.log('🔊 Speaking:', message)
    
  } catch (err) {
    console.log('Speech synthesis error:', err)
  }
}

export default function RequestNotification({ request, onClose }) {
  const [isVisible, setIsVisible] = useState(true)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [soundPlayed, setSoundPlayed] = useState(false)
  const [speechStarted, setSpeechStarted] = useState(false)
  const speechTimeoutRef = useRef(null)
  const soundTimeoutRef = useRef(null)

  // ✅ Play sound and speak only once when notification appears
  useEffect(() => {
    // Play sound only once
    if (!soundPlayed) {
      setSoundPlayed(true)
      
      // Play sound with a slight delay to ensure audio context starts
      soundTimeoutRef.current = setTimeout(() => {
        playNotificationSound()
      }, 200)
    }

    // Speak student details only once
    if (!speechStarted) {
      setSpeechStarted(true)
      
      // Wait for sound to finish before speaking (1.5 seconds)
      speechTimeoutRef.current = setTimeout(() => {
        const studentName = request.student?.name || request.studentName || 'Unknown Student'
        const studentId = request.student?.studentId || request.studentId || 'N/A'
        const department = request.student?.department || request.department || 'N/A'
        const isEmergency = request.emergency || false
        
        setIsSpeaking(true)
        speakStudentDetails(studentName, studentId, department, isEmergency)
        
        // Reset speaking state after speech ends
        setTimeout(() => {
          setIsSpeaking(false)
        }, 5000)
      }, 1200) // Wait 1.2 seconds for sound to complete
    }

    // ✅ NO AUTO-CLOSE - Only close when user clicks

    return () => {
      // Cleanup timeouts
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current)
      }
      if (soundTimeoutRef.current) {
        clearTimeout(soundTimeoutRef.current)
      }
      // Cancel speech on unmount
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, []) // Empty dependency array - run only once

  // ✅ Handle close - ONLY when user clicks
  const handleClose = () => {
    // Cancel speech
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    // Clear timeouts
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current)
    }
    if (soundTimeoutRef.current) {
      clearTimeout(soundTimeoutRef.current)
    }
    setIsVisible(false)
    setTimeout(onClose, 300)
  }

  // ✅ Handle View button
  const handleView = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    handleClose()
    if (request.id || request._id) {
      const requestId = request.id || request._id
      window.location.href = `/hod/request/${requestId}`
    }
  }

  // ✅ Replay speech
  const handleReplaySpeech = () => {
    const studentName = request.student?.name || request.studentName || 'Unknown Student'
    const studentId = request.student?.studentId || request.studentId || 'N/A'
    const department = request.student?.department || request.department || 'N/A'
    const isEmergency = request.emergency || false
    
    // Cancel any ongoing speech
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    
    setIsSpeaking(true)
    speakStudentDetails(studentName, studentId, department, isEmergency)
    
    setTimeout(() => {
      setIsSpeaking(false)
    }, 5000)
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="notification-overlay">
          <motion.div 
            className={`notification-popup ${request.emergency ? 'emergency' : ''}`}
            initial={{ scale: 0.8, y: 50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, y: 50, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          >
            {/* Header */}
            <div className="notification-header">
              <div className="notification-header-left">
                <div className="notification-bell">
                  <FaBell />
                </div>
                <div>
                  <span className="notification-title">
                    New Gate Pass Request
                  </span>
                  {request.emergency && (
                    <span className="notification-emergency-badge">
                      <FaExclamationTriangle /> EMERGENCY
                    </span>
                  )}
                </div>
              </div>
              <div className="notification-header-actions">
                {/* Replay Speech Button */}
                <button 
                  className="notification-speak-btn" 
                  onClick={handleReplaySpeech}
                  title="Repeat announcement"
                >
                  <FaVolumeUp />
                </button>
                <button className="notification-close" onClick={handleClose}>
                  <FaTimes />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="notification-body">
              {/* Student Info */}
              <div className="notification-student">
                <div className="notification-avatar">
                  {request.student?.photoUrl ? (
                    <img src={request.student.photoUrl} alt={request.student.name} />
                  ) : (
                    <span>{request.student?.name?.charAt(0) || request.studentName?.charAt(0) || 'S'}</span>
                  )}
                </div>
                <div className="notification-student-info">
                  <h4>{request.student?.name || request.studentName || 'Unknown Student'}</h4>
                  <span className="student-id">ID: {request.student?.studentId || request.studentId || 'N/A'}</span>
                  <span className="student-dept">{request.student?.department || request.department || 'N/A'}</span>
                  {isSpeaking && (
                    <span className="speaking-indicator">
                      <span className="speaking-dot"></span>
                      <span className="speaking-dot"></span>
                      <span className="speaking-dot"></span>
                      <span className="speaking-text">Speaking...</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Pass Details */}
              <div className="notification-details">
                <div className="notification-detail-item">
                  <FaIdCard className="detail-icon" />
                  <div>
                    <span className="detail-label">Pass ID</span>
                    <span className="detail-value">{request.passId}</span>
                  </div>
                </div>
                <div className="notification-detail-item">
                  <FaMapMarkerAlt className="detail-icon" />
                  <div>
                    <span className="detail-label">Destination</span>
                    <span className="detail-value">{request.destination}</span>
                  </div>
                </div>
                <div className="notification-detail-item">
                  <FaClock className="detail-icon" />
                  <div>
                    <span className="detail-label">Out Time</span>
                    <span className="detail-value">
                      {request.outTime ? new Date(request.outTime).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="notification-actions">
                <button className="btn-view-request" onClick={handleView}>
                  <FaCheckCircle /> View & Approve
                </button>
                <button className="btn-dismiss" onClick={handleClose}>
                  Dismiss
                </button>
              </div>
            </div>

            {/* Emergency Flash */}
            {request.emergency && (
              <div className="notification-emergency-flash" />
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}