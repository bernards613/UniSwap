import { useEffect, useState, useMemo } from "react";
import CreateListingModal from "./CreateListingModal.jsx";
import ImageZoomModal from "./ImageZoomModal.jsx";
import { useToast, ToastContainer } from "./Toast.jsx";
import "./marketplace.css";

const CATEGORIES = ["All", "Furniture", "Appliances", "Decor", "Electronics", "Other"];
const SORT_OPTIONS = [
  { label: "Newest First", value: "newest" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
];

export default function Listings({ onMessageSeller }) {
  const [listings, setListings] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [statusFilter, setStatusFilter] = useState("All");

  const token = localStorage.getItem("token");
  const currentUserId = Number(localStorage.getItem("userId"));
  const { toasts, showToast } = useToast();
  const [activeActionsItemId, setActiveActionsItemId] = useState(null);
  const [hoveredCardId, setHoveredCardId] = useState(null);
  const [expandedDescItemId, setExpandedDescItemId] = useState(null);
  const [zoomImageUrl, setZoomImageUrl] = useState(null);

  const handleCardMouseEnter = (itemid) => setHoveredCardId(itemid);
  const handleCardMouseLeave = () => {
    setHoveredCardId(null);
    setActiveActionsItemId(null);
    setExpandedDescItemId(null);
  };

  const DESC_SEE_MORE_THRESHOLD = 120;
  const isDescLong = (text) => text && text.length > DESC_SEE_MORE_THRESHOLD;
  const handleCardClick = (itemid) => {
    setActiveActionsItemId((prev) => (prev === itemid ? null : itemid));
  };
  const handleActionsBackdropClick = (e) => {
    if (e.target === e.currentTarget) setActiveActionsItemId(null);
  };

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

  // PURCHASE HANDLER
  const handlePurchase = async (itemid) => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

      const response = await fetch(`http://localhost:8000/transactions/purchase/${itemid}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        showToast("Purchase successful!");
        loadListings();
      } else {
        showToast(data.detail || "Purchase failed", "error");
      }
    } catch (err) {
      console.error("Purchase error:", err);
      showToast("Network error during purchase", "error");
    }
  };

  // BOOKMARK HANDLER
  const handleBookmark = async (itemid) => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

      const response = await fetch(`http://localhost:8000/users/bookmark/${itemid}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        showToast("Listing bookmarked!");
      } else {
        showToast(data.detail || "Bookmark failed", "error");
      }
    } catch (err) {
      console.error("Bookmark error:", err);
      showToast("Network error during bookmark", "error");
    }
  };

  // FILTER LOGIC
  const filtered = useMemo(() => {
    let result = [...listings];

    // Hide own listings from main listings page
    result = result.filter((l) => l.sellerid !== currentUserId);

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) =>
          l.category?.toLowerCase().includes(q) ||
          l.description?.toLowerCase().includes(q) ||
          l.location?.toLowerCase().includes(q) ||
          l.seller_firstname?.toLowerCase().includes(q) ||
          l.seller_lastname?.toLowerCase().includes(q)
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

    return result;
  }, [listings, search, selectedCategory, statusFilter, maxPrice, sortBy, currentUserId]);

  const statusColor = (status) => {
    if (status === "Available") return "#16a34a";
    if (status === "Pending") return "#d97706";
    if (status === "Sold") return "#dc2626";
    return "#888";
  };

  return (
    <div className="mp-page">

      {/* SEARCH BAR */}
      <div className="mp-hero">
        <div className="mp-search-wrap">
          <span className="mp-search-icon"></span>
          <input
            className="mp-search-input"
            type="text"
            placeholder="Search listings by category, description, or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="mp-search-clear" onClick={() => setSearch("")}>
              X
            </button>
          )}
        </div>
      </div>

      {/* FILTERS */}
      <div className="mp-filter-bar">
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
          <select className="mp-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All Statuses</option>
            <option value="Available">Available</option>
            <option value="Pending">Pending</option>
            <option value="Sold">Sold</option>
          </select>

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

          <select className="mp-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* RESULTS HEADER */}
      <div className="mp-results-bar">
        <span className="mp-results-count">
          {loading
            ? "Loading..."
            : `${filtered.length} listing${filtered.length !== 1 ? "s" : ""} found`}
        </span>
        <button className="mp-create-btn" onClick={() => setShowModal(true)}>
          + Post a Listing
        </button>
      </div>

      {/* GRID */}
      {loading ? (
        <div className="mp-loading">
          <div className="mp-spinner"></div>
          <p>Loading listings...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="mp-empty">
          <span className="mp-empty-icon"></span>
          <h3>No listings found</h3>
          <p>Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="mp-grid">
          {filtered.map((item, i) => (
            <div
              key={item.itemid}
              className={`mp-listing-card-wrap ${hoveredCardId === item.itemid && item.description ? "has-desc" : ""}`}
              style={{ animationDelay: `${i * 40}ms` }}
              onMouseEnter={() => handleCardMouseEnter(item.itemid)}
              onMouseLeave={handleCardMouseLeave}
            >
              <div
                className={`mp-listing-card ${hoveredCardId === item.itemid ? "hover-hide-overlay" : ""} ${activeActionsItemId === item.itemid ? "show-actions" : ""}`}
                onClick={() => item.sellerid !== currentUserId && handleCardClick(item.itemid)}
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
                {item.sellerid !== currentUserId && (
                  <div
                    className="mp-listing-actions"
                    onClick={handleActionsBackdropClick}
                  >
                    <button
                      type="button"
                      className="mp-action-btn alt"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (item.photo) setZoomImageUrl(item.photo);
                        setActiveActionsItemId(null);
                      }}
                    >
                      Zoom
                    </button>
                    {item.status === "Available" && (
                      <button
                        type="button"
                        className="mp-action-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePurchase(item.itemid);
                          setActiveActionsItemId(null);
                        }}
                      >
                        Purchase
                      </button>
                    )}
                    <button
                      type="button"
                      className="mp-action-btn alt"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBookmark(item.itemid);
                        setActiveActionsItemId(null);
                      }}
                    >
                      Bookmark
                    </button>
                    <button
                      type="button"
                      className="mp-action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMessageSeller &&
                          onMessageSeller(
                            item.sellerid,
                            item.itemid,
                            item.description,
                            item.price
                          );
                        setActiveActionsItemId(null);
                      }}
                    >
                      Message
                    </button>
                  </div>
                )}
              </div>
              {hoveredCardId === item.itemid && item.description && (
                <div
                  className={`mp-listing-card-desc ${expandedDescItemId === item.itemid ? "expanded" : ""}`}
                >
                  <div className="mp-listing-card-desc-inner">{item.description}</div>
                  {isDescLong(item.description) && (
                    <button
                      type="button"
                      className="mp-listing-card-desc-seemore"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedDescItemId((prev) =>
                          prev === item.itemid ? null : item.itemid
                        );
                      }}
                    >
                      {expandedDescItemId === item.itemid ? "See less" : "See more"}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {zoomImageUrl && (
        <ImageZoomModal
          imageUrl={zoomImageUrl}
          onClose={() => setZoomImageUrl(null)}
        />
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
      <ToastContainer toasts={toasts} />
    </div>
  );
}