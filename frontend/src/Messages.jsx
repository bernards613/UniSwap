import { useEffect, useState } from "react";
import "./marketplace.css";

export default function Messages({ token, onOpenConversation }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    setLoading(true);
    setError("");
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      const response = await fetch(`${apiBaseUrl}/messages/inbox`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      } else {
        const errData = await response.json();
        setError(errData.detail || "Failed to load messages");
      }
    } catch (err) {
      console.error("Error loading conversations:", err);
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = dateStr.endsWith("Z") || dateStr.includes("+") 
      ? new Date(dateStr) 
      : new Date(dateStr + "Z");
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="mp-page">
      <div className="mp-hero">
        <h2 style={{ margin: 0, fontSize: "1.5rem" }}>Messages</h2>
        <p style={{ margin: "0.5rem 0 0", color: "#888", fontSize: "0.9rem" }}>
          Your conversations with other users
        </p>
      </div>

      {loading ? (
        <div className="mp-loading">
          <div className="mp-spinner"></div>
          <p>Loading conversations...</p>
        </div>
      ) : error ? (
        <div className="mp-empty">
          <span className="mp-empty-icon"></span>
          <h3>Error</h3>
          <p>{error}</p>
          <button className="mp-create-btn" onClick={loadConversations} style={{ marginTop: "1rem" }}>
            Try Again
          </button>
        </div>
      ) : conversations.length === 0 ? (
        <div className="mp-empty">
          <span className="mp-empty-icon"></span>
          <h3>No messages yet</h3>
          <p>Start a conversation by messaging a seller on any listing.</p>
        </div>
      ) : (
        <div className="msg-list">
          {conversations.map((conv) => (
            <div
              key={conv.conversationid}
              className="msg-item"
              onClick={() => onOpenConversation(conv.conversationid)}
            >
              <div className="msg-avatar">
                {conv.other_user?.firstname?.charAt(0)?.toUpperCase() || "?"}
              </div>
              <div className="msg-content">
                <div className="msg-header">
                  <span className="msg-name">
                    {conv.other_user?.firstname} {conv.other_user?.lastname}
                  </span>
                  <span className="msg-time">
                    {formatDate(conv.last_message?.timestamp)}
                  </span>
                </div>
                <div className="msg-item-info">
                  Re: {conv.item_description || "Item"} - ${conv.item_price?.toFixed(2) || "0.00"}
                </div>
                <div className="msg-preview">
                  {conv.last_message?.is_mine && <span style={{ color: "#888" }}>You: </span>}
                  {conv.last_message?.content || "No messages yet"}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .msg-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .msg-item {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          padding: 1rem;
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.07);
          cursor: pointer;
          transition: transform 0.15s, box-shadow 0.15s;
        }

        .msg-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.12);
        }

        .msg-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, #f0c040 0%, #e0b030 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          font-weight: 700;
          color: #1a1a1a;
          flex-shrink: 0;
        }

        .msg-content {
          flex: 1;
          min-width: 0;
        }

        .msg-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.25rem;
        }

        .msg-name {
          font-weight: 600;
          font-size: 0.95rem;
          color: #1a1a1a;
        }

        .msg-time {
          font-size: 0.75rem;
          color: #888;
        }

        .msg-item-info {
          font-size: 0.8rem;
          color: #666;
          margin-bottom: 0.25rem;
        }

        .msg-preview {
          font-size: 0.875rem;
          color: #555;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        html.dark-mode .msg-item {
          background: #1e1e1e;
        }

        html.dark-mode .msg-name {
          color: #fff;
        }

        html.dark-mode .msg-preview {
          color: #aaa;
        }
      `}</style>
    </div>
  );
}
