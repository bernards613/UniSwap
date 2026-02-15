import { useState } from 'react'
import { Login } from './Login'
import { CreateAccount } from './CreateAccount'

function App() {
  const [currentPage, setCurrentPage] = useState('login')

  const handleSwitchToCreateAccount = () => {
    setCurrentPage('createAccount')
  }

  const handleSwitchToLogin = () => {
    setCurrentPage('login')
  }

  const handleLoginSuccess = (data) => {
    console.log('Login successful in App:', data)
    // Simple success handling - just log to console
  }

  const handleAccountCreated = (data) => {
    console.log('Account created in App:', data)
    // Simple success handling - just log to console
    // Optionally switch back to login page
    setCurrentPage('login')
  }

  return (
    <>
      {currentPage === 'login' ? (
        <Login 
          onSwitchToCreateAccount={handleSwitchToCreateAccount}
          onLoginSuccess={handleLoginSuccess}
        />
      ) : (
        <CreateAccount 
          onSwitchToLogin={handleSwitchToLogin}
          onAccountCreated={handleAccountCreated}
        />
      )}
    </>
  )
}

export default App

