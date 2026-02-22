import { useEffect, useMemo, useState } from "react";
import EditListingModal from "./EditListingModal.jsx";
import "./marketplace.css";

export default function MyListings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);

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

  const handleDelete = async (itemid) => {
    if (!confirm("Delete this listing?")) return;
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      const response = await fetch(`${apiBaseUrl}/listings/delete/${itemid}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setListings((prev) => prev.filter((l) => l.itemid !== itemid));
      } else {
        alert(data.detail || "Could not delete listing");
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Network error while deleting.");
    }
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
          <span className="mp-empty-icon">📦</span>
          <h3>No listings yet</h3>
          <p>Create a listing from the Listings page, then manage it here.</p>
        </div>
      ) : (
        <div className="mp-grid">
          {myListings.map((item, i) => (
            <div
              className="mp-card"
              key={item.itemid}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="mp-card-img">
                <span className="mp-card-category-icon">{categoryIcon(item.category)}</span>
              </div>
              <div className="mp-card-body">
                <div className="mp-card-top">
                  <span className="mp-card-category">{item.category}</span>
                  <span className="mp-card-status" style={{ color: statusColor(item.status) }}>
                    ● {item.status}
                  </span>
                </div>
                <p className="mp-card-desc">{item.description}</p>
                <div className="mp-card-footer">
                  <div className="mp-card-meta">
                    <span className="mp-card-location">📍 {item.location}</span>
                  </div>
                  <span className="mp-card-price">
                    ${parseFloat(item.price).toFixed(2)}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <button
                    className="mp-create-btn"
                    style={{ flex: 1 }}
                    onClick={() => handleOpenEdit(item)}
                  >
                    Edit
                  </button>
                  <button
                    className="mp-create-btn"
                    style={{ flex: 1, background: "#dc2626" }}
                    onClick={() => handleDelete(item.itemid)}
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

function statusColor(status) {
  if (status === "Available") return "#16a34a";
  if (status === "Pending") return "#d97706";
  if (status === "Sold") return "#dc2626";
  return "#888";
}
