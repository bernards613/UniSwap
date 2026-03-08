import { useState } from "react";
import { useToast, ToastContainer } from "./Toast.jsx";

export default function EditRequestModal({ request, onClose, onSave }) {
  const { toasts, showToast } = useToast();
  const [formData, setFormData] = useState({
    title: request.title || "",
    category: request.category || "",
    location: request.location || "",
    minprice: request.minprice ?? "",
    maxprice: request.maxprice ?? "",
    description: request.description || "",
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${apiBaseUrl}/buyer-requests/update/${request.requestid}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: formData.title,
            category: formData.category,
            location: formData.location,
            minprice: formData.minprice ? parseFloat(formData.minprice) : null,
            maxprice: formData.maxprice ? parseFloat(formData.maxprice) : null,
            description: formData.description,
          }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        showToast(data.detail || "Error updating request", "error");
        setSaving(false);
        return;
      }
      onSave({
        ...request,
        ...formData,
        minprice: formData.minprice ? parseFloat(formData.minprice) : null,
        maxprice: formData.maxprice ? parseFloat(formData.maxprice) : null,
      });
      showToast("Request updated");
      onClose();
    } catch (err) {
      console.error("Update request error:", err);
      showToast("Network error while updating request", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h2>Edit Request</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>What are you looking for?</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Mini fridge, Desk lamp..."
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
            <label>Location (Dorm, Campus Area)</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g., West Campus, Dorm Hall A"
              required
            />
          </div>

          <div style={{ display: "flex", gap: "1rem" }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Min Budget ($)</label>
              <input
                type="number"
                name="minprice"
                value={formData.minprice}
                onChange={handleChange}
                placeholder="Optional"
                min="0"
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Max Budget ($)</label>
              <input
                type="number"
                name="maxprice"
                value={formData.maxprice}
                onChange={handleChange}
                placeholder="Optional"
                min="0"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe what you're looking for..."
              rows="3"
            ></textarea>
          </div>

          <div className="modal-buttons">
            <button type="submit" className="submit-button" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button type="button" className="cancel-button" onClick={onClose} disabled={saving}>
              Cancel
            </button>
          </div>
        </form>
      </div>
      <ToastContainer toasts={toasts} />
    </div>
  );
}
