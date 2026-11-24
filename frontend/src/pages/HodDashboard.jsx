// src/pages/HodDashboard.jsx - PWA Mobile View
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Link, useNavigate } from 'react-router-dom'
import { 
  Users, Clock, CheckCircle, XCircle, AlertTriangle, 
  MapPin, TrendingUp, Calendar, FileText, Home,
  UserCog, Bell, Menu, X, LogOut, LayoutDashboard,
  UserPlus, FileSpreadsheet, BarChart3
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'

// Import PWA CSS

import '../styles/hod.css'

export default function HodDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [user, setUser] = useState(null)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [chartData, setChartData] = useState({
    daily: [],
    monthly: [],
    reasons: [],
    emergency: []
  })

  const token = localStorage.getItem('token')

  useEffect(() => {
    // Get user info
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}')
      setUser(userData)
    } catch (e) {}
    
    fetchDashboardData()
    fetchPendingRequests()
    fetchChartData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const res = await axios.get('/api/hod/dashboard', { 
        headers: { Authorization: `Bearer ${token}` } 
      })
      setStats(res.data)
    } catch (err) {
      setError('Failed to load dashboard')
      console.error(err)
    }
  }

  const fetchPendingRequests = async () => {
    try {
      const res = await axios.get('/api/hod/requests/pending', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setPending(res.data.pending || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchChartData = async () => {
    try {
      setChartData({
        daily: [
          { date: 'Mon', requests: 12 },
          { date: 'Tue', requests: 19 },
          { date: 'Wed', requests: 15 },
          { date: 'Thu', requests: 22 },
          { date: 'Fri', requests: 18 },
          { date: 'Sat', requests: 8 },
          { date: 'Sun', requests: 5 }
        ],
        monthly: [
          { month: 'Jan', approved: 45, rejected: 12 },
          { month: 'Feb', approved: 52, rejected: 8 },
          { month: 'Mar', approved: 38, rejected: 15 },
          { month: 'Apr', approved: 61, rejected: 10 },
          { month: 'May', approved: 48, rejected: 6 },
          { month: 'Jun', approved: 55, rejected: 9 }
        ],
        reasons: [
          { name: 'Medical', value: 35 },
          { name: 'Personal', value: 25 },
          { name: 'Family', value: 20 },
          { name: 'Placement', value: 12 },
          { name: 'Academic', value: 8 }
        ],
        emergency: [
          { category: 'Medical', count: 15 },
          { category: 'Family', count: 10 },
          { category: 'Accident', count: 5 },
          { category: 'Other', count: 8 }
        ]
      })
    } catch (err) {
      console.error(err)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const StatCard = ({ title, value, icon, color, subtitle }) => (
    <motion.div 
      className="hod-pwa-stat-card"
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      style={{ borderLeftColor: color }}
    >
      <div className={`hod-pwa-stat-icon ${color}`}>
        {icon}
      </div>
      <div className="hod-pwa-stat-value">{value}</div>
      <div className="hod-pwa-stat-label">{title}</div>
      {subtitle && <span className="stat-subtitle">{subtitle}</span>}
    </motion.div>
  )

  const COLORS = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe']

  return (
    <div className="hod-pwa-container">
      {/* Header */}
      <div className="hod-pwa-header">
        <h1>
          <LayoutDashboard size={18} /> Dashboard
        </h1>
        <div className="hod-pwa-header-actions">
          <span className="user-name">{user?.name || 'HOD'}</span>
          <button 
            className="hod-pwa-logout" 
            onClick={handleLogout}
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="error-alert" style={{ marginBottom: '14px' }}>
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="hod-pwa-stats-grid">
        <StatCard 
          title="Students" 
          value={stats?.totalStudents || 0} 
          icon={<Users size={16} />}
          color="blue"
        />
        <StatCard 
          title="Pending" 
          value={stats?.totalPending || 0} 
          icon={<Clock size={16} />}
          color="yellow"
          subtitle={`${stats?.emergencyRequests || 0} Emergency`}
        />
        <StatCard 
          title="Approved" 
          value={stats?.approvedToday || 0} 
          icon={<CheckCircle size={16} />}
          color="green"
        />
        <StatCard 
          title="Rejected" 
          value={stats?.rejectedToday || 0} 
          icon={<XCircle size={16} />}
          color="red"
        />
        <StatCard 
          title="Emergency" 
          value={stats?.emergencyRequests || 0} 
          icon={<AlertTriangle size={16} />}
          color="red"
        />
        <StatCard 
          title="Outside" 
          value={stats?.studentsOutside || 0} 
          icon={<MapPin size={16} />}
          color="blue"
        />
        <StatCard 
          title="Avg Approval" 
          value={`${stats?.avgApproval || 0}m`} 
          icon={<TrendingUp size={16} />}
          color="purple"
        />
        <StatCard 
          title="Monthly" 
          value={stats?.monthlyCount || 0} 
          icon={<Calendar size={16} />}
          color="orange"
        />
      </div>

      {/* Charts Section */}
      <div className="hod-pwa-card">
        <div className="hod-pwa-card-header">
          <span className="hod-pwa-card-title">📊 Daily Requests</span>
        </div>
        <div className="hod-pwa-chart-container">
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData.daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="date" stroke="#6b7280" fontSize={10} />
              <YAxis stroke="#6b7280" fontSize={10} />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
              <Area type="monotone" dataKey="requests" stroke="#667eea" fill="#667eea" fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Trend */}
      <div className="hod-pwa-card">
        <div className="hod-pwa-card-header">
          <span className="hod-pwa-card-title">📈 Monthly Trend</span>
        </div>
        <div className="hod-pwa-chart-container">
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData.monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="month" stroke="#6b7280" fontSize={10} />
              <YAxis stroke="#6b7280" fontSize={10} />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
              <Line type="monotone" dataKey="approved" stroke="#10b981" strokeWidth={2} />
              <Line type="monotone" dataKey="rejected" stroke="#ef4444" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pending Requests */}
      <div className="hod-pwa-card">
        <div className="hod-pwa-card-header">
          <span className="hod-pwa-card-title">⏳ Pending Requests</span>
          <span className="hod-pwa-card-badge">{pending.length}</span>
          <Link to="/hod/requests" className="hod-pwa-view-all">View All</Link>
        </div>

        {loading ? (
          <div className="hod-pwa-loading">
            <div className="hod-pwa-spinner"></div>
            <p>Loading requests...</p>
          </div>
        ) : pending.length === 0 ? (
          <div className="hod-pwa-empty">
            <span className="hod-pwa-empty-icon">✨</span>
            <h4>No pending requests</h4>
            <p>All requests have been processed</p>
          </div>
        ) : (
          <div>
            {pending.slice(0, 5).map((p) => (
              <div key={p._id} className={`hod-pwa-request-item ${p.emergency ? 'emergency' : ''}`}>
                <div className="hod-pwa-request-top">
                  <span className="hod-pwa-request-id">{p.passId}</span>
                  <span className={`hod-pwa-request-status ${p.emergency ? 'emergency-status' : 'pending'}`}>
                    {p.emergency ? '🚨 Emergency' : 'Pending'}
                  </span>
                </div>
                <div className="hod-pwa-request-info">
                  <span className="hod-pwa-request-student">{p.student?.name}</span>
                  <span className="hod-pwa-request-detail">{p.reason} • {p.destination}</span>
                </div>
                <div className="hod-pwa-request-bottom">
                  <span className="hod-pwa-request-time">
                    {p.outTime ? new Date(p.outTime).toLocaleDateString() : '-'}
                  </span>
                  <div className="hod-pwa-request-actions">
                    <Link to={`/hod/request/${p._id}`} className="hod-pwa-btn hod-pwa-btn-view">
                      View
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="hod-pwa-bottom-nav">
        <Link to="/hod" className="hod-pwa-nav-item active">
          <Home size={20} />
          <span>Home</span>
        </Link>
        <Link to="/hod/requests" className="hod-pwa-nav-item">
          <FileText size={20} />
          <span>Requests</span>
        </Link>
        <Link to="/hod/students" className="hod-pwa-nav-item">
          <UserPlus size={20} />
          <span>Students</span>
        </Link>
        <Link to="/hod/reports" className="hod-pwa-nav-item">
          <BarChart3 size={20} />
          <span>Reports</span>
        </Link>
        <Link to="/hod/profile" className="hod-pwa-nav-item">
          <UserCog size={20} />
          <span>Profile</span>
        </Link>
      </div>
    </div>
  )
}