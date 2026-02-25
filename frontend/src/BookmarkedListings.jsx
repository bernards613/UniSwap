import { useEffect, useState } from "react";

export default function BookmarkedListings({ token }) {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/users/bookmarks", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setBookmarks(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token]);

  if (loading) return <p>Loading...</p>;

  return (
    <div className="listing-container">
      <h2>Your Bookmarked Listings</h2>
      {bookmarks.length === 0 && <p>No bookmarks yet.</p>}

      {bookmarks.map((item) => (
        <div key={item.itemid} className="listing-item">
          {item.photo && <img src={item.photo} className="listing-img" />}
          <h3>{item.category}</h3>
          <p>{item.location}</p>
          <p>${item.price}</p>
          <p>{item.description}</p>
        </div>
      ))}
    </div>
  );
}