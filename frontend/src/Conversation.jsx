import { useEffect, useState, useRef } from "react";
import "./marketplace.css";

export default function Conversation({ token, conversationId, newChatData, onBack, onConversationCreated }) {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [currentConvId, setCurrentConvId] = useState(conversationId);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (conversationId) {
      setCurrentConvId(conversationId);
      loadConversation(conversationId);
    } else if (newChatData) {
      setLoading(false);
      if (newChatData.isBuyerRequest) {
        setConversation({
          other_user: { firstname: "Buyer", userid: newChatData.sellerId },
          request: {
            requestid: newChatData.requestId,
            title: newChatData.itemDescription,
            maxprice: newChatData.itemPrice
          }
        });
      } else {
        setConversation({
          other_user: { firstname: "Seller", userid: newChatData.sellerId },
          item: { 
            itemid: newChatData.itemId, 
            description: newChatData.itemDescription,
            price: newChatData.itemPrice
          }
        });
      }
      setMessages([]);
    }
  }, [conversationId, newChatData]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadConversation = async (convId) => {
    if (!convId) return;
    setLoading(true);
    setError("");
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      const response = await fetch(`${apiBaseUrl}/messages/conversation/${convId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setConversation(data);
        setMessages(data.messages || []);
      } else {
        const errData = await response.json();
        setError(errData.detail || "Failed to load conversation");
      }
    } catch (err) {
      console.error("Error loading conversation:", err);
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    const receiverId = newChatData?.sellerId || conversation?.other_user?.userid;
    const itemId = newChatData?.itemId || conversation?.item?.itemid;
    const requestId = newChatData?.requestId || conversation?.request?.requestid;

    if (!receiverId || (!itemId && !requestId)) {
      alert("Missing conversation data");
      return;
    }

    setSending(true);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      
      const payload = {
        receiverid: receiverId,
        messagecontent: newMessage.trim(),
      };
      
      if (requestId) {
        payload.requestid = requestId;
      } else {
        payload.itemid = itemId;
      }
      
      const response = await fetch(`${apiBaseUrl}/messages/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        setNewMessage("");
        
        if (!currentConvId && data.conversationid) {
          setCurrentConvId(data.conversationid);
          if (onConversationCreated) {
            onConversationCreated(data.conversationid);
          }
          loadConversation(data.conversationid);
        } else {
          loadConversation(currentConvId);
        }
      } else {
        const errData = await response.json();
        alert(errData.detail || "Failed to send message");
      }
    } catch (err) {
      console.error("Error sending message:", err);
      alert("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const parseUTCDate = (dateStr) => {
    if (!dateStr) return null;
    if (dateStr.endsWith("Z") || dateStr.includes("+")) {
      return new Date(dateStr);
    }
    return new Date(dateStr + "Z");
  };

  const formatTime = (dateStr) => {
    const date = parseUTCDate(dateStr);
    if (!date) return "";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateStr) => {
    const date = parseUTCDate(dateStr);
    if (!date) return "";
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="mp-page">
        <div className="mp-loading">
          <div className="mp-spinner"></div>
          <p>Loading conversation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mp-page">
        <div className="mp-empty">
          <span className="mp-empty-icon"></span>
          <h3>Error</h3>
          <p>{error}</p>
          <button className="mp-create-btn" onClick={onBack} style={{ marginTop: "1rem" }}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="conv-page">
      {/* Header */}
      <div className="conv-header">
        <button className="conv-back-btn" onClick={onBack}>
          ← Back
        </button>
        <div className="conv-header-info">
          <div className="conv-avatar">
            {conversation?.other_user?.firstname?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <div>
            <div className="conv-name">
              {conversation?.other_user?.firstname} {conversation?.other_user?.lastname}
            </div>
            <div className="conv-item-info">
              Re: {conversation?.item?.description || conversation?.request?.title || "Item"} - {conversation?.request ? "Budget: " : ""}${(conversation?.item?.price || conversation?.request?.maxprice)?.toFixed(2) || "Flexible"}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="conv-messages">
        {messages.length === 0 ? (
          <div className="conv-empty">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const showDate =
              index === 0 ||
              formatDate(msg.messagetimestamp) !== formatDate(messages[index - 1]?.messagetimestamp);

            return (
              <div key={msg.messageid}>
                {showDate && (
                  <div className="conv-date-divider">
                    <span>{formatDate(msg.messagetimestamp)}</span>
                  </div>
                )}
                <div className={`conv-bubble-wrap ${msg.is_mine ? "mine" : "theirs"}`}>
                  <div className={`conv-bubble ${msg.is_mine ? "mine" : "theirs"}`}>
                    <p>{msg.messagecontent}</p>
                    <span className="conv-time">{formatTime(msg.messagetimestamp)}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form className="conv-input-wrap" onSubmit={sendMessage}>
        <input
          type="text"
          className="conv-input"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          disabled={sending}
        />
        <button type="submit" className="conv-send-btn" disabled={!newMessage.trim() || sending}>
          {sending ? "..." : "Send"}
        </button>
      </form>

      <style>{`
        .conv-page {
          display: flex;
          flex-direction: column;
          height: calc(100vh - 80px);
          max-width: 800px;
          margin: 0 auto;
        }

        .conv-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 1.5rem;
          background: #fff;
          border-bottom: 1px solid #e2e8f0;
        }

        .conv-back-btn {
          background: none;
          border: none;
          font-size: 1rem;
          color: #666;
          cursor: pointer;
          padding: 0.5rem;
          transition: color 0.15s;
        }

        .conv-back-btn:hover {
          color: #1a1a1a;
        }

        .conv-header-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .conv-avatar {
          width: 40px;
          height: 40px;
          min-width: 40px;
          min-height: 40px;
          flex-shrink: 0;
          border-radius: 50%;
          background: linear-gradient(135deg, #f0c040 0%, #e0b030 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          font-weight: 700;
          color: #1a1a1a;
        }

        .conv-name {
          font-weight: 600;
          font-size: 1rem;
          color: #1a1a1a;
        }

        .conv-item-info {
          font-size: 0.8rem;
          color: #888;
        }

        .conv-messages {
          flex: 1;
          overflow-y: auto;
          padding: 1rem 1.5rem;
          background: #f8f9fa;
        }

        .conv-empty {
          text-align: center;
          color: #888;
          padding: 2rem;
        }

        .conv-date-divider {
          text-align: center;
          margin: 1rem 0;
        }

        .conv-date-divider span {
          background: #e2e8f0;
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.75rem;
          color: #666;
        }

        .conv-bubble-wrap {
          display: flex;
          margin-bottom: 0.5rem;
        }

        .conv-bubble-wrap.mine {
          justify-content: flex-end;
        }

        .conv-bubble-wrap.theirs {
          justify-content: flex-start;
        }

        .conv-bubble {
          max-width: 70%;
          padding: 0.75rem 1rem;
          border-radius: 16px;
          position: relative;
        }

        .conv-bubble.mine {
          background: #f0c040;
          color: #1a1a1a;
          border-bottom-right-radius: 4px;
        }

        .conv-bubble.theirs {
          background: #fff;
          color: #1a1a1a;
          border-bottom-left-radius: 4px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }

        .conv-bubble p {
          margin: 0 0 0.25rem;
          font-size: 0.95rem;
          line-height: 1.4;
        }

        .conv-time {
          font-size: 0.7rem;
          color: rgba(0,0,0,0.5);
        }

        .conv-bubble.mine .conv-time {
          color: rgba(0,0,0,0.6);
        }

        .conv-input-wrap {
          display: flex;
          gap: 0.75rem;
          padding: 1rem 1.5rem;
          background: #fff;
          border-top: 1px solid #e2e8f0;
        }

        .conv-input {
          flex: 1;
          padding: 0.75rem 1rem;
          border: 2px solid #e2e8f0;
          border-radius: 24px;
          font-size: 0.95rem;
          font-family: inherit;
          outline: none;
          transition: border-color 0.15s;
        }

        .conv-input:focus {
          border-color: #f0c040;
        }

        .conv-send-btn {
          background: #f0c040;
          color: #1a1a1a;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 24px;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: background 0.15s, opacity 0.15s;
        }

        .conv-send-btn:hover:not(:disabled) {
          background: #e0b030;
        }

        .conv-send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        html.dark-mode .conv-header,
        html.dark-mode .conv-input-wrap {
          background: #1a1a1a;
          border-color: #333;
        }

        html.dark-mode .conv-messages {
          background: #121212;
        }

        html.dark-mode .conv-bubble.theirs {
          background: #2a2a2a;
          color: #fff;
        }

        html.dark-mode .conv-name {
          color: #fff;
        }

        html.dark-mode .conv-input {
          background: #2a2a2a;
          border-color: #333;
          color: #fff;
        }

        html.dark-mode .conv-date-divider span {
          background: #333;
          color: #888;
        }
      `}</style>
    </div>
  );
}
