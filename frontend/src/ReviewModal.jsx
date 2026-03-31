import { useState } from "react";

export default function ReviewModal({ sellerUsername, transactionId, token, onClose, onSubmitted }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const MAX_CHARS = 300;

  const handleSubmit = async () => {
    if (rating < 1) return;
    setSubmitting(true);
    setError("");
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      const res = await fetch(`${apiBaseUrl}/reviews/${transactionId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rating,
          comment: comment.trim() || null,
        }),
      });
      if (res.ok) {
        onSubmitted && onSubmitted();
      } else {
        const data = await res.json();
        setError(data.detail || "Failed to submit review");
      }
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const displayRating = hoverRating || rating;

  return (
    <div className="review-modal-overlay" onClick={onClose}>
      <div className="review-modal-card" onClick={(e) => e.stopPropagation()}>
        <h3 className="review-modal-title">Review for {sellerUsername}</h3>

        <div className="review-stars-row">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className={`review-star ${star <= displayRating ? "review-star-filled" : ""}`}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              aria-label={`${star} star${star > 1 ? "s" : ""}`}
            >
              ★
            </button>
          ))}
        </div>
        {rating > 0 && <p className="review-rating-label">{rating} / 5</p>}

        <div className="review-comment-wrap">
          <textarea
            className="review-comment-input"
            placeholder="Write a comment (optional)..."
            maxLength={MAX_CHARS}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
          />
          <span className="review-char-count">{comment.length}/{MAX_CHARS}</span>
        </div>

        {error && <p className="review-error">{error}</p>}

        <div className="review-modal-actions">
          <button className="review-cancel-btn" onClick={onClose} disabled={submitting}>Cancel</button>
          <button className="review-submit-btn" onClick={handleSubmit} disabled={rating < 1 || submitting}>
            {submitting ? "Submitting..." : "Submit Review"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function StarRating({ rating, size = "0.85rem" }) {
  return (
    <span className="star-rating-inline" style={{ fontSize: size }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={s <= Math.round(rating) ? "star-filled" : "star-empty"}>★</span>
      ))}
    </span>
  );
}

export function SellerReviewsModal({ sellerUsername, reviews, averageRating, totalReviews, onClose }) {
  return (
    <div className="review-modal-overlay" onClick={onClose}>
      <div className="review-modal-card review-modal-card--list" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="review-modal-close" onClick={onClose} aria-label="Close">×</button>
        <h3 className="review-modal-title">Reviews for {sellerUsername}</h3>
        {averageRating != null ? (
          <div className="review-avg-row">
            <StarRating rating={averageRating} size="1.1rem" />
            <span className="review-avg-number">{averageRating}</span>
            <span className="review-avg-count">({totalReviews} review{totalReviews !== 1 ? "s" : ""})</span>
          </div>
        ) : (
          <p className="review-no-reviews">No reviews yet</p>
        )}

        <div className="review-list">
          {reviews.map((r) => (
            <div key={r.reviewid} className="review-list-item">
              <div className="review-list-header">
                <span className="review-list-user">@{r.reviewer_username}</span>
                <StarRating rating={r.rating} size="0.8rem" />
              </div>
              {r.comment && <p className="review-list-comment">{r.comment}</p>}
              {r.reviewdate && (
                <span className="review-list-date">
                  {new Date(r.reviewdate).toLocaleDateString(undefined, { dateStyle: "medium" })}
                </span>
              )}
            </div>
          ))}
          {reviews.length === 0 && <p className="review-no-reviews">No reviews yet.</p>}
        </div>
      </div>
    </div>
  );
}
