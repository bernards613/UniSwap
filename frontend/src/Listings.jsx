import { useState } from "react";
import CreateListingModal from "./CreateListingModal.jsx";
import "./listings.css";

export default function Listings({ token }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="listings-container">
      <div className="listings-header">
        <h1>Your Listings</h1>

        <button className="create-listing-button" onClick={() => setShowModal(true)}>
          + Create Listing
        </button>
      </div>

      {showModal && (
        <CreateListingModal onClose={() => setShowModal(false)} token={token} />
      )}
    </div>
  );
}

