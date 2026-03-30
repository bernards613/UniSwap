import { useState } from 'react'
import './auth.css'

export function ChangePassword({ onChangePasswordSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError('')
    setSuccess('')
  }

  const validateForm = () => {
    if (!formData.currentPassword) { setError('Current password is required'); return false }
    if (!formData.newPassword) { setError('New password is required'); return false }
    if (formData.newPassword.length < 6) { setError('New password must be at least 6 characters'); return false }
    if (!formData.confirmPassword) { setError('Password confirmation is required'); return false }
    if (formData.newPassword !== formData.confirmPassword) { setError('New passwords do not match'); return false }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!validateForm()) return
    setIsLoading(true)
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
      const token = localStorage.getItem('access_token') || localStorage.getItem('token')
      const response = await fetch(`${apiBaseUrl}/users/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          old_password: formData.currentPassword,
          new_password: formData.newPassword,
          confirm_password: formData.confirmPassword,
        }),
      })
      const data = await response.json()
      if (!response.ok) { setError(data.detail || 'Password change failed'); return }
      setSuccess('Password changed successfully!')
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      if (onChangePasswordSuccess) {
        setTimeout(() => onChangePasswordSuccess(data), 1500)
      }
    } catch (err) {
      if (err.message?.includes('Failed to fetch')) {
        setError('Cannot connect to backend. Make sure the server is running.')
      } else {
        setError(`Network error: ${err.message || 'Please check if the backend is running.'}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-blob auth-blob-1" />
      <div className="auth-blob auth-blob-2" />
      <div className="auth-blob auth-blob-3" />

      <div className="auth-panel">
        <div className="auth-logo-wrap">
          <img src="/UniswapLogoBackgroundless.png" alt="UniSwap" className="auth-logo" />
        </div>

        <div className="auth-tagline">Change Your Password</div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="currentPassword">Current Password</label>
            <input
              type="password"
              id="currentPassword"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
              disabled={isLoading}
              placeholder="Enter your current password"
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="newPassword">New Password</label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              disabled={isLoading}
              placeholder="Min. 6 characters"
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="confirmPassword">Verify New Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={isLoading}
              placeholder="Re-enter your new password"
              required
            />
          </div>

          {error && <div className="auth-error">{error}</div>}
          {success && <div className="auth-success">{success}</div>}

          <button type="submit" className="auth-submit" disabled={isLoading}>
            {isLoading ? <span className="auth-spinner" /> : 'Change Password'}
          </button>
        </form>

        <div className="auth-footer">
          <button type="button" onClick={onCancel} className="auth-switch-btn">
            Back to Settings
          </button>
        </div>
      </div>
    </div>
  )
}
