import { useEffect, useState, useRef } from "react";
import { useToast, ToastContainer } from "./Toast.jsx";
import "./marketplace.css";

const IMAGE_PREFIX = "[IMAGE]";

export default function Conversation({ token, conversationId, newChatData, onBack, onConversationCreated }) {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [pendingImageUrl, setPendingImageUrl] = useState(null);
  const [lightboxUrl, setLightboxUrl] = useState(null);
  const [error, setError] = useState("");
  const [currentConvId, setCurrentConvId] = useState(conversationId);
  const messagesEndRef = useRef(null);
  const imageInputRef = useRef(null);
  const { toasts, showToast } = useToast();

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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadConversation = async (convId) => {
    if (!convId) return;
    setLoading(true);
    setError("");
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      const response = await fetch(`${apiBaseUrl}/messages/conversation/${convId}`, {
        headers: { Authorization: `Bearer ${token}` },
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
    const trimmed = newMessage.trim();
    if ((!trimmed && !pendingImageUrl) || sending || uploadingImage) return;

    const receiverId = newChatData?.sellerId || conversation?.other_user?.userid;
    const itemId = newChatData?.itemId || conversation?.item?.itemid;
    const requestId = newChatData?.requestId || conversation?.request?.requestid;

    if (!receiverId || (!itemId && !requestId)) {
      showToast("Missing conversation data", "error");
      return;
    }

    setSending(true);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      const messagecontent = pendingImageUrl
        ? `${IMAGE_PREFIX}${pendingImageUrl}${trimmed ? `\n${trimmed}` : ""}`
        : trimmed;

      const payload = { receiverid: receiverId, messagecontent };
      if (requestId) payload.requestid = requestId;
      else payload.itemid = itemId;

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
        setPendingImageUrl(null);
        if (imageInputRef.current) imageInputRef.current.value = "";
        if (!currentConvId && data.conversationid) {
          setCurrentConvId(data.conversationid);
          if (onConversationCreated) onConversationCreated(data.conversationid);
          loadConversation(data.conversationid);
        } else {
          loadConversation(currentConvId);
        }
      } else {
        const errData = await response.json();
        showToast(errData.detail || "Failed to send message", "error");
      }
    } catch (err) {
      console.error("Error sending message:", err);
      showToast("Failed to send message", "error");
    } finally {
      setSending(false);
    }
  };

  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Please select an image file", "error");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      showToast("Image must be under 8MB", "error");
      return;
    }

    setUploadingImage(true);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const uploadRes = await fetch(`${apiBaseUrl}/messages/upload-image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ image: base64 }),
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.json();
        showToast(err.detail || "Image upload failed", "error");
        return;
      }

      const { url } = await uploadRes.json();
      setPendingImageUrl(url);
    } catch (err) {
      console.error("Image send error:", err);
      showToast("Failed to upload photo", "error");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleUnsend = async (messageid) => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      const response = await fetch(`${apiBaseUrl}/messages/${messageid}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setMessages((prev) => prev.filter((m) => m.messageid !== messageid));
        showToast("Message unsent");
      } else {
        const err = await response.json();
        showToast(err.detail || "Could not unsend message", "error");
      }
    } catch (err) {
      console.error("Unsend error:", err);
      showToast("Network error", "error");
    }
  };

  const parseUTCDate = (dateStr) => {
    if (!dateStr) return null;
    return dateStr.endsWith("Z") || dateStr.includes("+")
      ? new Date(dateStr)
      : new Date(dateStr + "Z");
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

  const isImageMessage = (content) => content && content.startsWith(IMAGE_PREFIX);
  const getImageUrl = (content) => {
    const rest = (content || "").slice(IMAGE_PREFIX.length);
    const newlineIdx = rest.indexOf("\n");
    return newlineIdx === -1 ? rest : rest.slice(0, newlineIdx);
  };
  const getImageCaption = (content) => {
    const rest = (content || "").slice(IMAGE_PREFIX.length);
    const newlineIdx = rest.indexOf("\n");
    if (newlineIdx === -1) return "";
    return rest.slice(newlineIdx + 1).trim();
  };
  const clearPendingImage = () => {
    setPendingImageUrl(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
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
        <button className="conv-back-btn" onClick={onBack}>← Back</button>
        <div className="conv-header-info">
          <div className="conv-avatar">
            {conversation?.other_user?.firstname?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <div>
            <div className="conv-name">
              {conversation?.other_user?.firstname} {conversation?.other_user?.lastname}
            </div>
            <div className="conv-item-info">
              Re: {conversation?.item?.description || conversation?.request?.title || "Item"} -{" "}
              {conversation?.request ? "Budget: " : ""}$
              {(conversation?.item?.price || conversation?.request?.maxprice)?.toFixed(2) || "Flexible"}
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
                  {/* Unsend button — only for own messages */}
                  {msg.is_mine && (
                    <button
                      type="button"
                      className="conv-unsend-btn"
                      title="Unsend message"
                      onClick={() => handleUnsend(msg.messageid)}
                    >
                      x
                    </button>
                  )}
                  <div className={`conv-bubble ${msg.is_mine ? "mine" : "theirs"}`}>
                    {isImageMessage(msg.messagecontent) ? (
                      <>
                        <img
                          src={getImageUrl(msg.messagecontent)}
                          alt="Sent photo"
                          className="conv-msg-image"
                          onClick={() => setLightboxUrl(getImageUrl(msg.messagecontent))}
                        />
                        {getImageCaption(msg.messagecontent) ? (
                          <p className="conv-image-caption">{getImageCaption(msg.messagecontent)}</p>
                        ) : null}
                        <span className="conv-time">{formatTime(msg.messagetimestamp)}</span>
                      </>
                    ) : (
                      <>
                        <p>{msg.messagecontent}</p>
                        <span className="conv-time">{formatTime(msg.messagetimestamp)}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <form className="conv-input-wrap" onSubmit={sendMessage}>
        {/* Hidden file input */}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleImageSelect}
        />

        <div className="conv-composer">
          {pendingImageUrl ? (
            <div className="conv-attach-preview">
              <img src={pendingImageUrl} alt="Attachment preview" className="conv-attach-img" />
              <button
                type="button"
                className="conv-attach-remove"
                title="Remove photo"
                onClick={clearPendingImage}
                disabled={sending || uploadingImage}
              >
                x
              </button>
            </div>
          ) : null}

          <div className="conv-composer-row">
            {/* Image upload button */}
            <button
              type="button"
              className="conv-img-btn"
              title={pendingImageUrl ? "Replace photo" : "Add a photo"}
              onClick={() => imageInputRef.current?.click()}
              disabled={uploadingImage || sending}
            >
              {uploadingImage ? (
                <span className="conv-img-uploading">...</span>
              ) : (
                <img src="/camera.png" alt="Add photo" />
              )}
            </button>

            <input
              type="text"
              className="conv-input"
              placeholder={pendingImageUrl ? "Add a message (optional)..." : "Type a message..."}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={sending || uploadingImage}
            />
            <button
              type="submit"
              className="conv-send-btn"
              disabled={(!newMessage.trim() && !pendingImageUrl) || sending || uploadingImage}
            >
              {sending ? "..." : "Send"}
            </button>
          </div>
        </div>
      </form>

      <ToastContainer toasts={toasts} />

      {lightboxUrl ? (
        <div
          className="conv-lightbox"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setLightboxUrl(null);
          }}
        >
          <div className="conv-lightbox-inner">
            <button
              type="button"
              className="conv-lightbox-close"
              aria-label="Close"
              onClick={() => setLightboxUrl(null)}
            >
              x
            </button>
            <img src={lightboxUrl} alt="Enlarged" className="conv-lightbox-img" />
          </div>
        </div>
      ) : null}

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
        .conv-back-btn:hover { color: #1a1a1a; }

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

        .conv-name { font-weight: 600; font-size: 1rem; color: #1a1a1a; }
        .conv-item-info { font-size: 0.8rem; color: #888; }

        .conv-messages {
          flex: 1;
          overflow-y: auto;
          padding: 1rem 1.5rem;
          background: #f8f9fa;
        }

        .conv-empty { text-align: center; color: #888; padding: 2rem; }

        .conv-date-divider { text-align: center; margin: 1rem 0; }
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
          position: relative;
        }
        .conv-bubble-wrap.mine { justify-content: flex-end; }
        .conv-bubble-wrap.theirs { justify-content: flex-start; }

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
          padding-top: 1rem;
          padding-right: 2.25rem;
        }
        .conv-bubble.theirs {
          background: #fff;
          color: #1a1a1a;
          border-bottom-left-radius: 4px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }
        .conv-bubble p { margin: 0 0 0.25rem; font-size: 0.95rem; line-height: 1.4; }
        .conv-time { font-size: 0.7rem; color: rgba(0,0,0,0.5); }
        .conv-bubble.mine .conv-time { color: rgba(0,0,0,0.6); }

        .conv-input-wrap {
          display: flex;
          padding: 1rem 1.5rem;
          background: #fff;
          border-top: 1px solid #e2e8f0;
        }

        .conv-composer { width: 100%; display: flex; flex-direction: column; gap: 0.5rem; }
        .conv-composer-row { display: flex; gap: 0.5rem; align-items: center; }

        .conv-img-btn {
          width: 44px;
          height: 44px;
          border-radius: 999px;
          border: 2px solid #e2e8f0;
          background: #fff;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .conv-img-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .conv-img-btn img { width: 20px; height: 20px; }

        .conv-attach-preview {
          position: relative;
          width: 100%;
          max-height: 220px;
          border-radius: 14px;
          overflow: hidden;
          border: 1px solid #e2e8f0;
          background: #fff;
        }
        .conv-attach-img {
          width: 100%;
          max-height: 220px;
          object-fit: contain;
          display: block;
          background: #0b0b0b;
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
        .conv-input:focus { border-color: #f0c040; }

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
        .conv-send-btn:hover:not(:disabled) { background: #e0b030; }
        .conv-send-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .conv-msg-image {
          width: 100%;
          max-width: 320px;
          border-radius: 12px;
          display: block;
          cursor: pointer;
        }
        .conv-image-caption {
          margin-top: 0.5rem;
          margin-bottom: 0.25rem;
          white-space: pre-wrap;
        }

        .conv-lightbox {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.55);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          z-index: 9999;
        }
        .conv-lightbox-inner {
          position: relative;
          max-width: min(1000px, 92vw);
          max-height: 86vh;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0,0,0,0.35);
          background: #0b0b0b;
        }
        .conv-lightbox-img {
          display: block;
          max-width: min(1000px, 92vw);
          max-height: 86vh;
          object-fit: contain;
        }
        html.dark-mode .conv-header,
        html.dark-mode .conv-input-wrap {
          background: #1a1a1a;
          border-color: #333;
        }
        html.dark-mode .conv-messages { background: #121212; }
        html.dark-mode .conv-bubble.theirs { background: #2a2a2a; color: #fff; }
        html.dark-mode .conv-name { color: #fff; }
        html.dark-mode .conv-input { background: #2a2a2a; border-color: #333; color: #fff; }
        html.dark-mode .conv-date-divider span { background: #333; color: #888; }
        html.dark-mode .conv-img-btn { background: #1a1a1a; border-color: #333; }
        html.dark-mode .conv-attach-preview { background: #1a1a1a; border-color: #333; }
      `}</style>
    </div>
  );
}