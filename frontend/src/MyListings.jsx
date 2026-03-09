import { useEffect, useMemo, useState } from "react";
import EditListingModal from "./EditListingModal.jsx";
import ConfirmModal from "./ConfirmModal.jsx";
import { useToast, ToastContainer } from "./Toast.jsx";
import "./marketplace.css";

export default function MyListings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState(null);
  const [hoveredCardId, setHoveredCardId] = useState(null);
  const { toasts, showToast } = useToast();

  const productName = (item) => {
    const t = (item.title || "").trim();
    if (t) return t.length > 32 ? t.slice(0, 32) + "…" : t;
    if (item.description) return item.description.length > 32 ? item.description.slice(0, 32) + "…" : item.description;
    return item.category || "Item";
  };

  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");

  const loadListings = async () => {
    setLoading(true);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      const response = await fetch(`${apiBaseUrl}/listings/all`);
      const data = await response.json();
      if (response.ok) setListings(data);
      else console.error("Error fetching:", data);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadListings();
  }, []);

  const myListings = useMemo(() => {
    if (!Array.isArray(listings)) return [];
    if (!userId) return [];
    return listings.filter((l) => {
      const owner =
        l.ownerid ?? l.userid ?? l.user_id ?? l.sellerid ?? l.seller_id ?? null;
      return owner != null && String(owner) === String(userId);
    });
  }, [listings, userId]);

  const handleOpenEdit = (item) => setEditingItem(item);
  const handleCloseEdit = () => setEditingItem(null);

  const handleSaveEdit = (updated) => {
    setListings((prev) =>
      prev.map((l) => (l.itemid === updated.itemid ? { ...l, ...updated } : l))
    );
    setEditingItem(null);
  };

  const handleDelete = (itemid) => {
    const id = Number(itemid);
    if (!Number.isInteger(id) || id < 1) {
      showToast("Invalid listing.", "error");
      return;
    }
    setConfirmConfig({
      message: "Delete this listing?",
      subtext: "This cannot be undone.",
      confirmLabel: "Delete",
      danger: true,
      onCancel: () => setConfirmConfig(null),
      onConfirm: async () => {
        setConfirmConfig(null);
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
        const url = `${apiBaseUrl.replace(/\/$/, "")}/listings/delete/${id}`;
        try {
          const response = await fetch(url, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });
          let detail = "";
          try {
            const data = await response.json();
            detail = typeof data.detail === "string" ? data.detail : "";
          } catch (_) {
            /* non-JSON response */
          }
          if (response.ok) {
            setListings((prev) => prev.filter((l) => l.itemid !== id));
            showToast("Listing deleted");
          } else {
            const message =
              response.status === 404
                ? "Listing not found or already deleted."
                : detail || "Could not delete listing.";
            showToast(message, "error");
          }
        } catch (err) {
          console.error("Delete error:", err);
          showToast("Network error. Check the connection and try again.", "error");
        }
      },
    });
  };

  return (
    <div className="mp-page">
      <div className="mp-results-bar" style={{ marginTop: 18 }}>
        <span className="mp-results-count">
          {loading
            ? "Loading..."
            : `${myListings.length} listing${myListings.length !== 1 ? "s" : ""}`}
        </span>
      </div>

      {loading ? (
        <div className="mp-loading">
          <div className="mp-spinner"></div>
          <p>Loading your listings...</p>
        </div>
      ) : myListings.length === 0 ? (
        <div className="mp-empty">
          <span className="mp-empty-icon"></span>
          <h3>No listings yet</h3>
          <p>Create a listing from the Listings page, then manage it here.</p>
        </div>
      ) : (
        <div className="mp-grid">
          {myListings.map((item, i) => (
            <div
              key={item.itemid}
              className="mp-listing-card-wrap mp-listing-card-wrap--my-listings"
              style={{ animationDelay: `${i * 40}ms` }}
              onMouseEnter={() => setHoveredCardId(item.itemid)}
              onMouseLeave={() => setHoveredCardId(null)}
            >
              <div
                className={`mp-listing-card ${hoveredCardId === item.itemid ? "show-actions" : ""}`}
              >
                <div
                  className="mp-listing-card-bg"
                  style={{
                    backgroundImage: item.photo
                      ? `url(${item.photo})`
                      : "none",
                  }}
                />
                <div className="mp-listing-overlay">
                  <span className="mp-listing-overlay-left">{productName(item)}</span>
                  <span className="mp-listing-overlay-right">
                    ${parseFloat(item.price).toFixed(2)}
                  </span>
                </div>
                <div
                  className="mp-listing-actions"
                  onClick={(e) => e.target === e.currentTarget && setHoveredCardId(null)}
                >
                  <button
                    type="button"
                    className="mp-action-btn alt"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEdit(item);
                      setHoveredCardId(null);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="mp-action-btn mp-action-btn-danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item.itemid);
                      setHoveredCardId(null);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingItem && (
        <EditListingModal
          listing={editingItem}
          onClose={handleCloseEdit}
          onSave={handleSaveEdit}
        />
      )}
      {confirmConfig && <ConfirmModal {...confirmConfig} />}
      <ToastContainer toasts={toasts} />
    </div>
  );
}