export default function ConfirmModal({
  message,
  subtext,
  confirmLabel = "Confirm",
  danger = false,
  onConfirm,
  onCancel,
}) {
  return (
    <div className="cm-overlay" onClick={onCancel}>
      <div className="cm-card" onClick={(e) => e.stopPropagation()}>
        <div className="cm-icon">{danger ? "🗑️" : "❓"}</div>
        <h3 className="cm-title">{message}</h3>
        {subtext && <p className="cm-subtext">{subtext}</p>}
        <div className="cm-actions">
          <button className="cm-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button
            className={`cm-confirm ${danger ? "cm-confirm-danger" : "cm-confirm-primary"}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>

      <style>{`
        .cm-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9000;
          animation: cmFadeIn 0.15s ease;
        }

        @keyframes cmFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        .cm-card {
          background: #fff;
          border-radius: 16px;
          padding: 2rem;
          width: 100%;
          max-width: 360px;
          text-align: center;
          box-shadow: 0 24px 64px rgba(0, 0, 0, 0.25);
          animation: cmSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        @keyframes cmSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        .cm-icon {
          font-size: 2.5rem;
          margin-bottom: 0.75rem;
        }

        .cm-title {
          margin: 0 0 0.5rem;
          font-size: 1.1rem;
          font-weight: 700;
          color: #1a1a1a;
          line-height: 1.3;
        }

        .cm-subtext {
          margin: 0 0 1.5rem;
          font-size: 0.875rem;
          color: #666;
        }

        .cm-actions {
          display: flex;
          gap: 0.75rem;
          margin-top: 1.5rem;
        }

        .cm-cancel {
          flex: 1;
          padding: 0.7rem;
          border-radius: 10px;
          border: 1.5px solid #ddd;
          background: #fff;
          color: #555;
          font-size: 0.9rem;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s;
        }

        .cm-cancel:hover {
          background: #f5f5f5;
          border-color: #bbb;
        }

        .cm-confirm {
          flex: 1;
          padding: 0.7rem;
          border-radius: 10px;
          border: none;
          font-size: 0.9rem;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          transition: transform 0.1s, box-shadow 0.15s, opacity 0.15s;
        }

        .cm-confirm:hover {
          transform: translateY(-1px);
          opacity: 0.9;
        }

        .cm-confirm-primary {
          background: linear-gradient(135deg, #f0c040, #e0a820);
          color: #1a1a1a;
          box-shadow: 0 4px 12px rgba(240, 192, 64, 0.3);
        }

        .cm-confirm-danger {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: #fff;
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
        }

        /* Dark mode */
        html.dark-mode .cm-card {
          background: #1e1e1e;
          box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6);
        }

        html.dark-mode .cm-title {
          color: #fff;
        }

        html.dark-mode .cm-subtext {
          color: #aaa;
        }

        html.dark-mode .cm-cancel {
          background: #2a2a2a;
          border-color: #444;
          color: #ccc;
        }

        html.dark-mode .cm-cancel:hover {
          background: #333;
        }
      `}</style>
    </div>
  );
}
