from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Security
from sqlalchemy.orm import Session, joinedload
from datetime import datetime
from pydantic import BaseModel
from typing import Optional
import base64
import uuid
from app.database import get_db
from app import models
from app.auth import get_current_user
from pathlib import Path

router = APIRouter(
    prefix="/listings",
    tags=["Listings"]
)


class CreateListingBody(BaseModel):
    title: str
    category: str
    location: str
    price: float
    description: str
    photo: Optional[str] = None  # base64 data URL or null


# --- POST /create: Create a new listing ---
@router.post("/create")
def create_listing(
    body: CreateListingBody,
    db: Session = Depends(get_db),
    current_user: models.User = Security(get_current_user),
):
    photo_url = None
    if body.photo:
        try:
            if body.photo.startswith("data:image"):
                header, b64 = body.photo.split(",", 1)
                data = base64.b64decode(b64)
            else:
                data = base64.b64decode(body.photo)
            static_dir = Path("static/images")
            static_dir.mkdir(parents=True, exist_ok=True)
            ext = "png"
            if "image/jpeg" in body.photo or "image/jpg" in body.photo:
                ext = "jpg"
            elif "image/gif" in body.photo:
                ext = "gif"
            elif "image/webp" in body.photo:
                ext = "webp"
            filename = f"{uuid.uuid4().hex}.{ext}"
            file_location = static_dir / filename
            with open(file_location, "wb") as f:
                f.write(data)
            backend_url = "http://localhost:8000"
            photo_url = f"{backend_url}/static/images/{filename}"
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid photo data: {str(e)}")

    listing = models.Listing(
        sellerid=current_user.userid,
        title=(body.title or "").strip() or None,
        category=body.category,
        location=body.location,
        photo=photo_url,
        price=body.price,
        description=body.description or None,
        status="Available",
        posteddate=datetime.utcnow(),
    )
    db.add(listing)
    db.commit()
    db.refresh(listing)

    return {
        "message": "Listing created",
        "itemid": listing.itemid,
        "listing": {
            "itemid": listing.itemid,
            "title": listing.title,
            "category": listing.category,
            "location": listing.location,
            "photo": listing.photo,
            "price": listing.price,
            "description": listing.description,
            "status": listing.status,
            "seller_firstname": current_user.firstname,
            "seller_lastname": current_user.lastname,
            "seller_username": current_user.username,
        },
    }


# --- GET /all: Fetch all listings ---
@router.get("/all")
def get_all_listings(db: Session = Depends(get_db)):
    listings = db.query(models.Listing).options(joinedload(models.Listing.seller)).all()
    results = []

    for listing in listings:
        results.append({
            "itemid": listing.itemid,
            "sellerid": listing.sellerid,
            "title": listing.title,
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
    title: str = Form(None),
    photo: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    current_user: models.User = Security(get_current_user)
):
    listing = db.query(models.Listing).filter(
        models.Listing.itemid == itemid,
        models.Listing.sellerid == current_user.userid
    ).first()

    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found or unauthorized")

    listing.category = category
    listing.location = location
    listing.price = price
    listing.description = description
    listing.status = status
    if title is not None:
        listing.title = (title or "").strip() or None

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
            "title": listing.title,
            "category": listing.category,
            "location": listing.location,
            "price": listing.price,
            "description": listing.description,
            "status": listing.status,
            "photo": listing.photo
        }
    }


# --- DELETE /delete/{itemid}: Delete a listing ---
@router.delete("/delete/{itemid}")
def delete_listing(
    itemid: int,
    db: Session = Depends(get_db),
    current_user: models.User = Security(get_current_user),
):
    listing = db.query(models.Listing).filter(
        models.Listing.itemid == itemid,
        models.Listing.sellerid == current_user.userid
    ).first()

    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found or unauthorized")

    db.delete(listing)
    db.commit()
    return {"message": "Listing deleted"}