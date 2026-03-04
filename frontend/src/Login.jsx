import { useState } from 'react'
import './auth.css'

export function Login({ onSwitchToCreateAccount, onLoginSuccess }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const validateForm = () => {
    if (!username.trim()) { setError('Username is required'); return false }
    if (!password) { setError('Password is required'); return false }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!validateForm()) return
    setIsLoading(true)
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
      const formData = new URLSearchParams()
      formData.append('username', username)
      formData.append('password', password)
      const response = await fetch(`${apiBaseUrl}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      })
      const data = await response.json()
      if (!response.ok) { setError(data.detail || 'Login failed'); return }
      localStorage.setItem("access_token", data.access_token)
      if (data.access_token) localStorage.setItem("token", data.access_token)
      if (onLoginSuccess) onLoginSuccess(data)
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

        <div className="auth-tagline">Buy &amp; sell with your campus community</div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
              placeholder="Enter your username"
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              placeholder="Enter your password"
              required
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-submit" disabled={isLoading}>
            {isLoading ? <span className="auth-spinner" /> : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account?{' '}
          <button type="button" onClick={onSwitchToCreateAccount} className="auth-switch-btn">
            Create Account
          </button>
        </div>
      </div>
    </div>
  )
}

export default Login