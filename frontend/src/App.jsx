// src/App.jsx
import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

// Auth Pages
import Login from './pages/Login'
import HodLogin from './pages/HodLogin'
import ChangePassword from './pages/ChangePassword'
import ForgotPassword from './pages/ForgotPassword'

// Student Pages
import StudentDashboard from './pages/StudentDashboard'
import ApplyGatePass from './pages/ApplyGatePass'
import StudentHistory from './pages/StudentHistory'
import StudentProfile from './pages/StudentProfile'
import StudentPreviewPass from './pages/StudentPreviewPass'

// HOD Pages
import HodDashboard from './pages/HodDashboard'
import HodRequests from './pages/HodRequests'
import HodRequestDetails from './pages/HodRequestDetails'
import HodReports from './pages/HodReports'
import HodStudents from './pages/HodStudents'
import HodProfile from './pages/HodProfile'
import ImportResults from './pages/ImportResults'

// Security Pages
import SecurityDashboard from './pages/SecurityDashboard'
import SecurityHistory from './pages/SecurityHistory'
import SecurityProfile from './pages/SecurityProfile'
import SecurityAnalytics from './pages/SecurityAnalytics'

// Admin Pages
import AdminStudents from './pages/AdminStudents'

// Components
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'

// Styles
import 'bootstrap/dist/css/bootstrap.min.css'
import './styles.css'


export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        {/* ===== PUBLIC ROUTES ===== */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/hod-login" element={<HodLogin />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* ===== STUDENT ROUTES ===== */}
        <Route 
          path="/student" 
          element={
            <ProtectedRoute roles={['student']}>
              <StudentDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/student/apply" 
          element={
            <ProtectedRoute roles={['student']}>
              <ApplyGatePass />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/student/history" 
          element={
            <ProtectedRoute roles={['student']}>
              <StudentHistory />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/student/profile" 
          element={
            <ProtectedRoute roles={['student']}>
              <StudentProfile />
            </ProtectedRoute>
          } 
        />
        <Route 
  path="/student/preview" 
  element={
    <ProtectedRoute roles={['student']}>
      <StudentPreviewPass />
    </ProtectedRoute>
  } 
/>

        {/* ===== HOD ROUTES ===== */}
        <Route 
          path="/hod" 
          element={
            <ProtectedRoute roles={['hod']}>
              <HodDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/hod/requests" 
          element={
            <ProtectedRoute roles={['hod']}>
              <HodRequests />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/hod/request/:id" 
          element={
            <ProtectedRoute roles={['hod']}>
              <HodRequestDetails />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/hod/reports" 
          element={
            <ProtectedRoute roles={['hod']}>
              <HodReports />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/hod/students" 
          element={
            <ProtectedRoute roles={['hod']}>
              <HodStudents />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/hod/profile" 
          element={
            <ProtectedRoute roles={['hod']}>
              <HodProfile />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/hod/import-results" 
          element={
            <ProtectedRoute roles={['hod']}>
              <ImportResults />
            </ProtectedRoute>
          } 
        />

        {/* ===== SECURITY ROUTES ===== */}
        <Route 
          path="/security" 
          element={
            <ProtectedRoute roles={['security']}>
              <SecurityDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
  path="/security/history" 
  element={
    <ProtectedRoute roles={['security']}>
      <SecurityHistory />
    </ProtectedRoute>
  } 
/>
<Route 
  path="/security/profile" 
  element={
    <ProtectedRoute roles={['security']}>
      <SecurityProfile />
    </ProtectedRoute>
  } 
/>
<Route 
  path="/security/analytics" 
  element={
    <ProtectedRoute roles={['security']}>
      <SecurityAnalytics />
    </ProtectedRoute>
  } 
/>

        {/* ===== ADMIN ROUTES ===== */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute roles={['admin']}>
              <Navigate to="/admin/students" replace />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/students" 
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminStudents />
            </ProtectedRoute>
          } 
        />

        {/* ===== 404 FALLBACK ===== */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  )
}