import { useEffect, useState } from 'react'
import './index.css'

export default function Settings({ onNavigate, onAccountDeleted }) {
  const [isDarkMode, setIsDarkMode] = useState(
    localStorage.getItem("theme") === "dark"
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const theme = isDarkMode ? "dark" : "light";
    localStorage.setItem("theme", theme);
    document.documentElement.classList.toggle("dark-mode", isDarkMode);
  }, [isDarkMode]);

  const handleDeleteAccount = async () => {
    if (!deletePassword) { setDeleteError("Please enter your password"); return; }
    setDeleting(true);
    setDeleteError("");
    try {
      const token = localStorage.getItem("token");
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      const res = await fetch(`${apiBaseUrl}/users/me`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ password: deletePassword }),
      });
      if (res.ok) {
        localStorage.clear();
        onAccountDeleted && onAccountDeleted();
      } else {
        const data = await res.json();
        setDeleteError(data.detail || "Failed to delete account");
      }
    } catch {
      setDeleteError("Network error");
    } finally {
      setDeleting(false);
    }
  };

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

        <div className="settings-section" style={{ marginTop: "2rem" }}>
          <div className="settings-item settings-item-danger">
            <div className="settings-item-content">
              <h3 className="settings-item-title" style={{ color: "#dc2626" }}>Delete Account</h3>
              <p className="settings-item-description">Permanently delete your account and all associated data</p>
            </div>
            <button className="settings-delete-btn" onClick={() => setShowDeleteModal(true)}>
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <div className="cm-overlay" onClick={() => { setShowDeleteModal(false); setDeletePassword(""); setDeleteError(""); }}>
          <div className="cm-card" onClick={(e) => e.stopPropagation()}>
            <div className="cm-icon">⚠️</div>
            <h3 className="cm-title">Delete your account?</h3>
            <p className="cm-subtext">
              This action is permanent and cannot be undone. All your listings, messages, bookmarks, and purchase history will be deleted.
            </p>
            <input
              type="password"
              className="settings-delete-password"
              placeholder="Enter your password to confirm"
              value={deletePassword}
              onChange={(e) => { setDeletePassword(e.target.value); setDeleteError(""); }}
              autoFocus
            />
            {deleteError && <p className="settings-delete-error">{deleteError}</p>}
            <div className="cm-actions">
              <button className="cm-cancel" onClick={() => { setShowDeleteModal(false); setDeletePassword(""); setDeleteError(""); }}>Cancel</button>
              <button className="cm-confirm cm-confirm-danger" onClick={handleDeleteAccount} disabled={deleting}>
                {deleting ? "Deleting..." : "Yes, Delete My Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
