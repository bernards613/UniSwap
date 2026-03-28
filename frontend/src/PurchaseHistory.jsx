import { useState, useEffect } from "react";
import ListingDetailView from "./ListingDetailView.jsx";
import ListingPhotoCarousel from "./ListingPhotoCarousel.jsx";
import { listingPhotoUrls } from "./listingPhotos.jsx";
import "./marketplace.css";

export default function PurchaseHistory({ token }) {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hoveredCardId, setHoveredCardId] = useState(null);
  const [detailPurchase, setDetailPurchase] = useState(null);

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

  const sellerName = (p) => p.seller_username || "Seller";

  const statusColor = (status) => {
    if (!status) return "#888";
    const s = (status + "").charAt(0).toUpperCase() + (status + "").slice(1).toLowerCase();
    if (s === "Available") return "#16a34a";
    if (s === "Pending") return "#d97706";
    if (s === "Sold") return "#dc2626";
    return "#888";
  };

  return (
    <div className="mp-page">
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
          <span className="mp-empty-icon"></span>
          <h3>Something went wrong</h3>
          <p>{error}</p>
        </div>
      ) : purchases.length === 0 ? (
        <div className="mp-empty">
          <span className="mp-empty-icon"></span>
          <h3>No purchases yet</h3>
          <p>Items you buy will appear here.</p>
        </div>
      ) : (
        <div className="mp-grid">
          {purchases.map((p, i) => (
            <div
              key={p.transactionid}
              className="mp-listing-card-wrap"
              style={{ animationDelay: `${i * 40}ms`, position: "relative" }}
              onMouseEnter={() => setHoveredCardId(p.transactionid)}
              onMouseLeave={() => setHoveredCardId(null)}
            >
              <div
                className={`mp-listing-card mp-listing-card--purchase ${hoveredCardId === p.transactionid ? "hover-hide-overlay" : ""}`}
                onClick={() => setDetailPurchase(p)}
              >
                <ListingPhotoCarousel urls={listingPhotoUrls(p)} variant="card" />
                <div className="mp-listing-overlay mp-purchase-overlay">
                  <span className="mp-purchase-overlay-seller">by {sellerName(p)}</span>
                  <span className="mp-purchase-overlay-price">Purchased for ${parseFloat(p.price).toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {detailPurchase && (
        <ListingDetailView
          listing={detailPurchase}
          onClose={() => setDetailPurchase(null)}
          purchaseDate={detailPurchase.transactiondate}
          statusColor={statusColor}
        />
      )}
    </div>
  );
}
