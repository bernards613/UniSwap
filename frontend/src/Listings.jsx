import { useEffect, useState } from "react";
import CreateListingModal from "./CreateListingModal.jsx";

export default function Listings() {
  const [listings, setListings] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const token = localStorage.getItem("token");

  // Fetch all listings
  const loadListings = async () => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

      const response = await fetch(`${apiBaseUrl}/listings/all`);
      const data = await response.json();

      if (response.ok) {
        setListings(data);
      } else {
        console.error("Error fetching:", data);
      }

    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  useEffect(() => {
    loadListings();
  }, []);

  // DELETE listing
  const deleteListing = async (itemid) => {
    if (!confirm("Delete this listing?")) return;

    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

      const response = await fetch(`${apiBaseUrl}/listings/delete/${itemid}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setListings(listings.filter(l => l.itemid !== itemid));
      } else {
        alert(data.detail || "Could not delete listing");
      }

    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  return (
    <div className="listings-page">

      <h1 className="center-title">Your Listings</h1>

      <button className="create-button" onClick={() => setShowModal(true)}>
        + Create Listing
      </button>

      {/* Grid */}
      <div className="listings-grid">
        {listings.map((item) => (
          <div key={item.itemid} className="listing-card">
            
            <div className="listing-header">
              <h3>{item.category}</h3>
              <button className="delete-btn" onClick={() => deleteListing(item.itemid)}>🗑</button>
            </div>

            <p><strong>Location:</strong> {item.location}</p>
            <p><strong>Price:</strong> ${item.price}</p>
            <p><strong>Description:</strong> {item.description}</p>
            <p><strong>Status:</strong> {item.status}</p>
          </div>
        ))}
      </div>

      {showModal && (
        <CreateListingModal onClose={() => { setShowModal(false); loadListings(); }} />
      )}

    </div>
  );
}
