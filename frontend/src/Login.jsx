import { useState } from 'react'
import './auth.css'

export function Login({ onSwitchToCreateAccount, onLoginSuccess }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const validateForm = () => {
    if (!username.trim()) {
      setError('Username is required')
      return false
    }
    if (!password) {
      setError('Password is required')
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
      
      // Login endpoint expects form data (application/x-www-form-urlencoded)
      const formData = new URLSearchParams()
      formData.append('username', username)
      formData.append('password', password)

      const response = await fetch(`${apiBaseUrl}/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.detail || 'Login failed')
        return
      }

      localStorage.setItem("access_token", data.access_token);

      // Simple success handling - console log the response
      console.log('Login successful:', data)
      
      if (onLoginSuccess) {
        onLoginSuccess(data)
      }
    } catch (err) {
      console.error('Login error:', err)
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
        <h1>Login</h1>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="auth-button" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="auth-link">
          Don't have an account?{' '}
          <button type="button" onClick={onSwitchToCreateAccount} className="link-button">
            Create Account
          </button>
        </div>
      </div>
    </div>
  )
}

export default Login;
