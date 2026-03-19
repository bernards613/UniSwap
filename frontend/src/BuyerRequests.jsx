import { useEffect, useState, useMemo } from "react";
import CreateBuyerRequestModal from "./CreateBuyerRequestModal.jsx";
import { useToast, ToastContainer } from "./Toast.jsx";
import "./marketplace.css";

const CATEGORIES = ["All", "Furniture", "Appliances", "Decor", "Electronics", "Other"];
const SORT_OPTIONS = [
  { label: "Newest First", value: "newest" },
  { label: "Budget: Low to High", value: "price_asc" },
  { label: "Budget: High to Low", value: "price_desc" },
];

export default function BuyerRequests({ onMessageBuyer }) {
  const [requests, setRequests] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [statusFilter, setStatusFilter] = useState("All");

  const token = localStorage.getItem("token");
  const currentUserId = Number(localStorage.getItem("userId"));
  const { toasts, showToast } = useToast();

  const loadRequests = async () => {
    setLoading(true);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      const response = await fetch(`${apiBaseUrl}/buyer-requests/all`);
      const data = await response.json();
      if (response.ok) {
        setRequests(data);
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
    loadRequests();
  }, []);

  const filtered = useMemo(() => {
    let result = [...requests];

    result = result.filter((r) => r.userid !== currentUserId);

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.title?.toLowerCase().includes(q) ||
          r.category?.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q) ||
          r.location?.toLowerCase().includes(q) ||
          r.user_firstname?.toLowerCase().includes(q) ||
          r.user_lastname?.toLowerCase().includes(q)
      );
    }

    if (selectedCategory !== "All") {
      result = result.filter((r) => r.category === selectedCategory);
    }

    if (statusFilter !== "All") {
      result = result.filter((r) => r.status === statusFilter);
    }

    if (maxPrice !== "" && !isNaN(parseFloat(maxPrice))) {
      result = result.filter((r) => {
        const budget = r.maxprice ?? 0;
        return parseFloat(budget) <= parseFloat(maxPrice);
      });
    }

    if (sortBy === "price_asc") {
      result.sort((a, b) => (a.maxprice ?? 0) - (b.maxprice ?? 0));
    } else if (sortBy === "price_desc") {
      result.sort((a, b) => (b.maxprice ?? 0) - (a.maxprice ?? 0));
    } else {
      result.sort((a, b) => new Date(b.posteddate) - new Date(a.posteddate));
    }

    return result;
  }, [requests, search, selectedCategory, statusFilter, maxPrice, sortBy, currentUserId]);

  const formatBudget = (maxprice) => {
    if (maxprice != null) {
      return `Up to $${parseFloat(maxprice).toFixed(0)}`;
    }
    return "No max budget";
  };

  const handleRequestCardClick = (item) => {
    if (item.userid === currentUserId || item.status !== "Open") return;
    onMessageBuyer &&
      onMessageBuyer(
        item.userid,
        item.requestid,
        item.title,
        item.maxprice
      );
  };

  return (
    <div className="mp-page">
      <div className="mp-hero">
        <div className="mp-search-wrap">
          <img src="/search.png" alt="" className="mp-search-icon-img" />
          <input
            className="mp-search-input"
            type="text"
            placeholder="Search requests by title, category, description, or location..."
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
            <option value="Open">Open</option>
            <option value="Fulfilled">Fulfilled</option>
            <option value="Closed">Closed</option>
          </select>

          <div className="mp-price-wrap">
            <span className="mp-price-symbol">$</span>
            <input
              className="mp-price-input"
              type="number"
              placeholder="Max budget"
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

      <div className="mp-results-bar">
        <span className="mp-results-count">
          {loading
            ? "Loading..."
            : `${filtered.length} request${filtered.length !== 1 ? "s" : ""} found`}
        </span>
        <button className="mp-create-btn" onClick={() => setShowModal(true)}>
          + Post a Request
        </button>
      </div>

      {loading ? (
        <div className="mp-loading">
          <div className="mp-spinner"></div>
          <p>Loading requests...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="mp-empty">
          <span className="mp-empty-icon"></span>
          <h3>No requests found</h3>
          <p>Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="mp-grid">
          {filtered.map((item, i) => (
            <div
              className="mp-request-card"
              key={item.requestid}
              style={{
                animationDelay: `${i * 40}ms`,
                cursor:
                  item.userid !== currentUserId && item.status === "Open"
                    ? "pointer"
                    : "default",
              }}
              onClick={() => handleRequestCardClick(item)}
            >
              <div className="mp-request-card-top">
                @{item.user_username || "user"}
              </div>
              <div className="mp-request-card-main">
                <h3 className="mp-request-card-title">{item.title}</h3>
                <p className="mp-request-card-desc">
                  {item.description || "No details provided."}
                </p>
              </div>
              <div className="mp-request-card-bottom">
                {formatBudget(item.maxprice)}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <CreateBuyerRequestModal
          token={token}
          onClose={() => {
            setShowModal(false);
            loadRequests();
          }}
        />
      )}
      <ToastContainer toasts={toasts} />
    </div>
  );
}