import { useState, useCallback } from "react";

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  return { toasts, showToast };
}

const ICONS = {
  success: "✓",
  error: "✕",
  info: "ℹ",
};

const COLORS = {
  success: { bg: "#166534", border: "#16a34a", icon: "#4ade80" },
  error:   { bg: "#7f1d1d", border: "#dc2626", icon: "#f87171" },
  info:    { bg: "#1e3a5f", border: "#3b82f6", icon: "#93c5fd" },
};

export function ToastContainer({ toasts }) {
  return (
    <>
      <div className="toast-container">
        {toasts.map((t) => {
          const c = COLORS[t.type] || COLORS.success;
          return (
            <div
              key={t.id}
              className="toast-item"
              style={{
                background: c.bg,
                borderLeft: `4px solid ${c.border}`,
              }}
            >
              <span className="toast-msg">{t.message}</span>
            </div>
          );
        })}
      </div>

      <style>{`
        .toast-container {
          position: fixed;
          bottom: 1.5rem;
          right: 1.5rem;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          pointer-events: none;
        }

        .toast-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.8rem 1.2rem;
          border-radius: 10px;
          min-width: 240px;
          max-width: 360px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
          animation: toastIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
          pointer-events: auto;
        }

        @keyframes toastIn {
          from { opacity: 0; transform: translateX(40px) scale(0.95); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }

        .toast-icon {
          font-size: 0.9rem;
          font-weight: 700;
          flex-shrink: 0;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.1);
        }

        .toast-msg {
          font-size: 0.875rem;
          color: #fff;
          font-weight: 500;
          line-height: 1.4;
        }
      `}</style>
    </>
  );
}
