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
  const [activeActionsItemId, setActiveActionsItemId] = useState(null);
  const { toasts, showToast } = useToast();

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
    setConfirmConfig({
      message: "Delete this listing?",
      subtext: "This cannot be undone.",
      confirmLabel: "Delete",
      danger: true,
      onCancel: () => setConfirmConfig(null),
      onConfirm: async () => {
        setConfirmConfig(null);
        try {
          const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
          const response = await fetch(`${apiBaseUrl}/listings/delete/${itemid}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await response.json();
          if (response.ok) {
            setListings((prev) => prev.filter((l) => l.itemid !== itemid));
            showToast("Listing deleted");
          } else {
            showToast(data.detail || "Could not delete listing", "error");
          }
        } catch (err) {
          console.error("Delete error:", err);
          showToast("Network error while deleting", "error");
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
              className="mp-listing-card-wrap"
              style={{ animationDelay: `${i * 40}ms` }}
              onMouseLeave={() => setActiveActionsItemId(null)}
            >
              <div
                className={`mp-listing-card ${activeActionsItemId === item.itemid ? "show-actions" : ""}`}
                onClick={() => setActiveActionsItemId((prev) => (prev === item.itemid ? null : item.itemid))}
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
                  <span className="mp-listing-overlay-left">{item.location}</span>
                  <span className="mp-listing-overlay-right">
                    ${parseFloat(item.price).toFixed(2)}
                  </span>
                </div>
                <div
                  className="mp-listing-actions"
                  onClick={(e) => e.target === e.currentTarget && setActiveActionsItemId(null)}
                >
                  <button
                    type="button"
                    className="mp-action-btn alt"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEdit(item);
                      setActiveActionsItemId(null);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="mp-action-btn"
                    style={{ background: "#dc2626" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item.itemid);
                      setActiveActionsItemId(null);
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