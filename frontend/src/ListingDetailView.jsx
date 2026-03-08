/**
 * Full listing detail view: large image (left ~75%), product info and actions (right).
 * Used when user clicks a listing card or the long-hover zoom image.
 */
export default function ListingDetailView({ listing, onClose, onPurchase, onBookmark, onMessage, statusColor }) {
  if (!listing) return null;

  const status = listing.status || "Available";
  const productName = listing.description
    ? (listing.description.length > 60 ? listing.description.slice(0, 60) + "…" : listing.description)
    : listing.category || "Item";

  const sellerName = [listing.seller_firstname, listing.seller_lastname].filter(Boolean).join(" ") || "Seller";

  return (
    <div className="listing-detail-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Listing details">
      <div className="listing-detail-container" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="listing-detail-close" onClick={onClose} aria-label="Close">×</button>
        <div className="listing-detail-layout">
          <div className="listing-detail-image-section">
            <div
              className="listing-detail-image"
              style={{ backgroundImage: listing.photo ? `url(${listing.photo})` : "none" }}
            />
          </div>

          <div className="listing-detail-info">
            <span
              className="listing-detail-status"
              style={{ backgroundColor: statusColor ? statusColor(status) : "#16a34a" }}
            >
              {status}
            </span>
            <h2 className="listing-detail-name">{productName}</h2>
            <p className="listing-detail-seller">Seller: {sellerName}</p>
            <div className="listing-detail-description-block">
              <span className="listing-detail-description-label">Description</span>
              <div className="listing-detail-description">{listing.description || "No description."}</div>
            </div>
            <p className="listing-detail-price">${parseFloat(listing.price).toFixed(2)}</p>

            <div className="listing-detail-actions">
              {listing.status === "Available" && (
                <button type="button" className="mp-action-btn listing-detail-btn" onClick={() => onPurchase(listing.itemid)}>
                  Purchase
                </button>
              )}
              <button type="button" className="mp-action-btn alt listing-detail-btn" onClick={() => onBookmark(listing.itemid)}>
                Bookmark
              </button>
              <button type="button" className="mp-action-btn listing-detail-btn" onClick={() => onMessage && onMessage(listing.sellerid, listing.itemid, listing.description, listing.price)}>
                Message
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
