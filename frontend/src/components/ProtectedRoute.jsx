import React from 'react'
import { Navigate } from 'react-router-dom'

export default function ProtectedRoute({ children, roles }){
  const token = localStorage.getItem('token')
  const rawUser = localStorage.getItem('user')
  if (!token || !rawUser) return <Navigate to="/login" replace />
  const user = JSON.parse(rawUser)
  if (roles && roles.length && !roles.includes(user.role)) return <Navigate to="/login" replace />
  return children
}
