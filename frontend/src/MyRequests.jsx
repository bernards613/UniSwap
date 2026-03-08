import { useEffect, useState } from "react";
import EditRequestModal from "./EditRequestModal.jsx";
import ConfirmModal from "./ConfirmModal.jsx";
import { useToast, ToastContainer } from "./Toast.jsx";
import "./marketplace.css";

export default function MyRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRequest, setEditingRequest] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState(null);
  const [activeRequestId, setActiveRequestId] = useState(null);
  const { toasts, showToast } = useToast();
  const currentUsername = typeof localStorage !== "undefined" ? localStorage.getItem("username") || "me" : "me";

  const token = localStorage.getItem("token");

  const loadRequests = async () => {
    setLoading(true);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      const response = await fetch(`${apiBaseUrl}/buyer-requests/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) setRequests(Array.isArray(data) ? data : []);
      else console.error("Error fetching:", data);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleOpenEdit = (req) => setEditingRequest(req);
  const handleCloseEdit = () => setEditingRequest(null);

  const handleSaveEdit = (updated) => {
    setRequests((prev) =>
      prev.map((r) => (r.requestid === updated.requestid ? { ...r, ...updated } : r))
    );
    setEditingRequest(null);
  };

  const handleDelete = (requestid) => {
    setConfirmConfig({
      message: "Delete this request?",
      subtext: "This cannot be undone.",
      confirmLabel: "Delete",
      danger: true,
      onCancel: () => setConfirmConfig(null),
      onConfirm: async () => {
        setConfirmConfig(null);
        try {
          const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
          const response = await fetch(`${apiBaseUrl}/buyer-requests/delete/${requestid}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await response.json();
          if (response.ok) {
            setRequests((prev) => prev.filter((r) => r.requestid !== requestid));
            setActiveRequestId(null);
            showToast("Request deleted");
          } else {
            showToast(data.detail || "Could not delete request", "error");
          }
        } catch (err) {
          console.error("Delete error:", err);
          showToast("Network error while deleting", "error");
        }
      },
    });
  };

  const formatBudget = (maxprice) => {
    if (maxprice != null) return `Up to $${parseFloat(maxprice).toFixed(0)}`;
    return "No max budget";
  };

  return (
    <div className="mp-page">
      <div className="mp-results-bar" style={{ marginTop: 18 }}>
        <span className="mp-results-count">
          {loading
            ? "Loading..."
            : `${requests.length} request${requests.length !== 1 ? "s" : ""}`}
        </span>
      </div>

      {loading ? (
        <div className="mp-loading">
          <div className="mp-spinner"></div>
          <p>Loading your requests...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="mp-empty">
          <span className="mp-empty-icon"></span>
          <h3>No requests yet</h3>
          <p>Post a request from the Buyer Requests page, then manage it here.</p>
        </div>
      ) : (
        <div className="mp-grid">
          {requests.map((item, i) => (
            <div
              key={item.requestid}
              className={`mp-request-card ${activeRequestId === item.requestid ? "show-actions" : ""}`}
              style={{ animationDelay: `${i * 40}ms`, cursor: "pointer" }}
              onClick={() => setActiveRequestId((prev) => (prev === item.requestid ? null : item.requestid))}
              onMouseLeave={() => setActiveRequestId(null)}
            >
              <div className="mp-request-card-top">
                @{currentUsername}
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
              <div
                className="mp-request-card-actions"
                onClick={(e) => e.target === e.currentTarget && setActiveRequestId(null)}
              >
                <button
                  type="button"
                  className="mp-action-btn alt"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenEdit(item);
                    setActiveRequestId(null);
                  }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="mp-action-btn danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(item.requestid);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingRequest && (
        <EditRequestModal
          request={editingRequest}
          onClose={handleCloseEdit}
          onSave={handleSaveEdit}
        />
      )}
      {confirmConfig && <ConfirmModal {...confirmConfig} />}
      <ToastContainer toasts={toasts} />
    </div>
  );
}
