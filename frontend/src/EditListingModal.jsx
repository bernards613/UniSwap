import { useState } from "react";

export default function EditListingModal({ listing, onClose, onSave }) {
  const [formData, setFormData] = useState({
    title: listing.title || "",
    category: listing.category || "",
    location: listing.location || "",
    price: listing.price ?? "",
    description: listing.description || "",
    status: listing.status || "Available",
    photo: null,
    previewPhoto: listing.photo || null,
  });

  // Handle text fields and file input
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "photo") {
      const file = files?.[0] || null;
      setFormData({ ...formData, photo: file, previewPhoto: file ? URL.createObjectURL(file) : listing.photo });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Submit updated listing
  const handleSubmit = async (e) => {
    e.preventDefault();

    const form = new FormData();
    form.append("title", (formData.title || "").trim());
    form.append("category", formData.category);
    form.append("location", formData.location);
    form.append("price", formData.price);
    form.append("description", formData.description);
    form.append("status", formData.status);
    if (formData.photo) form.append("photo", formData.photo);

    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
    try {
      const response = await fetch(
        `${apiBaseUrl}/listings/update/${listing.itemid}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: form,
        }
      );

      if (!response.ok) throw new Error("Failed to update listing");

      const data = await response.json();

      // Update frontend state
      onSave({
        ...listing,
        title: (formData.title || "").trim() || null,
        category: formData.category,
        location: formData.location,
        price: formData.price,
        description: formData.description,
        status: formData.status,
        photo: data.listing?.photo ?? data.photo ?? listing.photo,
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

          {/* Location */}
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

          {/* Price */}
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

          {/* Description */}
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

          {/* Status */}
          <div className="form-group">
            <label>Status</label>
            <select name="status" value={formData.status} onChange={handleChange}>
              <option>Available</option>
              <option>Sold</option>
              <option>Pending</option>
            </select>
          </div>

          {/* Photo Upload */}
          <div className="form-group">
            <label>Photo</label>
            {formData.previewPhoto && (
              <img
                src={formData.previewPhoto}
                alt="Preview"
                style={{ width: "150px", marginBottom: "10px" }}
              />
            )}
            <input type="file" name="photo" accept="image/*" onChange={handleChange} />
          </div>

          {/* Buttons */}
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