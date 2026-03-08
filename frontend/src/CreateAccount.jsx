import { useState } from 'react'
import './auth.css'

export function CreateAccount({ onSwitchToLogin, onAccountCreated }) {
  const [formData, setFormData] = useState({
    firstname: '', lastname: '', username: '',
    institution: '', password: '', confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError('')
  }

  const validateForm = () => {
    if (!formData.firstname.trim()) { setError('First name is required'); return false }
    if (!formData.lastname.trim()) { setError('Last name is required'); return false }
    if (!formData.username.trim()) { setError('Username is required'); return false }
    if (!formData.password) { setError('Password is required'); return false }
    if (formData.password.length < 6) { setError('Password must be at least 6 characters'); return false }
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); return false }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!validateForm()) return
    setIsLoading(true)
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
      const response = await fetch(`${apiBaseUrl}/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstname: formData.firstname.trim(),
          lastname: formData.lastname.trim(),
          username: formData.username.trim(),
          password: formData.password,
          institution: formData.institution.trim() || null,
        }),
      })
      const data = await response.json()
      if (!response.ok) { setError(data.detail || 'Account creation failed'); return }

      const loginResponse = await fetch(`${apiBaseUrl}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ username: formData.username.trim(), password: formData.password }),
      })
      if (loginResponse.ok) {
        const loginData = await loginResponse.json()
        if (onAccountCreated) onAccountCreated({ ...data, ...loginData, autoLogin: true })
      } else {
        if (onAccountCreated) onAccountCreated(data)
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

      <div className="auth-panel auth-panel-wide">
        <div className="auth-logo-wrap">
          <img src="/UniswapLogoBackgroundless.png" alt="UniSwap" className="auth-logo auth-logo-sm" />
        </div>

        <div className="auth-tagline">Join your campus marketplace</div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-row">
            <div className="auth-field">
              <label>First Name</label>
              <input type="text" name="firstname" value={formData.firstname} onChange={handleChange} disabled={isLoading} placeholder="First name" required />
            </div>
            <div className="auth-field">
              <label>Last Name</label>
              <input type="text" name="lastname" value={formData.lastname} onChange={handleChange} disabled={isLoading} placeholder="Last name" required />
            </div>
          </div>

          <div className="auth-field">
            <label>Username</label>
            <input type="text" name="username" value={formData.username} onChange={handleChange} disabled={isLoading} placeholder="Choose a username" required />
          </div>

          <div className="auth-field">
            <label>Institution <span className="auth-optional">(optional)</span></label>
            <input type="text" name="institution" value={formData.institution} onChange={handleChange} disabled={isLoading} placeholder="e.g. Oakland University" />
          </div>

          <div className="auth-row">
            <div className="auth-field">
              <label>Password</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} disabled={isLoading} placeholder="Min. 6 characters" required />
            </div>
            <div className="auth-field">
              <label>Confirm Password</label>
              <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} disabled={isLoading} placeholder="Repeat password" required />
            </div>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-submit" disabled={isLoading}>
            {isLoading ? <span className="auth-spinner" /> : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?{' '}
          <button type="button" onClick={onSwitchToLogin} className="auth-switch-btn">
            Sign In
          </button>
        </div>
      </div>
    </div>
  )
}