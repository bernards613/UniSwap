from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Security
from sqlalchemy.orm import Session, joinedload
from datetime import datetime
from app.database import get_db
from app import models
from app.auth import get_current_user
from pathlib import Path

router = APIRouter(
    prefix="/listings",
    tags=["Listings"]
)

# --- GET /all: Fetch all listings ---
@router.get("/all")
def get_all_listings(db: Session = Depends(get_db)):
    listings = db.query(models.Listing).options(joinedload(models.Listing.seller)).all()
    results = []

    for listing in listings:
        results.append({
            "itemid": listing.itemid,
            "sellerid": listing.sellerid,
            "category": listing.category,
            "location": listing.location,
            "photo": listing.photo,
            "price": listing.price,
            "description": listing.description,
            "status": listing.status,
            "posteddate": listing.posteddate.isoformat() if listing.posteddate else None,
            "seller_firstname": listing.seller.firstname if listing.seller else None,
            "seller_lastname": listing.seller.lastname if listing.seller else None,
            "seller_username": listing.seller.username if listing.seller else None,
        })

    return results


# --- PUT /update/{itemid}: Edit a listing ---
@router.put("/update/{itemid}")
def update_listing(
    itemid: int,
    category: str = Form(...),
    location: str = Form(...),
    price: float = Form(...),
    description: str = Form(...),
    status: str = Form(...),
    photo: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    current_user: models.User = Security(get_current_user)
):
    # Fetch listing
    listing = db.query(models.Listing).filter(
        models.Listing.itemid == itemid,
        models.Listing.sellerid == current_user.userid
    ).first()

    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found or unauthorized")

    # Update fields
    listing.category = category
    listing.location = location
    listing.price = price
    listing.description = description
    listing.status = status

    # Handle optional photo upload
    if photo:
        static_dir = Path("static/images")
        static_dir.mkdir(parents=True, exist_ok=True)
        file_location = static_dir / photo.filename
        with open(file_location, "wb") as f:
            f.write(photo.file.read())
        backend_url = "http://localhost:8000"
        listing.photo = f"{backend_url}/static/images/{photo.filename}"

    db.commit()
    db.refresh(listing)

    return {
        "message": "Listing updated successfully",
        "listing": {
            "itemid": listing.itemid,
            "category": listing.category,
            "location": listing.location,
            "price": listing.price,
            "description": listing.description,
            "status": listing.status,
            "photo": listing.photo
        }
    }