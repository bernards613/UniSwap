import { useState } from 'react'
import './auth.css'

export function CreateAccount({ onSwitchToLogin, onAccountCreated }) {
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    username: '',
    institution: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    setError('')
  }

  const validateForm = () => {
    if (!formData.firstname.trim()) {
      setError('First name is required')
      return false
    }
    if (!formData.lastname.trim()) {
      setError('Last name is required')
      return false
    }
    if (!formData.username.trim()) {
      setError('Username is required')
      return false
    }
    if (!formData.password) {
      setError('Password is required')
      return false
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
      
      // Register endpoint expects JSON body
      const requestBody = {
        firstname: formData.firstname.trim(),
        lastname: formData.lastname.trim(),
        username: formData.username.trim(),
        password: formData.password,
        institution: formData.institution.trim() || null,
      }

      const response = await fetch(`${apiBaseUrl}/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.detail || 'Account creation failed')
        return
      }

      // Simple success handling - console log the response
      console.log('Account created successfully:', data)
      
      if (onAccountCreated) {
        onAccountCreated(data)
      }
    } catch (err) {
      console.error('Create account error:', err)
      // More specific error message
      if (err.message && err.message.includes('Failed to fetch')) {
        setError('Cannot connect to backend. Make sure the backend server is running on http://localhost:8000')
      } else {
        setError(`Network error: ${err.message || 'Please check if the backend is running.'}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Create Account</h1>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="firstname">First Name</label>
            <input
              type="text"
              id="firstname"
              name="firstname"
              value={formData.firstname}
              onChange={handleChange}
              disabled={isLoading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="lastname">Last Name</label>
            <input
              type="text"
              id="lastname"
              name="lastname"
              value={formData.lastname}
              onChange={handleChange}
              disabled={isLoading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              disabled={isLoading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="institution">Institution (Optional)</label>
            <input
              type="text"
              id="institution"
              name="institution"
              value={formData.institution}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              disabled={isLoading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={isLoading}
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="auth-button" disabled={isLoading}>
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-link">
          Already have an account?{' '}
          <button type="button" onClick={onSwitchToLogin} className="link-button">
            Login
          </button>
        </div>
      </div>
    </div>
  )
}
