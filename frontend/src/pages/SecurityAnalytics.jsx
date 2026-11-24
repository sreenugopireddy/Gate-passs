// pages/SecurityAnalytics.jsx - Fetch from Backend
import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { 
  FaArrowLeft, FaHome, FaHistory, FaUser, FaSignOutAlt,
  FaQrcode, FaUserTimes, FaUserCheck, FaClock, 
  FaCheckCircle, FaTimesCircle,
  FaCalendarAlt, FaChartLine, FaSync
} from 'react-icons/fa'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
         XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
         AreaChart, Area } from 'recharts'

// Import CSS
import '../styles/security.css'

export default function SecurityAnalytics() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState({
    totalScans: 0,
    validScans: 0,
    invalidScans: 0,
    outside: 0,
    returned: 0,
    pending: 0,
    todayScans: 0,
    weeklyScans: 0,
    monthlyScans: 0,
    peakHour: 'N/A',
    averageDuration: 0
  })

  const [chartData, setChartData] = useState({
    daily: [],
    weekly: [],
    statusDistribution: [],
    hourly: []
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        navigate('/login')
        return
      }

      // Fetch stats
      const statsRes = await axios.get('/api/security/stats', {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (statsRes.data) {
        setStats(statsRes.data)
        console.log('✅ Stats loaded from DB:', statsRes.data)
      }

      // Fetch history for charts
      const historyRes = await axios.get('/api/security/history?limit=100', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (historyRes.data && historyRes.data.scans) {
        const scans = historyRes.data.scans
        calculateCharts(scans)
        console.log('✅ History loaded for charts:', scans.length, 'records')
      }

    } catch (err) {
      console.error('Failed to load analytics:', err)
      setError('Failed to load analytics. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const calculateCharts = (history) => {
    // Daily data (last 7 days)
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const daily = days.map((day, index) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - index))
      const dateStr = date.toDateString()
      const count = history.filter(s => {
        const scanDate = new Date(s.timestamp)
        return scanDate.toDateString() === dateStr
      }).length
      return { day, scans: count }
    })
    
    // Weekly data (last 4 weeks)
    const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4']
    const weekly = weeks.map((week, index) => {
      const endDate = new Date()
      endDate.setDate(endDate.getDate() - (3 - index) * 7)
      const startDate = new Date(endDate)
      startDate.setDate(startDate.getDate() - 6)
      const count = history.filter(s => {
        const date = new Date(s.timestamp)
        return date >= startDate && date <= endDate
      }).length
      return { week, scans: count }
    })

    // Status distribution
    const statusDistribution = [
      { name: 'Valid', value: stats.validScans || 0 },
      { name: 'Invalid', value: stats.invalidScans || 0 },
      { name: 'Pending', value: stats.pending || 0 }
    ].filter(item => item.value > 0)

    // Hourly distribution (last 24 hours)
    const hours = Array.from({ length: 24 }, (_, i) => i)
    const hourly = hours.map(hour => {
      const count = history.filter(s => {
        const date = new Date(s.timestamp)
        return date.getHours() === hour
      }).length
      return { hour: `${hour}:00`, scans: count }
    })

    setChartData({ daily, weekly, statusDistribution, hourly })
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  // Colors for pie chart
  const COLORS = ['#10b981', '#ef4444', '#f59e0b']

  const StatCard = ({ icon, label, value, color, bgColor, subtitle }) => (
    <div className="sec-analytic-card" style={{ borderLeftColor: color }}>
      <div className="sec-analytic-icon" style={{ background: bgColor, color: color }}>
        {icon}
      </div>
      <div className="sec-analytic-info">
        <span className="sec-analytic-value">{value}</span>
        <span className="sec-analytic-label">{label}</span>
        {subtitle && <span className="sec-analytic-sub">{subtitle}</span>}
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="sec-container">
        <div className="sec-header">
          <Link to="/security" className="sec-back-btn">
            <FaArrowLeft size={18} />
          </Link>
          <h1>Analytics</h1>
          <button className="sec-logout" onClick={handleLogout}>
            <FaSignOutAlt size={14} /> Logout
          </button>
        </div>
        <div className="sec-loading">
          <div className="sec-spinner"></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="sec-container">
      {/* Header */}
      <div className="sec-header">
        <Link to="/security" className="sec-back-btn">
          <FaArrowLeft size={18} />
        </Link>
        <h1>📊 Analytics</h1>
        <div className="header-actions">
          <button className="sec-refresh-btn" onClick={loadData} title="Refresh">
            <FaSync size={14} />
          </button>
          <button className="sec-logout" onClick={handleLogout}>
            <FaSignOutAlt size={14} /> Logout
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="sec-analytics-grid">
        <StatCard 
          icon={<FaQrcode size={18} />}
          label="Total Scans"
          value={stats.totalScans || 0}
          color="#4f46e5"
          bgColor="#eef2ff"
        />
        <StatCard 
          icon={<FaCheckCircle size={18} />}
          label="Valid"
          value={stats.validScans || 0}
          color="#10b981"
          bgColor="#d1fae5"
        />
        <StatCard 
          icon={<FaTimesCircle size={18} />}
          label="Invalid"
          value={stats.invalidScans || 0}
          color="#ef4444"
          bgColor="#fee2e2"
        />
        <StatCard 
          icon={<FaUserTimes size={18} />}
          label="Outside"
          value={stats.outside || 0}
          color="#f59e0b"
          bgColor="#fef3c7"
        />
        <StatCard 
          icon={<FaUserCheck size={18} />}
          label="Returned"
          value={stats.returned || 0}
          color="#10b981"
          bgColor="#d1fae5"
        />
        <StatCard 
          icon={<FaClock size={18} />}
          label="Today"
          value={stats.todayScans || 0}
          color="#8b5cf6"
          bgColor="#ede9fe"
          subtitle={`Peak: ${stats.peakHour || 'N/A'}`}
        />
        <StatCard 
          icon={<FaCalendarAlt size={18} />}
          label="This Week"
          value={stats.weeklyScans || 0}
          color="#ec4899"
          bgColor="#fce7f3"
        />
        <StatCard 
          icon={<FaClock size={18} />}
          label="Avg Duration"
          value={`${stats.averageDuration || 0}m`}
          color="#06b6d4"
          bgColor="#cffafe"
        />
      </div>

      {/* Charts Section */}
      <div className="sec-charts-section">
        {/* Daily Scans Chart */}
        <div className="sec-chart-card">
          <h4>📈 Daily Scans (Last 7 Days)</h4>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData.daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="day" stroke="#6b7280" fontSize={11} />
              <YAxis stroke="#6b7280" fontSize={11} />
              <Tooltip 
                contentStyle={{ background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}
              />
              <Area type="monotone" dataKey="scans" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Weekly Trend */}
        <div className="sec-chart-card">
          <h4>📊 Weekly Trend (Last 4 Weeks)</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData.weekly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="week" stroke="#6b7280" fontSize={11} />
              <YAxis stroke="#6b7280" fontSize={11} />
              <Tooltip 
                contentStyle={{ background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}
              />
              <Bar dataKey="scans" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status Distribution */}
        <div className="sec-chart-card">
          <h4>🎯 Status Distribution</h4>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={chartData.statusDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={70}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.statusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Hourly Distribution */}
        <div className="sec-chart-card">
          <h4>🕐 Hourly Distribution</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData.hourly.filter((_, i) => i % 2 === 0)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="hour" stroke="#6b7280" fontSize={9} angle={-45} textAnchor="end" height={50} />
              <YAxis stroke="#6b7280" fontSize={11} />
              <Tooltip 
                contentStyle={{ background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}
              />
              <Bar dataKey="scans" fill="#06b6d4" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="sec-nav">
        <Link to="/security" className="sec-nav-item">
          <FaHome size={18} />
          <span>Scan</span>
        </Link>
        <Link to="/security/history" className="sec-nav-item">
          <FaHistory size={18} />
          <span>History</span>
        </Link>
        <Link to="/security/analytics" className="sec-nav-item active">
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