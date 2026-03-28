import { useState, useMemo } from "react";
import { listingPhotoUrls } from "./listingPhotos.jsx";

const MAX_PHOTOS = 7;

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Failed to read image"));
    reader.readAsDataURL(file);
  });
}

/** @typedef {{ kind: 'url', url: string } | { kind: 'file', file: File }} PhotoSlot */

export default function EditListingModal({ listing, onClose, onSave }) {
  const initialUrls = useMemo(() => listingPhotoUrls(listing), [listing]);
  /** @type {[PhotoSlot[], function]} */
  const [slots, setSlots] = useState(() =>
    initialUrls.length
      ? initialUrls.map((url) => ({ kind: "url", url }))
      : listing.photo
        ? [{ kind: "url", url: listing.photo }]
        : []
  );

  const [formData, setFormData] = useState({
    title: listing.title || "",
    category: listing.category || "",
    location: listing.location || "",
    price: listing.price ?? "",
    description: listing.description || "",
    status: listing.status || "Available",
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "add_photos") {
      const picked = Array.from(files || []);
      if (!picked.length) return;
      setSlots((prev) => {
        const next = [...prev];
        for (const file of picked) {
          if (!file.type.startsWith("image/")) continue;
          if (next.length >= MAX_PHOTOS) break;
          next.push({ kind: "file", file });
        }
        return next;
      });
      e.target.value = "";
      return;
    }
    setFormData({ ...formData, [name]: value });
  };

  const removeSlot = (index) => {
    setSlots((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (slots.length === 0) {
      alert("Please keep at least one photo.");
      return;
    }

    const form = new FormData();
    form.append("title", (formData.title || "").trim());
    form.append("category", formData.category);
    form.append("location", formData.location);
    form.append("price", formData.price);
    form.append("description", formData.description);
    form.append("status", formData.status);

    const payload = [];
    for (const slot of slots) {
      if (slot.kind === "url") {
        payload.push(slot.url);
      } else {
        payload.push(await readFileAsDataURL(slot.file));
      }
    }
    form.append("photos_payload", JSON.stringify(payload));

    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
    try {
      const response = await fetch(`${apiBaseUrl}/listings/update/${listing.itemid}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: form,
      });

      if (!response.ok) throw new Error("Failed to update listing");

      const data = await response.json();
      const lu = data.listing || {};

      onSave({
        ...listing,
        title: (formData.title || "").trim() || null,
        category: formData.category,
        location: formData.location,
        price: formData.price,
        description: formData.description,
        status: formData.status,
        photo: lu.photo ?? listing.photo,
        photos: lu.photos ?? listing.photos,
      });

      onClose();
    } catch (err) {
      console.error("Error updating listing:", err);
      alert("Failed to update listing. Check console for details.");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h2>Edit Listing</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title / Product name</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Wooden desk chair"
              maxLength={80}
            />
          </div>
          <div className="form-group">
            <label>Category</label>
            <select name="category" value={formData.category} onChange={handleChange} required>
              <option value="">Select a category</option>
              <option value="Furniture">Furniture</option>
              <option value="Appliances">Appliances</option>
              <option value="Decor">Decor</option>
              <option value="Electronics">Electronics</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label>Location (Dorm, Room #)</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
              maxLength={100}
            />
          </div>

          <div className="form-group">
            <label>Price ($)</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows="3"
            />
          </div>

          <div className="form-group">
            <label>Status</label>
            <select name="status" value={formData.status} onChange={handleChange}>
              <option>Available</option>
              <option>Sold</option>
              <option>Pending</option>
            </select>
          </div>

          <div className="form-group">
            <label>Photos (1–{MAX_PHOTOS})</label>
            <input
              type="file"
              name="add_photos"
              accept="image/*"
              multiple
              onChange={handleChange}
              disabled={slots.length >= MAX_PHOTOS}
            />
            <span className="form-hint" style={{ display: "block", marginTop: 6 }}>
              {slots.length} / {MAX_PHOTOS} — order is left to right; first is the cover.
            </span>
            {slots.length > 0 && (
              <div className="edit-listing-photo-grid">
                {slots.map((slot, i) => (
                  <div key={`${slot.kind === "url" ? slot.url : slot.file.name}-${i}`} className="edit-listing-photo-tile">
                    <img
                      src={slot.kind === "url" ? slot.url : URL.createObjectURL(slot.file)}
                      alt=""
                    />
                    <button
                      type="button"
                      className="edit-listing-photo-remove"
                      onClick={() => removeSlot(i)}
                      aria-label="Remove photo"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="modal-buttons">
            <button type="submit" className="submit-button">
              Save Changes
            </button>
            <button type="button" className="cancel-button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
      <style>{`
        .edit-listing-photo-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
          gap: 0.5rem;
          margin-top: 0.75rem;
        }
        .edit-listing-photo-tile {
          position: relative;
          aspect-ratio: 1;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid #e2e8f0;
          background: #f8f9fa;
        }
        .edit-listing-photo-tile img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .edit-listing-photo-remove {
          position: absolute;
          top: 4px;
          right: 4px;
          width: 22px;
          height: 22px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          background: rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(6px);
          color: #fff;
          font-size: 14px;
          line-height: 1;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
        }
      `}</style>
    </div>
  );
}
