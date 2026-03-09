import { useState } from "react";
import { useToast, ToastContainer } from "./Toast.jsx";

export default function CreateListingModal({ onClose }) {
  const { toasts, showToast } = useToast();
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    location: "",
    price: "",
    description: "",
    photo: null,
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "photo") {
      setFormData({ ...formData, photo: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const wordCount = formData.description
    ? formData.description.trim().split(/\s+/).filter(Boolean).length
    : 0;
  const MAX_DESC_WORDS = 100;
  const isOverWordLimit = wordCount > MAX_DESC_WORDS;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedTitle = (formData.title || "").trim();
    if (!trimmedTitle) {
      showToast("Please enter a title (product name) for your listing.", "error");
      return;
    }
    if (!formData.photo) {
      showToast("Please upload a photo for your listing.", "error");
      return;
    }
    if (isOverWordLimit) {
      showToast(`Description must be ${MAX_DESC_WORDS} words or fewer.`, "error");
      return;
    }
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      const token = localStorage.getItem("token");
      if (!token) {
        showToast("You are not logged in.", "error");
        return;
      }

      let photoData = null;
      if (formData.photo) {
        photoData = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(new Error("Failed to read image"));
          reader.readAsDataURL(formData.photo);
        });
      }

      const response = await fetch(`${apiBaseUrl}/listings/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: trimmedTitle,
          category: formData.category,
          location: formData.location,
          price: parseFloat(formData.price),
          description: formData.description,
          photo: photoData,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        showToast(data.detail || "Error creating listing", "error");
        return;
      }

      showToast("Listing created!");
      setTimeout(() => onClose(), 1200);
    } catch (error) {
      console.error("Create listing error:", error);
      showToast("Network error while creating listing.", "error");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h2>Create Listing</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <div className="form-section-title">Item</div>
            <div className="form-group">
              <label>Title / Product name</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Wooden desk chair"
                required
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
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the item, condition, and any relevant details"
                required
                rows="4"
              />
              <span
                className={`form-hint ${isOverWordLimit ? "form-hint-error" : ""}`}
                aria-live="polite"
              >
                {wordCount} / {MAX_DESC_WORDS} words
              </span>
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-title">Location &amp; pricing</div>
            <div className="form-group">
              <label>Location (dorm, room #)</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g., West Hall, Room 204"
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
                placeholder="0.00"
                required
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-title">Photo</div>
            <div className="form-group">
              <label>Image (required)</label>
              <input
                type="file"
                name="photo"
                accept="image/*"
                onChange={handleChange}
                required
              />
              {!formData.photo && (
                <span className="form-hint">You must upload a photo to post this listing.</span>
              )}
            </div>
          </div>

          <div className="modal-buttons">
            <button type="button" className="cancel-button" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="submit-button"
              disabled={isOverWordLimit}
            >
              Create Listing
            </button>
          </div>
        </form>
      </div>
      <ToastContainer toasts={toasts} />
    </div>
  );
}