import { useEffect } from "react";

export default function ImageZoomModal({ imageUrl, onClose }) {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (imageUrl) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [imageUrl, onClose]);

  if (!imageUrl) return null;
  return (
    <div
      className="image-zoom-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="View image"
    >
      <button
        type="button"
        className="image-zoom-close"
        onClick={onClose}
        aria-label="Close"
      >
        ×
      </button>
      <div className="image-zoom-content" onClick={(e) => e.stopPropagation()}>
        <img src={imageUrl} alt="Listing" className="image-zoom-img" />
      </div>
      <style>{`
        .image-zoom-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          padding: 2rem;
        }
        .image-zoom-close {
          position: absolute;
          top: 1rem;
          right: 1rem;
          width: 44px;
          height: 44px;
          border: none;
          background: rgba(255,255,255,0.15);
          color: #fff;
          font-size: 1.75rem;
          line-height: 1;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.15s;
        }
        .image-zoom-close:hover {
          background: rgba(255,255,255,0.25);
        }
        .image-zoom-content {
          max-width: 95vw;
          max-height: 90vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .image-zoom-img {
          max-width: 100%;
          max-height: 90vh;
          width: auto;
          height: auto;
          object-fit: contain;
          border-radius: 8px;
        }
      `}</style>
    </div>
  );
}
