import { useState } from "react";

export default function EditListingModal({ listing, onClose, onSave }) {
  const [formData, setFormData] = useState({
    itemid: listing.itemid,
    category: listing.category || "",
    location: listing.location || "",
    price: listing.price ?? "",
    description: listing.description || "",
    status: listing.status || "Available",
    photo: null, // UI only
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "photo") {
      setFormData({ ...formData, photo: files?.[0] || null });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // UI-only save:
    // partner will replace with PUT/PATCH endpoint later
    onSave({
      ...listing,
      category: formData.category,
      location: formData.location,
      price: formData.price === "" ? "" : parseFloat(formData.price),
      description: formData.description,
      status: formData.status,
      photo: null,
    });

    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h2>Edit Listing</h2>

        <form onSubmit={handleSubmit}>
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
            ></textarea>
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
            <label>Photo</label>
            <input type="file" name="photo" accept="image/*" onChange={handleChange} />
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
    </div>
  );
}