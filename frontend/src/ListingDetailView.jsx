import ListingPhotoCarousel from "./ListingPhotoCarousel.jsx";
import { listingPhotoUrls } from "./listingPhotos.jsx";

export default function ListingDetailView({ listing, onClose, onPurchase, onBookmark, onRemoveBookmark, onMessage, statusColor, purchaseDate }) {
  if (!listing) return null;

  const isPurchase = Boolean(purchaseDate);
  const status = listing.status || "Available";
  const rawName = (listing.title || "").trim();
  const productName = rawName
    ? (rawName.length > 60 ? rawName.slice(0, 60) + "…" : rawName)
    : listing.description
      ? (listing.description.length > 60 ? listing.description.slice(0, 60) + "…" : listing.description)
      : listing.category || "Item";

  const sellerName = listing.seller_username || "Seller";

  let purchaseDateText = "";
  if (purchaseDate) {
    try {
      const d = new Date(purchaseDate);
      purchaseDateText = d.toLocaleDateString(undefined, { dateStyle: "medium" }) + " at " + d.toLocaleTimeString(undefined, { timeStyle: "short" });
    } catch {
      purchaseDateText = purchaseDate;
    }
  }

  return (
    <div className="listing-detail-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Listing details">
      <div className="listing-detail-container" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="listing-detail-close" onClick={onClose} aria-label="Close">×</button>
        <div className="listing-detail-layout">
          <div className="listing-detail-image-section">
            <ListingPhotoCarousel urls={listingPhotoUrls(listing)} variant="detail" />
          </div>

          <div className="listing-detail-info">
            <span
              className="listing-detail-status"
              style={{ backgroundColor: statusColor ? statusColor(status) : "#16a34a" }}
            >
              {status}
            </span>
            <h2 className="listing-detail-name">{productName}</h2>
            <p className="listing-detail-seller">by {sellerName}</p>

            <p className="listing-detail-location">
              <img src="/location.png" alt="" className="listing-detail-icon-location" />
              {listing.location || "—"}
            </p>

            <div className="listing-detail-description-block">
              <span className="listing-detail-description-label">Description</span>
              <div className="listing-detail-description">{listing.description || "No description."}</div>
            </div>
            <p className="listing-detail-price">${parseFloat(listing.price).toFixed(2)}</p>

            {isPurchase && purchaseDateText && (
              <p className="listing-detail-purchase-date">Purchased on {purchaseDateText}</p>
            )}

            {!isPurchase && (
              <div className="listing-detail-actions">
                {onRemoveBookmark && (
                  <button
                    type="button"
                    className="listing-detail-btn listing-detail-btn-bookmark"
                    style={{ backgroundColor: "#dc2626" }}
                    onClick={onRemoveBookmark}
                  >
                    <img src="/bookmark-white.png" alt="" className="listing-detail-btn-icon" />
                    Remove Bookmark
                  </button>
                )}
                <button
                  type="button"
                  className="listing-detail-btn listing-detail-btn-message"
                  onClick={() => onMessage && onMessage(listing.sellerid, listing.itemid, listing.description, listing.price)}
                >
                  <img src="/comment.png" alt="" className="listing-detail-btn-icon" />
                  Message
                </button>
                {!onRemoveBookmark && onBookmark && (
                  <button
                    type="button"
                    className="listing-detail-btn listing-detail-btn-bookmark"
                    onClick={() => onBookmark(listing.itemid)}
                  >
                    <img src="/bookmark-white.png" alt="" className="listing-detail-btn-icon" />
                    Bookmark
                  </button>
                )}
                {listing.status === "Available" && (
                  <button
                    type="button"
                    className="listing-detail-btn listing-detail-btn-buy"
                    onClick={() => onPurchase(listing.itemid)}
                  >
                    Buy it now
                  </button>
                )}
              </div> 
            )}
          </div>
        </div>
      </div>
    </div>
  );
}