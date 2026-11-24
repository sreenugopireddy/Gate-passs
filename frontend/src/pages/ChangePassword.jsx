import React from 'react'
import { useForm } from 'react-hook-form'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

export default function ChangePassword(){
  const { register, handleSubmit } = useForm()
  const navigate = useNavigate()
  const onSubmit = async (data) => {
    if (data.newPassword !== data.confirmPassword) return alert('Passwords do not match')
    try{
      const token = localStorage.getItem('token')
      await axios.post('/api/auth/change-password', { currentPassword: data.currentPassword, newPassword: data.newPassword }, { headers: { Authorization: `Bearer ${token}` } })
      alert('Password changed. Please login again.')
      localStorage.removeItem('token'); localStorage.removeItem('user');
      navigate('/login')
    }catch(err){ console.error(err); alert(err?.response?.data?.message || 'Failed') }
  }
  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card p-3">
            <h4>Change Password</h4>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="mb-3">
                <label className="form-label">Current Password</label>
                <input type="password" className="form-control" {...register('currentPassword')} />
              </div>
              <div className="mb-3">
                <label className="form-label">New Password</label>
                <input type="password" className="form-control" {...register('newPassword')} />
              </div>
              <div className="mb-3">
                <label className="form-label">Confirm New Password</label>
                <input type="password" className="form-control" {...register('confirmPassword')} />
              </div>
              <button className="btn btn-primary">Change Password</button>
            </form>
            <div className="mt-2 text-muted small">Password must be at least 8 characters and include upper, lower, number and special character.</div>
          </div>
        </div>
      </div>
    </div>
  )
}
