import { useState } from "react";

export default function CreateListingModal({ onClose, token }) {
  const [formData, setFormData] = useState({
    category: "",
    location: "",
    price: "",
    description: "",
    status: "Available",
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

  const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

    // 🔥 Get token from localStorage
    const token = localStorage.getItem("access_token");
    if (!token) {
      alert("You are not logged in.");
      return;
    }

    // Send JSON request (what FastAPI expects)
    const response = await fetch(`${apiBaseUrl}/listings/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // include JWT
      },
      body: JSON.stringify({
        category: formData.category,
        location: formData.location,
        price: parseFloat(formData.price),
        description: formData.description,
        status: formData.status,
        photo: null // backend expects this field but you're not uploading files in JSON mode
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.detail || "Error creating listing");
      return;
    }

    alert("Listing created!");
    onClose();
  } catch (error) {
    console.error("Create listing error:", error);
    alert("Network error while creating listing.");
  }
};


  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h2>Create Listing</h2>

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
            <input type="text" name="location" value={formData.location} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Price ($)</label>
            <input type="number" name="price" value={formData.price} onChange={handleChange} required min="0" />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange} required rows="3"></textarea>
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
            <button type="submit" className="submit-button">Create Listing</button>
            <button type="button" className="cancel-button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}