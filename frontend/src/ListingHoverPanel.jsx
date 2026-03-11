/**
 * Side panel shown after 1.5s hover on a listing card.
 * Shows product name, seller, description, price. Position: left or right of card.
 * Height: top-aligned if panel shorter than card; vertically centered if taller.
 */
import { useRef, useEffect, useState } from "react";

const PANEL_WIDTH = 260;

export default function ListingHoverPanel({ listing, side, cardWrapRef, listingItemId, onClose }) {
  const panelRef = useRef(null);
  const [align, setAlign] = useState("top"); // "top" | "center"

  useEffect(() => {
    if (!panelRef.current || !cardWrapRef?.current || listingItemId == null) return;
    const panelH = panelRef.current.offsetHeight;
    const wrapEl = cardWrapRef.current[listingItemId];
    const cardH = wrapEl?.offsetHeight ?? 220;
    setAlign(panelH > cardH ? "center" : "top");
  }, [listing, cardWrapRef, listingItemId]);

  if (!listing) return null;

  const productName = (listing.title || "").trim()
    ? (listing.title.length > 40 ? listing.title.slice(0, 40) + "…" : listing.title)
    : listing.description
      ? (listing.description.length > 40 ? listing.description.slice(0, 40) + "…" : listing.description)
      : listing.category || "Item";
  const sellerName = listing.seller_username || "Seller";

  return (
    <div
      ref={panelRef}
      className={`listing-hover-panel listing-hover-panel--${side} listing-hover-panel--${align}`}
      onMouseLeave={onClose}
    >
      <div className="listing-hover-panel-inner">
        <p className="listing-hover-panel-name">{productName}</p>
        <p className="listing-hover-panel-seller">by {sellerName}</p>
        <p className="listing-hover-panel-location">Location: {listing.location || "—"}</p>
        <p className="listing-hover-panel-desc">{listing.description || "No description."}</p>
        <p className="listing-hover-panel-price">${parseFloat(listing.price).toFixed(2)}</p>
      </div>
    </div>
  );
}

export { PANEL_WIDTH };
