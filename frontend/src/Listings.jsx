import { useEffect, useState, useMemo, useRef } from "react";
import CreateListingModal from "./CreateListingModal.jsx";
import EditListingModal from "./EditListingModal.jsx";
import ListingDetailView from "./ListingDetailView.jsx";
import ListingHoverPanel, { PANEL_WIDTH } from "./ListingHoverPanel.jsx";
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
  const [loading, setLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingListing, setEditingListing] = useState(null);
  const [detailListing, setDetailListing] = useState(null);
  const [panelListing, setPanelListing] = useState(null);
  const [panelSide, setPanelSide] = useState("right");

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [statusFilter, setStatusFilter] = useState("All");

  const [hoveredCardId, setHoveredCardId] = useState(null);
  const longHoverTimerRef = useRef(null);
  const cardWrapRefs = useRef({});
  const LONG_HOVER_MS = 1000;

  const token = localStorage.getItem("token");
  const currentUserId = Number(localStorage.getItem("userId"));
  const { toasts, showToast } = useToast();

  // Hover: overlay hides; after 1.5s show side panel (right, or left if card is rightmost)
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

  const productName = (item) => {
    const t = (item.title || "").trim();
    if (t) return t.length > 32 ? t.slice(0, 32) + "…" : t;
    if (item.description) return item.description.length > 32 ? item.description.slice(0, 32) + "…" : item.description;
    return item.category || "Item";
  };

  // Load all listings
  const loadListings = async () => {
    setLoading(true);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      const response = await fetch(`${apiBaseUrl}/listings/all`);
      const data = await response.json();
      if (response.ok) {
        setListings(data);
      } else {
        console.error("Error fetching listings:", data);
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

  // Update a listing in state after editing
  const handleListingUpdate = (updatedListing) => {
    setListings((prev) =>
      prev.map((l) => (l.itemid === updatedListing.itemid ? updatedListing : l))
    );
  };

  // PURCHASE HANDLER
  const handlePurchase = async (itemid) => {
    try {
      const response = await fetch(`http://localhost:8000/transactions/purchase/${itemid}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
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
      const response = await fetch(`http://localhost:8000/users/bookmark/${itemid}`, {
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

  // FILTER + SORT
  const filtered = useMemo(() => {
    let result = [...listings];
    result = result.filter((l) => l.sellerid !== currentUserId);

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) =>
          l.category?.toLowerCase().includes(q) ||
          l.description?.toLowerCase().includes(q) ||
          l.location?.toLowerCase().includes(q) ||
          l.seller_firstname?.toLowerCase().includes(q) ||
          l.seller_lastname?.toLowerCase().includes(q) ||
          l.seller_username?.toLowerCase().includes(q)
      );
    }
    if (selectedCategory !== "All") result = result.filter((l) => l.category === selectedCategory);
    if (statusFilter !== "All") result = result.filter((l) => l.status === statusFilter);
    if (maxPrice && !isNaN(parseFloat(maxPrice))) result = result.filter((l) => parseFloat(l.price) <= parseFloat(maxPrice));

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
      {/* SEARCH */}
      <div className="mp-hero">
        <div className="mp-search-wrap">
          <img src="/search.png" alt="" className="mp-search-icon-img" />
          <input
            className="mp-search-input"
            type="text"
            placeholder="Search listings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && <button className="mp-search-clear" onClick={() => setSearch("")}>X</button>}
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
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* RESULTS HEADER */}
      <div className="mp-results-bar">
        <span className="mp-results-count">
          {loading ? "Loading..." : `${filtered.length} listing${filtered.length !== 1 ? "s" : ""} found`}
        </span>
        <button className="mp-create-btn" onClick={() => setShowCreateModal(true)}>+ Post a Listing</button>
      </div>

      {/* GRID */}
      {loading ? (
        <div className="mp-loading"><div className="mp-spinner"></div><p>Loading listings...</p></div>
      ) : filtered.length === 0 ? (
        <div className="mp-empty"><h3>No listings found</h3><p>Try adjusting your search or filters.</p></div>
      ) : (
        <div className="mp-grid">
          {filtered.map((item, i) => (
            <div
              key={item.itemid}
              className={`mp-listing-card-wrap${panelListing?.itemid === item.itemid ? " panel-open" : ""}`}
              style={{ animationDelay: `${i * 40}ms`, position: "relative" }}
              ref={(el) => { cardWrapRefs.current[item.itemid] = el; }}
              onMouseEnter={() => handleCardMouseEnter(item)}
              onMouseLeave={handleCardMouseLeave}
            >
              <div
                className={`mp-listing-card ${hoveredCardId === item.itemid ? "hover-hide-overlay" : ""}`}
                onClick={() => item.sellerid !== currentUserId && setDetailListing(item)}
              >
                <div className="mp-listing-card-bg" style={{ backgroundImage: item.photo ? `url(${item.photo})` : "none" }} />
                <div className="mp-listing-overlay">
                  <span className="mp-listing-status-badge mp-listing-status-badge--corner" style={{ backgroundColor: statusColor(item.status) }}>
                    {item.status || "Available"}
                  </span>
                  <span className="mp-listing-overlay-left">{productName(item)}</span>
                  <span className="mp-listing-overlay-right">${parseFloat(item.price).toFixed(2)}</span>
                </div>
              </div>

              {panelListing?.itemid === item.itemid && (
                <ListingHoverPanel
                  listing={item}
                  side={panelSide}
                  cardWrapRef={cardWrapRefs}
                  listingItemId={item.itemid}
                  onClose={() => setPanelListing(null)}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateListingModal token={token} onClose={() => { setShowCreateModal(false); loadListings(); }} />
      )}
      {editingListing && (
        <EditListingModal
          listing={editingListing}
          onClose={() => setEditingListing(null)}
          onSave={(updated) => {
            handleListingUpdate(updated);
            setEditingListing(null);
          }}
        />
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

      <ToastContainer toasts={toasts} />
    </div>
  );
}