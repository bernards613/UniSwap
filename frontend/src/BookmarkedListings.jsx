import { useState, useEffect, useRef } from "react";
import ConfirmModal from "./ConfirmModal.jsx";
import ListingDetailView from "./ListingDetailView.jsx";
import ListingHoverPanel, { PANEL_WIDTH } from "./ListingHoverPanel.jsx";
import { useToast, ToastContainer } from "./Toast.jsx";
import "./marketplace.css";

export default function BookmarkedListings({ token, onMessageSeller }) {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmConfig, setConfirmConfig] = useState(null);
  const [hoveredCardId, setHoveredCardId] = useState(null);
  const [panelListing, setPanelListing] = useState(null);
  const [panelSide, setPanelSide] = useState("right");
  const [detailListing, setDetailListing] = useState(null);
  const longHoverTimerRef = useRef(null);
  const cardWrapRefs = useRef({});
  const LONG_HOVER_MS = 1000;
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
            setDetailListing(null);
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

  const handleCardMouseEnter = (item) => {
    setHoveredCardId(item.itemid);
    longHoverTimerRef.current = setTimeout(() => {
      const wrapEl = cardWrapRefs.current[item.itemid];
      const rect = wrapEl?.getBoundingClientRect();
      const spaceRight = typeof window !== "undefined" ? window.innerWidth - (rect?.right ?? 0) : PANEL_WIDTH + 20;
      setPanelSide(spaceRight >= PANEL_WIDTH + 16 ? "right" : "left");
      setPanelListing(item);
    }, LONG_HOVER_MS);
  };
  const handleCardMouseLeave = () => {
    setHoveredCardId(null);
    setPanelListing(null);
    if (longHoverTimerRef.current) {
      clearTimeout(longHoverTimerRef.current);
      longHoverTimerRef.current = null;
    }
  };

  const statusColor = (status) => {
    if (!status) return "#888";
    const s = (status + "").charAt(0).toUpperCase() + (status + "").slice(1).toLowerCase();
    if (s === "Available") return "#16a34a";
    if (s === "Pending") return "#d97706";
    if (s === "Sold") return "#dc2626";
    return "#888";
  };

  const productName = (item) => {
    const t = (item.title || "").trim();
    if (t) return t.length > 32 ? t.slice(0, 32) + "…" : t;
    if (item.description) return item.description.length > 32 ? item.description.slice(0, 32) + "…" : item.description;
    return item.category || "Item";
  };

  const handlePurchase = async (itemid) => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      const response = await fetch(`${apiBaseUrl}/transactions/purchase/${itemid}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        showToast("Purchase successful!");
        setBookmarks((prev) => prev.filter((b) => b.itemid !== itemid));
        setDetailListing(null);
      } else {
        showToast(data.detail || "Purchase failed", "error");
      }
    } catch (err) {
      console.error("Purchase error:", err);
      showToast("Network error during purchase", "error");
    }
  };

  const handleBookmark = async (itemid) => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      const response = await fetch(`${apiBaseUrl}/users/bookmark/${itemid}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) showToast("Listing bookmarked!");
      else showToast(data.detail || "Bookmark failed", "error");
    } catch (err) {
      console.error("Bookmark error:", err);
      showToast("Network error during bookmark", "error");
    }
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
              key={b.bookmarkid}
              className={`mp-listing-card-wrap${panelListing?.itemid === b.itemid ? " panel-open" : ""}`}
              style={{ animationDelay: `${i * 40}ms`, position: "relative" }}
              ref={(el) => { cardWrapRefs.current[b.itemid] = el; }}
              onMouseEnter={() => handleCardMouseEnter(b)}
              onMouseLeave={handleCardMouseLeave}
            >
              <div
                className={`mp-listing-card ${hoveredCardId === b.itemid ? "hover-hide-overlay" : ""}`}
                onClick={() => setDetailListing(b)}
              >
                <div className="mp-listing-card-bg" style={{ backgroundImage: b.photo ? `url(${b.photo})` : "none" }} />
                <div className="mp-listing-overlay">
                  <span className="mp-listing-status-badge mp-listing-status-badge--corner" style={{ backgroundColor: statusColor(b.status) }}>
                    {b.status || "Available"}
                  </span>
                  <span className="mp-listing-overlay-left">{productName(b)}</span>
                  <span className="mp-listing-overlay-right">${parseFloat(b.price).toFixed(2)}</span>
                </div>
              </div>

              {panelListing?.itemid === b.itemid && (
                <ListingHoverPanel
                  listing={b}
                  side={panelSide}
                  cardWrapRef={cardWrapRefs}
                  listingItemId={b.itemid}
                  onClose={() => setPanelListing(null)}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {detailListing && (
        <ListingDetailView
          listing={detailListing}
          onClose={() => setDetailListing(null)}
          onPurchase={handlePurchase}
          onBookmark={handleBookmark}
          onMessage={onMessageSeller}
          statusColor={statusColor}
        />
      )}
      {confirmConfig && <ConfirmModal {...confirmConfig} />}
      <ToastContainer toasts={toasts} />
    </div>
  );
}
