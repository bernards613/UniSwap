import { useState, useEffect } from "react";
import { StarRating } from "./ReviewModal.jsx";
import "./marketplace.css";

const SUPPORTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const SUPPORTED_EXTENSIONS = "JPEG, PNG, GIF, or WebP";

export default function Profile({ token, onProfilePictureUpdate }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({ firstname: "", lastname: "", institution: "" });
  const [myReviews, setMyReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(null);

  useEffect(() => { loadProfile(); loadMyReviews(); }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      const response = await fetch(`${apiBaseUrl}/users/me`, { headers: { Authorization: `Bearer ${token}` } });
      if (response.ok) {
        const data = await response.json();
        setUser(data);
        setProfilePicture(data.profilepictureurl);
        setEditForm({ firstname: data.firstname || "", lastname: data.lastname || "", institution: data.institution || "" });
      } else {
        setError("Failed to load profile");
      }
    } catch (err) {
      console.error("Error loading profile:", err);
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  const loadMyReviews = async () => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      const res = await fetch(`${apiBaseUrl}/reviews/mine`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setMyReviews(data.reviews || []);
        setAvgRating(data.average_rating);
      }
    } catch (err) {
      console.error("Error loading reviews:", err);
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) { alert(`Unsupported image format. Please use ${SUPPORTED_EXTENSIONS}.`); return; }
    if (file.size > 5 * 1024 * 1024) { alert("Image must be less than 5MB"); return; }
    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result;
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
        const response = await fetch(`${apiBaseUrl}/users/profile-picture`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ profilepictureurl: base64 }),
        });
        if (response.ok) {
          setProfilePicture(base64);
          localStorage.setItem("profilePicture", base64);
          if (onProfilePictureUpdate) onProfilePictureUpdate(base64);
          alert("Profile picture updated!");
        } else {
          const errData = await response.json();
          alert(errData.detail || "Failed to update profile picture");
        }
      } catch (err) {
        console.error("Error uploading:", err);
        alert("Failed to upload image. Please try again.");
      } finally {
        setUploading(false);
      }
    };
    reader.onerror = () => { alert("Failed to read the image file."); setUploading(false); };
    reader.readAsDataURL(file);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      const response = await fetch(`${apiBaseUrl}/users/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(editForm),
      });
      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        setIsEditing(false);
        localStorage.setItem("userFirstname", updatedUser.firstname || "");
        localStorage.setItem("userLastname", updatedUser.lastname || "");
        localStorage.setItem("username", updatedUser.username || "");
        alert("Profile updated successfully!");
      } else {
        const errData = await response.json();
        alert(errData.detail || "Failed to update profile");
      }
    } catch (err) {
      console.error("Error saving profile:", err);
      alert("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditForm({ firstname: user?.firstname || "", lastname: user?.lastname || "", institution: user?.institution || "" });
    setIsEditing(false);
  };

  const getInitial = () => user?.username ? user.username.charAt(0).toUpperCase() : "?";

  if (loading) return <div className="mp-page"><div className="mp-loading"><div className="mp-spinner"></div><p>Loading profile...</p></div></div>;
  if (error) return <div className="mp-page"><div className="mp-empty"><h3>Error</h3><p>{error}</p></div></div>;

  return (
    <div className="mp-page">
      <div className="profile-container">
        {/* Header card */}
        <div className="profile-header">
          <div className="profile-avatar-section">
            <div className="profile-avatar-wrapper">
              {profilePicture ? (
                <img src={profilePicture} alt="Profile" className="profile-avatar-img" />
              ) : (
                <div className="profile-avatar-placeholder">{getInitial()}</div>
              )}
              <label className="profile-avatar-edit" title="Change photo">
                <input type="file" accept=".jpg,.jpeg,.png,.gif,.webp" onChange={handleImageChange} disabled={uploading} style={{ display: "none" }} />
                {uploading ? (
                  <span style={{ fontSize: "0.65rem", color: "#888" }}>...</span>
                ) : (
                  <img src="/camera.png" alt="Upload photo" className="profile-icon-camera" />
                )}
              </label>
            </div>
            <p className="profile-avatar-hint">Supported: {SUPPORTED_EXTENSIONS}</p>
          </div>

          <div className="profile-info">
            <h1 className="profile-name">{user?.firstname} {user?.lastname}</h1>
            <p className="profile-username">@{user?.username}</p>
            {user?.institution && <p className="profile-institution">🎓 {user.institution}</p>}
          </div>
        </div>

        {/* Details card */}
        <div className="profile-details">
          <div className="profile-details-header">
            <h2>Profile Details</h2>
            {!isEditing && (
              <button className="profile-edit-btn" onClick={() => setIsEditing(true)}>
                <img src="/write.png" alt="" className="profile-icon-write" />
                Edit
              </button>
            )}
          </div>

          {isEditing ? (
            <>
              <div className="profile-field"><label htmlFor="firstname">First Name</label><input type="text" id="firstname" name="firstname" value={editForm.firstname} onChange={handleEditChange} className="profile-input" /></div>
              <div className="profile-field"><label htmlFor="lastname">Last Name</label><input type="text" id="lastname" name="lastname" value={editForm.lastname} onChange={handleEditChange} className="profile-input" /></div>
              <div className="profile-field"><label>Username</label><p className="profile-readonly">{user?.username} (cannot be changed)</p></div>
              <div className="profile-field"><label htmlFor="institution">Institution</label><input type="text" id="institution" name="institution" value={editForm.institution} onChange={handleEditChange} className="profile-input" placeholder="Enter your institution" /></div>
              <div className="profile-actions">
                <button className="profile-save-btn" onClick={handleSaveProfile} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button>
                <button className="profile-cancel-btn" onClick={handleCancelEdit} disabled={saving}>Cancel</button>
              </div>
            </>
          ) : (
            <>
              <div className="profile-field"><label>First Name</label><p>{user?.firstname}</p></div>
              <div className="profile-field"><label>Last Name</label><p>{user?.lastname}</p></div>
              <div className="profile-field"><label>Username</label><p>{user?.username}</p></div>
              <div className="profile-field"><label>Institution</label><p>{user?.institution || "Not specified"}</p></div>
            </>
          )}
        </div>

        <div className="profile-details" style={{ marginTop: "1.5rem" }}>
          <div className="profile-details-header">
            <h2>My Reviews</h2>
            {avgRating != null && (
              <span style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem", color: "#888" }}>
                <StarRating rating={avgRating} size="1rem" />
                <strong style={{ color: "var(--text, #1a1a1a)" }}>{avgRating}</strong>
                ({myReviews.length} review{myReviews.length !== 1 ? "s" : ""})
              </span>
            )}
          </div>
          {myReviews.length === 0 ? (
            <p style={{ color: "#888", fontSize: "0.9rem" }}>No reviews yet.</p>
          ) : (
            <div className="profile-reviews-list">
              {myReviews.map((r) => (
                <div key={r.reviewid} className="profile-review-item">
                  <div className="profile-review-header">
                    <span className="profile-review-user">@{r.reviewer_username}</span>
                    <StarRating rating={r.rating} size="0.8rem" />
                  </div>
                  {r.comment && <p className="profile-review-comment">{r.comment}</p>}
                  {r.reviewdate && (
                    <span className="profile-review-date">
                      {new Date(r.reviewdate).toLocaleDateString(undefined, { dateStyle: "medium" })}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .profile-container { max-width: 600px; margin: 2rem auto; }

        .profile-header {
          display: flex; gap: 2rem; align-items: center;
          padding: 2rem; background: #fff; border-radius: 16px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08); margin-bottom: 1.5rem;
        }
        .profile-avatar-section { text-align: center; }
        .profile-avatar-wrapper { position: relative; width: 120px; height: 120px; }
        .profile-avatar-img { width: 120px; height: 120px; border-radius: 50%; object-fit: cover; border: 4px solid #f0c040; }
        .profile-avatar-placeholder {
          width: 120px; height: 120px; border-radius: 50%;
          background: linear-gradient(135deg, #f0c040 0%, #e0b030 100%);
          display: flex; align-items: center; justify-content: center;
          font-size: 3rem; font-weight: 700; color: #1a1a1a; border: 4px solid #e0b030;
        }
        .profile-avatar-edit {
          position: absolute; bottom: 0; right: 0;
          width: 36px; height: 36px; background: #fff; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.18);
          transition: transform 0.15s;
        }
        .profile-avatar-edit:hover { transform: scale(1.12); }

        .profile-icon-camera { width: 17px; height: 17px; object-fit: contain; display: block; filter: brightness(0) saturate(100%); }
        .profile-icon-write { width: 13px; height: 13px; object-fit: contain; display: inline-block; vertical-align: middle; filter: brightness(0) saturate(100%) invert(35%); }

        html.dark-mode .profile-icon-camera { filter: brightness(0) saturate(100%) invert(100%); }
        html.dark-mode .profile-icon-write { filter: brightness(0) saturate(100%) invert(75%); }

        .profile-avatar-hint { margin-top: 0.5rem; font-size: 0.7rem; color: #888; }
        .profile-info { flex: 1; }
        .profile-name { margin: 0; font-size: 1.75rem; font-weight: 700; color: #1a1a1a; }
        .profile-username { margin: 0.25rem 0 0; font-size: 1rem; color: #888; }
        .profile-institution { margin: 0.5rem 0 0; font-size: 0.9rem; color: #666; }

        .profile-details { padding: 1.5rem; background: #fff; border-radius: 16px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
        .profile-details-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
        .profile-details h2 { margin: 0; font-size: 1.1rem; color: #1a1a1a; }

        .profile-edit-btn {
          background: none; border: 1px solid #ddd; padding: 0.4rem 0.8rem;
          border-radius: 8px; cursor: pointer; font-size: 0.85rem; color: #666;
          display: inline-flex; align-items: center; gap: 5px; transition: all 0.15s;
        }
        .profile-edit-btn:hover { background: #f5f5f5; border-color: #ccc; }

        .profile-field { padding: 0.75rem 0; border-bottom: 1px solid #eee; }
        .profile-field:last-child { border-bottom: none; }
        .profile-field label { display: block; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: #888; margin-bottom: 0.25rem; }
        .profile-field p { margin: 0; font-size: 1rem; color: #1a1a1a; }
        .profile-readonly { color: #888 !important; font-style: italic; }

        .profile-input { width: 100%; padding: 0.6rem 0.8rem; border: 1px solid #ddd; border-radius: 8px; font-size: 1rem; transition: border-color 0.15s; box-sizing: border-box; }
        .profile-input:focus { outline: none; border-color: #f0c040; }

        .profile-actions { display: flex; gap: 0.75rem; margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid #eee; }
        .profile-save-btn { flex: 1; padding: 0.75rem 1rem; background: linear-gradient(135deg, #f0c040 0%, #e0b030 100%); border: none; border-radius: 8px; color: #1a1a1a; font-weight: 600; cursor: pointer; transition: transform 0.15s, box-shadow 0.15s; }
        .profile-save-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(240,192,64,0.4); }
        .profile-save-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .profile-cancel-btn { padding: 0.75rem 1rem; background: #f5f5f5; border: 1px solid #ddd; border-radius: 8px; color: #666; cursor: pointer; transition: background 0.15s; }
        .profile-cancel-btn:hover:not(:disabled) { background: #eee; }
        .profile-cancel-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        html.dark-mode .profile-header, html.dark-mode .profile-details { background: #1e1e1e; }
        html.dark-mode .profile-name, html.dark-mode .profile-details h2, html.dark-mode .profile-field p { color: #fff; }
        html.dark-mode .profile-avatar-edit { background: #2a2a2a; }
        html.dark-mode .profile-input { background: #2a2a2a; border-color: #444; color: #fff; }
        html.dark-mode .profile-edit-btn { border-color: #444; color: #aaa; }
        html.dark-mode .profile-edit-btn:hover { background: #2a2a2a; }
        html.dark-mode .profile-cancel-btn { background: #2a2a2a; border-color: #444; color: #aaa; }
        html.dark-mode .profile-field { border-bottom-color: #333; }

        .profile-reviews-list { display: flex; flex-direction: column; gap: 0.75rem; }
        .profile-review-item { padding: 0.75rem 0; border-bottom: 1px solid #eee; }
        .profile-review-item:last-child { border-bottom: none; }
        .profile-review-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem; }
        .profile-review-user { font-size: 0.85rem; font-weight: 600; color: #1a1a1a; }
        .profile-review-comment { margin: 0.25rem 0 0; font-size: 0.9rem; color: #555; line-height: 1.4; }
        .profile-review-date { font-size: 0.75rem; color: #888; }

        html.dark-mode .profile-review-item { border-bottom-color: #333; }
        html.dark-mode .profile-review-user { color: #fff; }
        html.dark-mode .profile-review-comment { color: #ccc; }

        @media (max-width: 600px) {
          .profile-header { flex-direction: column; text-align: center; }
          .profile-info { text-align: center; }
        }
      `}</style>
    </div>
  );
}