import { useEffect, useState } from 'react'
import './index.css'

export default function Settings({ onNavigate }) {
  const [isDarkMode, setIsDarkMode] = useState(
    localStorage.getItem("theme") === "dark"
  );

  useEffect(() => {
    const theme = isDarkMode ? "dark" : "light";
    localStorage.setItem("theme", theme);
    document.documentElement.classList.toggle("dark-mode", isDarkMode);
  }, [isDarkMode]);

  return (
    <div className="settings">
      <div className="settings-container">
        <h1 className="settings-title">Settings</h1>
        
        <div className="settings-section">
          <div className="settings-item">
            <div className="settings-item-content">
              <h3 className="settings-item-title">Appearance</h3>
              <p className="settings-item-description">Toggle dark mode</p>
            </div>
            <label className="settings-toggle-switch">
              <input 
                type="checkbox" 
                checked={isDarkMode}
                onChange={() => setIsDarkMode(prev => !prev)}
              />
              <span className="settings-toggle-slider"></span>
            </label>
          </div>

          {onNavigate && (
            <div className="settings-item">
              <div className="settings-item-content">
                <h3 className="settings-item-title">Security</h3>
                <p className="settings-item-description">Change your password</p>
              </div>
              <button 
                className="settings-action-btn" 
                onClick={() => onNavigate("changepassword")}
              >
                Change Password →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
