import { useState, useEffect } from "react";

export default function BookmarkedListings({ token }) {
  const [listings, setListings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBookmarks() {
      try {
        const res = await fetch("http://127.0.0.1:8000/users/bookmarks", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          console.error("Bookmark fetch failed:", await res.text());
          setListings([]);
          setLoading(false);
          return;
        }

        const data = await res.json();
        setListings(data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    }

    loadBookmarks();
  }, [token]);

  if (loading) return <p>Loading...</p>;

  if (!listings || listings.length === 0)
    return <p>No bookmarked listings yet.</p>;

  return (
    <div className="listings-container">
      <h2>Bookmarked Listings</h2>
      {listings.map((item) => (
        <div key={item.itemid} className="listing-card">
          <img src={item.photo} alt="" />
          <p>{item.description}</p>
          <p>${item.price}</p>
        </div>
      ))}
    </div>
  );
}