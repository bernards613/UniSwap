import { useState, useEffect } from "react";
import "./marketplace.css";

export default function PurchaseHistory({ token }) {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
    fetch(`${apiBaseUrl}/users/purchases`, {
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
        setPurchases(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching purchase history:", err);
        setError(err.message);
        setLoading(false);
      });
  }, [token]);

  const totalSpent = purchases.reduce((sum, p) => sum + parseFloat(p.price || 0), 0);

  return (
    <div className="mp-page">

      {/* Summary bar */}
      {!loading && !error && purchases.length > 0 && (
        <div className="ph-summary">
          <div className="ph-summary-stat">
            <span className="ph-summary-label">Total Purchases </span>
            <span className="ph-summary-value">{purchases.length}</span>
          </div>
          <div className="ph-summary-divider" />
          <div className="ph-summary-stat">
            <span className="ph-summary-label">Total Spent </span>
            <span className="ph-summary-value">${totalSpent.toFixed(2)}</span>
          </div>
        </div>
      )}

      <div className="mp-results-bar" style={{ marginTop: "1rem" }}>
        <span className="mp-results-count">
          {loading
            ? "Loading..."
            : `${purchases.length} purchase${purchases.length !== 1 ? "s" : ""}`}
        </span>
      </div>

      {loading ? (
        <div className="mp-loading">
          <div className="mp-spinner"></div>
          <p>Loading your purchase history...</p>
        </div>
      ) : error ? (
        <div className="mp-empty">
          <span className="mp-empty-icon">⚠️</span>
          <h3>Something went wrong</h3>
          <p>{error}</p>
        </div>
      ) : purchases.length === 0 ? (
        <div className="mp-empty">
          <span className="mp-empty-icon">🛍️</span>
          <h3>No purchases yet</h3>
          <p>Items you buy will appear here.</p>
        </div>
      ) : (
        <div className="mp-grid">
          {purchases.map((p, i) => (
            <div
              className="mp-card"
              key={p.transactionid}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="mp-card-img">
                <span className="mp-card-category-icon">{categoryIcon(p.category)}</span>
              </div>

              <div className="mp-card-body">
                <div className="mp-card-top">
                  <span className="mp-card-category">{p.category}</span>
                  <span className="ph-purchased-badge">✓ Purchased</span>
                </div>

                {p.description && <p className="mp-card-desc">{p.description}</p>}

                <div className="mp-card-footer">
                  <div className="mp-card-meta">
                    <span className="mp-card-location">📍 {p.location}</span>
                    {p.created_at && (
                      <span className="mp-card-location">
                        🗓 {new Date(p.created_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <span className="mp-card-price">${parseFloat(p.price).toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function categoryIcon(cat) {
  const icons = {
    Furniture: "🪑",
    Appliances: "🔌",
    Decor: "🖼️",
    Electronics: "💻",
    Other: "📦",
  };
  return icons[cat] || "📦";
}