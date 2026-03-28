import { useState } from "react";
import { useToast, ToastContainer } from "./Toast.jsx";

const MAX_PHOTOS = 7;

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Failed to read image"));
    reader.readAsDataURL(file);
  });
}

export default function CreateListingModal({ onClose }) {
  const { toasts, showToast } = useToast();
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    location: "",
    price: "",
    description: "",
  });
  const [photoFiles, setPhotoFiles] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handlePhotosChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const merged = [...photoFiles];
    for (const f of files) {
      if (!f.type.startsWith("image/")) {
        showToast("Please select image files only.", "error");
        continue;
      }
      if (f.size > 8 * 1024 * 1024) {
        showToast("Each image must be under 8MB.", "error");
        continue;
      }
      if (merged.length >= MAX_PHOTOS) {
        showToast(`You can add up to ${MAX_PHOTOS} photos.`, "error");
        break;
      }
      merged.push(f);
    }
    setPhotoFiles(merged);
    e.target.value = "";
  };

  const removePhotoAt = (index) => {
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index));
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
    if (photoFiles.length === 0) {
      showToast("Please add at least one photo (up to 7).", "error");
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

      const photos = await Promise.all(photoFiles.map((f) => readFileAsDataURL(f)));

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
          photos,
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
                placeholder="0.00"
                required
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-title">Photos (1–{MAX_PHOTOS})</div>
            <div className="form-group">
              <label>Add images</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotosChange}
                disabled={photoFiles.length >= MAX_PHOTOS}
              />
              <span className="form-hint">
                {photoFiles.length} / {MAX_PHOTOS} selected — first photo is the cover.
              </span>
            </div>
            {photoFiles.length > 0 && (
              <div className="create-listing-photo-grid">
                {photoFiles.map((file, i) => (
                  <div key={`${file.name}-${i}`} className="create-listing-photo-tile">
                    <img src={URL.createObjectURL(file)} alt="" />
                    <button
                      type="button"
                      className="create-listing-photo-remove"
                      onClick={() => removePhotoAt(i)}
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
            <button type="button" className="cancel-button" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="submit-button"
              disabled={isOverWordLimit || photoFiles.length === 0}
            >
              Create Listing
            </button>
          </div>
        </form>
      </div>
      <ToastContainer toasts={toasts} />
      <style>{`
        .create-listing-photo-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
          gap: 0.5rem;
          margin-top: 0.75rem;
        }
        .create-listing-photo-tile {
          position: relative;
          aspect-ratio: 1;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid #e2e8f0;
          background: #f8f9fa;
        }
        .create-listing-photo-tile img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .create-listing-photo-remove {
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
        html.dark-mode .create-listing-photo-tile {
          border-color: #333;
          background: #1a1a1a;
        }
      `}</style>
    </div>
  );
}
