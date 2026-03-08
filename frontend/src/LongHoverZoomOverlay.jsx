/**
 * Shown after 1s continuous hover on a listing card.
 * Large almost-full-screen image. Click opens listing detail; mouse leave closes instantly.
 */
export default function LongHoverZoomOverlay({ listing, onOpenDetail, onClose }) {
  if (!listing) return null;

  return (
    <div
      className="long-hover-zoom-overlay"
      onMouseLeave={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image preview"
    >
      <div
        className="long-hover-zoom-image-wrap"
        onClick={() => {
          onOpenDetail(listing);
          onClose();
        }}
      >
        {listing.photo ? (
          <img src={listing.photo} alt="" className="long-hover-zoom-img" />
        ) : (
          <div className="long-hover-zoom-placeholder" />
        )}
      </div>
    </div>
  );
}
