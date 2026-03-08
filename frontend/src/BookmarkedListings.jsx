import { useState, useEffect } from "react";
import ConfirmModal from "./ConfirmModal.jsx";
import { useToast, ToastContainer } from "./Toast.jsx";
import "./marketplace.css";

export default function BookmarkedListings({ token }) {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmConfig, setConfirmConfig] = useState(null);
  const { toasts, showToast } = useToast();

  useEffect(() => {
    if (!token) return;
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
    fetch(`${apiBaseUrl}/users/bookmarks`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`HTTP ${res.status}: ${text}`);
        }
        return res.json();
      })
      .then((data) => {
        setBookmarks(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching bookmarks:", err);
        setError(err.message);
        setLoading(false);
      });
  }, [token]);

  const removeBookmark = (bookmarkid) => {
    setConfirmConfig({
      message: "Remove this bookmark?",
      confirmLabel: "Remove",
      danger: true,
      onCancel: () => setConfirmConfig(null),
      onConfirm: async () => {
        setConfirmConfig(null);
        try {
          const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
          const response = await fetch(`${apiBaseUrl}/users/bookmark/${bookmarkid}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.ok) {
            setBookmarks((prev) => prev.filter((b) => b.bookmarkid !== bookmarkid));
            showToast("Bookmark removed");
          } else {
            showToast("Could not remove bookmark", "error");
          }
        } catch (err) {
          console.error("Remove bookmark error:", err);
          showToast("Network error", "error");
        }
      },
    });
  };

  const statusColor = (status) => {
    if (!status) return "#888";
    const s = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    if (s === "Available") return "#16a34a";
    if (s === "Pending") return "#d97706";
    if (s === "Sold") return "#dc2626";
    return "#888";
  };

  return (
    <div className="mp-page">
      <div className="mp-results-bar" style={{ marginTop: "1.5rem" }}>
        <span className="mp-results-count">
          {loading
            ? "Loading..."
            : `${bookmarks.length} bookmarked listing${bookmarks.length !== 1 ? "s" : ""}`}
        </span>
      </div>

      {loading ? (
        <div className="mp-loading">
          <div className="mp-spinner"></div>
          <p>Loading your bookmarks...</p>
        </div>
      ) : error ? (
        <div className="mp-empty">
          <span className="mp-empty-icon"></span>
          <h3>Something went wrong</h3>
          <p>{error}</p>
        </div>
      ) : bookmarks.length === 0 ? (
        <div className="mp-empty">
          <span className="mp-empty-icon"></span>
          <h3>No bookmarks yet</h3>
          <p>Save listings you're interested in and they'll show up here.</p>
        </div>
      ) : (
        <div className="mp-grid">
          {bookmarks.map((b, i) => (
            <div
              className="mp-card"
              key={b.bookmarkid}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="mp-card-img">
                <span className="mp-card-category-icon">{categoryIcon(b.category)}</span>
              </div>

              <div className="mp-card-body">
                <div className="mp-card-top">
                  <span className="mp-card-category">{b.category}</span>
                  {b.status && (
                    <span className="mp-card-status" style={{ color: statusColor(b.status) }}>
                      ● {b.status}
                    </span>
                  )}
                </div>

                {b.description && <p className="mp-card-desc">{b.description}</p>}

                <div className="mp-card-footer">
                  <div className="mp-card-meta">
                    <span className="mp-card-location"> {b.location}</span>
                  </div>
                  <span className="mp-card-price">${parseFloat(b.price).toFixed(2)}</span>
                </div>

                <button
                  className="mp-create-btn"
                  style={{ width: "100%", marginTop: "0.75rem", background: "#ef4444" }}
                  onClick={() => removeBookmark(b.bookmarkid)}
                >
                  Remove Bookmark
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {confirmConfig && <ConfirmModal {...confirmConfig} />}
      <ToastContainer toasts={toasts} />
    </div>
  );
}

function categoryIcon(cat) {
  return cat;
}