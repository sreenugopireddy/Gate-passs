// src/components/Navbar.jsx - Updated with working notification
import React, { useEffect, useState, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { io } from 'socket.io-client'
import { 
  FaHome, 
  FaSignOutAlt, 
  FaBell, 
  FaBars,
  FaTimes,
  FaGraduationCap,
  FaChartBar,
  FaUsers,
  FaFileAlt,
  FaUserCog,
  FaShieldAlt,
  FaExclamationTriangle,
  FaClipboardList,
  FaUser,
  FaQrcode,
  FaHistory,
  FaChartLine,
  FaCheckCircle,
  FaTimesCircle
} from 'react-icons/fa'
import { motion, AnimatePresence } from 'framer-motion'
import RequestNotification from './RequestNotification'

// Import CSS
import '../styles/navbar.css'

export default function Navbar() {
  const [user, setUser] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  
  // Popup notification states
  const [popupNotification, setPopupNotification] = useState(null)
  const [showPopup, setShowPopup] = useState(false)
  
  const navigate = useNavigate()
  const location = useLocation()
  const dropdownRef = useRef(null)
  const notificationRef = useRef(null)

  // Load user from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('user')
      if (raw) {
        const userData = JSON.parse(raw)
        setUser(userData)
      }
    } catch (e) { 
      setUser(null) 
    }
  }, [])

  // Socket.io connection for real-time notifications
  useEffect(() => {
    if (!user) return

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'
    
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    // Handle new request
    const handleNewRequest = (payload) => {
      console.log('📢 New request received:', payload)
      
      // Filter by department for HOD
      if (user.role === 'hod' && payload.department && payload.department !== user.department) {
        console.log('⏭️ Skipping - different department')
        return
      }

      // Add to notification list
      setNotifications(prev => {
        const newNotif = { 
          id: Date.now() + Math.random(), 
          ...payload, 
          read: false,
          timestamp: new Date()
        }
        return [newNotif, ...prev].slice(0, 50)
      })
      setUnreadCount(prev => prev + 1)

      // ✅ SHOW POPUP NOTIFICATION (For HOD only)
      if (user.role === 'hod') {
        console.log('🔔 Showing popup notification for HOD')
        
        // Prepare student data
        const studentData = {
          name: payload.studentName || payload.student?.name || 'Unknown Student',
          studentId: payload.studentId || payload.student?.studentId || 'N/A',
          department: payload.department || payload.student?.department || 'N/A',
          photoUrl: payload.student?.photoUrl || null
        }
        
        setPopupNotification({
          ...payload,
          _id: payload.id || payload._id,
          student: studentData,
          id: payload.id || payload._id
        })
        setShowPopup(true)
      }
    }

    socket.on('new-request', handleNewRequest)
    socket.on('emergency-request', (payload) => {
      handleNewRequest({ ...payload, emergency: true })
    })
    socket.on('request-approved', (payload) => {
      setNotifications(prev => {
        const newNotif = { 
          id: Date.now() + Math.random(), 
          ...payload, 
          read: false,
          timestamp: new Date(),
          type: 'approved'
        }
        return [newNotif, ...prev].slice(0, 50)
      })
      setUnreadCount(prev => prev + 1)
    })
    socket.on('request-rejected', (payload) => {
      setNotifications(prev => {
        const newNotif = { 
          id: Date.now() + Math.random(), 
          ...payload, 
          read: false,
          timestamp: new Date(),
          type: 'rejected'
        }
        return [newNotif, ...prev].slice(0, 50)
      })
      setUnreadCount(prev => prev + 1)
    })

    return () => { 
      if (socket) {
        socket.disconnect()
      }
    }
  }, [user])

  // Click outside handlers for dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setNotifications([])
    setUnreadCount(0)
    navigate('/login')
  }

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  // Get user initials for avatar
  const getInitials = (name) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Check if a route is active
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  // Get navigation items based on user role
  const getNavItems = () => {
    if (!user) return []

    const items = {
      student: [
        { label: 'Home', path: '/student', icon: FaHome },
        { label: 'Apply', path: '/student/apply', icon: FaClipboardList },
        { label: 'History', path: '/student/history', icon: FaHistory },
        { label: 'Profile', path: '/student/profile', icon: FaUser }
      ],
      hod: [
        { label: 'Home', path: '/hod', icon: FaHome },
        { label: 'Requests', path: '/hod/requests', icon: FaClipboardList },
        { label: 'Students', path: '/hod/students', icon: FaUsers },
        { label: 'Reports', path: '/hod/reports', icon: FaFileAlt },
        { label: 'Profile', path: '/hod/profile', icon: FaUserCog }
      ],
      security: [
        { label: 'Scan', path: '/security', icon: FaQrcode },
        { label: 'History', path: '/security/history', icon: FaHistory },
        { label: 'Analytics', path: '/security/analytics', icon: FaChartLine },
        { label: 'Profile', path: '/security/profile', icon: FaUser }
      ],
      admin: [
        { label: 'Students', path: '/admin/students', icon: FaUsers }
      ]
    }

    return items[user.role] || []
  }

  const navItems = getNavItems()

  return (
    <>
      {/* Popup Notification */}
      {showPopup && popupNotification && (
        <RequestNotification 
          request={popupNotification}
          onClose={() => {
            setShowPopup(false)
            setPopupNotification(null)
          }}
        />
      )}

      <nav className="navbar-glass">
        <div className="navbar-glass-container">
          {/* Left: Brand */}
          <Link to="/" className="navbar-glass-brand">
            <div className="glass-brand-icon">
              <FaGraduationCap size={18} />
            </div>
            <span className="glass-brand-text">SMVEC GATE PASS</span>
            <span className="glass-brand-version">v2.0</span>
          </Link>

          {/* Center: Navigation Links (Desktop) */}
          <div className="glass-nav-links">
            {user && navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`glass-nav-link ${isActive(item.path) ? 'active' : ''}`}
              >
                <item.icon size={16} />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          {/* Right: Actions */}
          <div className="glass-nav-actions">
            {user ? (
              <>
                {/* Notifications */}
                <div className="glass-notif-wrapper" ref={notificationRef}>
                  <button
                    className={`glass-notif-btn ${unreadCount > 0 ? 'has-unread' : ''}`}
                    onClick={() => {
                      setShowNotifications(!showNotifications)
                      setShowDropdown(false)
                    }}
                    aria-label="Notifications"
                  >
                    <FaBell size={18} />
                    {unreadCount > 0 && (
                      <span className="glass-notif-badge">{unreadCount}</span>
                    )}
                  </button>

                  <AnimatePresence>
                    {showNotifications && (
                      <motion.div
                        className="glass-notif-dropdown"
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="glass-notif-header">
                          <span className="glass-notif-title">Notifications</span>
                          {notifications.length > 0 && (
                            <button className="glass-mark-read" onClick={markAllAsRead}>
                              Mark all read
                            </button>
                          )}
                        </div>
                        <div className="glass-notif-list">
                          {notifications.length === 0 ? (
                            <div className="glass-notif-empty">No notifications</div>
                          ) : (
                            notifications.slice(0, 10).map((n) => (
                              <div key={n.id} className="glass-notif-item">
                                <div className="glass-notif-icon">
                                  {n.emergency ? (
                                    <FaExclamationTriangle className="text-danger" />
                                  ) : n.type === 'approved' ? (
                                    <FaCheckCircle className="text-success" />
                                  ) : n.type === 'rejected' ? (
                                    <FaTimesCircle className="text-danger" />
                                  ) : (
                                    <FaBell className="text-info" />
                                  )}
                                </div>
                                <div className="glass-notif-content">
                                  <div className="glass-notif-message">
                                    <span className="glass-notif-pass">{n.passId}</span>
                                    {n.emergency && (
                                      <span className="glass-emergency-badge">EMERGENCY</span>
                                    )}
                                    {n.type === 'approved' && (
                                      <span className="glass-approved-badge">APPROVED</span>
                                    )}
                                    {n.type === 'rejected' && (
                                      <span className="glass-rejected-badge">REJECTED</span>
                                    )}
                                    <span className="glass-notif-dept">{n.department}</span>
                                  </div>
                                  <span className="glass-notif-time">
                                    {n.timestamp ? new Date(n.timestamp).toLocaleTimeString() : 'Just now'}
                                  </span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* User Menu */}
                <div className="glass-user-wrapper" ref={dropdownRef}>
                  <button
                    className="glass-user-btn"
                    onClick={() => {
                      setShowDropdown(!showDropdown)
                      setShowNotifications(false)
                    }}
                    aria-label="User menu"
                  >
                    <div className="glass-user-avatar">
                      {user?.photoUrl ? (
                        <img src={user.photoUrl} alt={user.name} />
                      ) : (
                        <span className="glass-avatar-text">{getInitials(user.name)}</span>
                      )}
                    </div>
                    <span className="glass-user-name">{user?.name?.split(' ')[0] || 'User'}</span>
                    <span className="glass-user-role">{user?.role}</span>
                  </button>

                  <AnimatePresence>
                    {showDropdown && (
                      <motion.div
                        className="glass-user-dropdown"
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="glass-dropdown-header">
                          <div className="glass-dropdown-avatar">
                            {user?.photoUrl ? (
                              <img src={user.photoUrl} alt={user.name} />
                            ) : (
                              <span>{getInitials(user.name)}</span>
                            )}
                          </div>
                          <div className="glass-dropdown-info">
                            <span className="glass-dropdown-name">{user?.name}</span>
                            <span className="glass-dropdown-email">{user?.email}</span>
                            <span className="glass-dropdown-role">{user?.role}</span>
                          </div>
                        </div>
                        <div className="glass-dropdown-divider" />
                        <div className="glass-dropdown-items">
                          <Link to="/change-password" className="glass-dropdown-item" onClick={() => setShowDropdown(false)}>
                            <FaUserCog /> Change Password
                          </Link>
                          <button className="glass-dropdown-item logout" onClick={handleLogout}>
                            <FaSignOutAlt /> Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Mobile Menu Toggle */}
                <button
                  className="glass-mobile-toggle"
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  aria-label="Toggle menu"
                >
                  {showMobileMenu ? <FaTimes size={20} /> : <FaBars size={20} />}
                </button>
              </>
            ) : (
              <Link to="/login" className="glass-login-btn">
                Sign In
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {showMobileMenu && user && (
            <motion.div
              className="glass-mobile-menu"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="glass-mobile-items">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`glass-mobile-link ${isActive(item.path) ? 'active' : ''}`}
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <item.icon size={18} />
                    <span>{item.label}</span>
                  </Link>
                ))}
                <div className="glass-mobile-divider" />
                <Link to="/change-password" className="glass-mobile-link" onClick={() => setShowMobileMenu(false)}>
                  <FaUserCog size={18} />
                  <span>Change Password</span>
                </Link>
                <button className="glass-mobile-logout" onClick={handleLogout}>
                  <FaSignOutAlt /> Sign Out
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  )
}