import { useState } from "react";
import { useToast, ToastContainer } from "./Toast.jsx";

export default function CreateBuyerRequestModal({ onClose }) {
  const { toasts, showToast } = useToast();
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    location: "",
    maxprice: "",
    description: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      const token = localStorage.getItem("token");
      if (!token) {
        showToast("You are not logged in.", "error");
        return;
      }

      const response = await fetch(`${apiBaseUrl}/buyer-requests/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          category: formData.category,
          location: formData.location,
          minprice: null,
          maxprice: formData.maxprice ? parseFloat(formData.maxprice) : null,
          description: formData.description,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        showToast(data.detail || "Error creating request", "error");
        return;
      }

      showToast("Request created!");
      setTimeout(() => onClose(), 1200);
    } catch (error) {
      console.error("Create request error:", error);
      showToast("Network error while creating request.", "error");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h2>Post a Buyer Request</h2>
        <p className="modal-subtitle">
          Let sellers know what you're looking for.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <div className="form-section-title">What you're looking for</div>
            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Mini fridge, Desk lamp, Textbooks"
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
          </div>

          <div className="form-section">
            <div className="form-section-title">Location</div>
            <div className="form-group">
              <label>Dorm or campus area</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g., West Campus, Dorm Hall A"
                required
              />
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-title">Budget (optional)</div>
            <div className="form-group">
              <label>Maximum budget ($)</label>
              <input
                type="number"
                name="maxprice"
                value={formData.maxprice}
                onChange={handleChange}
                placeholder="Highest amount you're willing to pay"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-title">Description</div>
            <div className="form-group">
              <label>Details (optional)</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Specific requirements, preferred condition, etc."
                rows="4"
              />
            </div>
          </div>

          <div className="modal-buttons">
            <button type="button" className="cancel-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="submit-button">
              Post Request
            </button>
          </div>
        </form>
      </div>
      <ToastContainer toasts={toasts} />
    </div>
  );
}
