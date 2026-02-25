import { useState, useEffect } from "react";

export default function BookmarkedListings({ token }) {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    fetch("http://127.0.0.1:8000/users/bookmarks", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setBookmarks(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [token]);

  if (loading) return <div>Loading bookmarks...</div>;
  if (!bookmarks.length) return <div>No bookmarks yet</div>;

  return (
    <div>
      <h2>Bookmarked Listings</h2>
      <ul>
        {bookmarks.map((b) => (
          <li key={b.bookmarkid}>
            {b.category} - {b.location} - ${b.price}
          </li>
        ))}
      </ul>
    </div>
  );
}