import { useState, useEffect } from "react";

/**
 * @param {object} props
 * @param {string[]} props.urls
 * @param {"card"|"detail"} props.variant
 */
export default function ListingPhotoCarousel({ urls, variant = "card" }) {
  const list = Array.isArray(urls) ? urls.filter(Boolean) : [];
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    setIdx(0);
  }, [list.join("|")]);

  if (!list.length) {
    return (
      <div
        className={`listing-carousel listing-carousel--empty listing-carousel--${variant}`}
        aria-hidden
      />
    );
  }

  const n = list.length;
  const goPrev = (e) => {
    e.stopPropagation();
    setIdx((i) => (i - 1 + n) % n);
  };
  const goNext = (e) => {
    e.stopPropagation();
    setIdx((i) => (i + 1) % n);
  };

  return (
    <div className={`listing-carousel listing-carousel--${variant}`}>
      <div
        className="listing-carousel-bg"
        style={{ backgroundImage: `url(${list[idx]})` }}
        role="img"
        aria-label={`Photo ${idx + 1} of ${n}`}
      />
      {n > 1 && (
        <>
          <button
            type="button"
            className="listing-carousel-btn listing-carousel-btn--prev"
            onClick={goPrev}
            aria-label="Previous photo"
          >
            ‹
          </button>
          <button
            type="button"
            className="listing-carousel-btn listing-carousel-btn--next"
            onClick={goNext}
            aria-label="Next photo"
          >
            ›
          </button>
          <div className="listing-carousel-dots" role="tablist" aria-label="Photos">
            {list.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === idx}
                className={`listing-carousel-dot ${i === idx ? "active" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setIdx(i);
                }}
                aria-label={`Photo ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
