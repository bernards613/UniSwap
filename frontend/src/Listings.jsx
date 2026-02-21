import { useEffect, useState, useMemo } from "react";
import CreateListingModal from "./CreateListingModal.jsx";
import './marketplace.css'

const CATEGORIES = ["All", "Furniture", "Appliances", "Decor", "Electronics", "Other"];
const SORT_OPTIONS = [
  { label: "Newest First", value: "newest" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
];

export default function Listings() {
  const [listings, setListings] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Filter / search state
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [statusFilter, setStatusFilter] = useState("All");

  const token = localStorage.getItem("token");

  const loadListings = async () => {
    setLoading(true);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      const response = await fetch(`${apiBaseUrl}/listings/all`);
      const data = await response.json();
      if (response.ok) {
        setListings(data);
      } else {
        console.error("Error fetching:", data);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadListings();
  }, []);

  const deleteListing = async (itemid) => {
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
    }
  };

  //filtering and sorting
  const filtered = useMemo(() => {
    let result = [...listings];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) =>
          l.category?.toLowerCase().includes(q) ||
          l.description?.toLowerCase().includes(q) ||
          l.location?.toLowerCase().includes(q)
      );
    }

    if (selectedCategory !== "All") {
      result = result.filter((l) => l.category === selectedCategory);
    }

    if (statusFilter !== "All") {
      result = result.filter((l) => l.status === statusFilter);
    }

    if (maxPrice !== "" && !isNaN(parseFloat(maxPrice))) {
      result = result.filter((l) => parseFloat(l.price) <= parseFloat(maxPrice));
    }

    if (sortBy === "price_asc") result.sort((a, b) => a.price - b.price);
    else if (sortBy === "price_desc") result.sort((a, b) => b.price - a.price);
    // filter "newest" keeps original fetch order

    return result;
  }, [listings, search, selectedCategory, statusFilter, maxPrice, sortBy]);

  const statusColor = (status) => {
    if (status === "Available") return "#16a34a";
    if (status === "Pending") return "#d97706";
    if (status === "Sold") return "#dc2626";
    return "#888";
  };

  return (
    <div className="mp-page">

      {/* Search Bar */}
      <div className="mp-hero">
        <div className="mp-search-wrap">
          <span className="mp-search-icon">🔍</span>
          <input
            className="mp-search-input"
            type="text"
            placeholder="Search listings by category, description, or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="mp-search-clear" onClick={() => setSearch("")}>✕</button>
          )}
        </div>
      </div>

      {/* Filter bar */}
      <div className="mp-filter-bar">

        {/* Categories */}
        <div className="mp-filter-group">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`mp-pill ${selectedCategory === cat ? "mp-pill-active" : ""}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="mp-filter-right">
          {/* Status */}
          <select
            className="mp-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Available">Available</option>
            <option value="Pending">Pending</option>
            <option value="Sold">Sold</option>
          </select>

          {/* Max price */}
          <div className="mp-price-wrap">
            <span className="mp-price-symbol">$</span>
            <input
              className="mp-price-input"
              type="number"
              placeholder="Max price"
              value={maxPrice}
              min="0"
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>

          {/* Sort */}
          <select
            className="mp-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results bar and also create button */}
      <div className="mp-results-bar">
        <span className="mp-results-count">
          {loading ? "Loading..." : `${filtered.length} listing${filtered.length !== 1 ? "s" : ""} found`}
        </span>
        <button className="mp-create-btn" onClick={() => setShowModal(true)}>
          + Post a Listing
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="mp-loading">
          <div className="mp-spinner"></div>
          <p>Loading listings...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="mp-empty">
          <span className="mp-empty-icon">📦</span>
          <h3>No listings found</h3>
          <p>Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="mp-grid">
          {filtered.map((item, i) => (
            <div
              className="mp-card"
              key={item.itemid}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              {/* Card image holder until picture is added */}
              <div className="mp-card-img">
                <span className="mp-card-category-icon">{categoryIcon(item.category)}</span>
              </div>

              <div className="mp-card-body">
                <div className="mp-card-top">
                  <span className="mp-card-category">{item.category}</span>
                  <span
                    className="mp-card-status"
                    style={{ color: statusColor(item.status) }}
                  >
                    ● {item.status}
                  </span>
                </div>

                <p className="mp-card-desc">{item.description}</p>

                <div className="mp-card-footer">
                  <div className="mp-card-meta">
                    <span className="mp-card-location">📍 {item.location}</span>
                  </div>
                  <span className="mp-card-price">${parseFloat(item.price).toFixed(2)}</span>
                </div>

                <button
                  className="mp-delete-btn"
                  onClick={() => deleteListing(item.itemid)}
                  title="Delete listing"
                >
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <CreateListingModal
          token={token}
          onClose={() => {
            setShowModal(false);
            loadListings();
          }}
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
