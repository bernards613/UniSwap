from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session, joinedload
from datetime import datetime
from pydantic import BaseModel
from typing import Optional
import json
from app.database import get_db
from app import models
from app.auth import get_current_user

router = APIRouter(
    prefix="/listings",
    tags=["Listings"]
)

MAX_LISTING_PHOTOS = 7


def photos_from_listing(listing) -> list:
    """Resolve image URLs from listing.photos JSON or legacy listing.photo."""
    raw = getattr(listing, "photos", None)
    if raw:
        try:
            arr = json.loads(raw)
            if isinstance(arr, list):
                out = [u for u in arr if isinstance(u, str) and u.strip()][:MAX_LISTING_PHOTOS]
                if out:
                    return out
        except (json.JSONDecodeError, TypeError):
            pass
    p = getattr(listing, "photo", None)
    if p and isinstance(p, str) and p.strip():
        return [p.strip()]
    return []


def listing_photo_bundle(listing) -> dict:
    urls = photos_from_listing(listing)
    return {
        "photo": urls[0] if urls else None,
        "photos": urls,
    }


class CreateListingBody(BaseModel):
    title: str
    category: str
    location: str
    price: float
    description: str
    photo: Optional[str] = None 
    photos: Optional[list[str]] = None  # preferred: up to 7 base64


def persist_photo_entries(entries: list[str]) -> list[str]:
    """
    Accept photo entries and return them ready for DB storage.

    - base64 data URLs  (data:image/...)  → stored as-is directly in PostgreSQL.
      No files are written to disk; the full image data lives in the DB.
    - http/https URLs → kept as-is for backward compatibility with any listings
      that were created before this change and still reference static files.
    """
    urls: list[str] = []
    for raw in entries:
        if not isinstance(raw, str) or not raw.strip():
            continue
        s = raw.strip()
        if s.startswith("http://") or s.startswith("https://"):
            # Legacy static URL - preserve for backward compatibility
            urls.append(s)
        elif s.startswith("data:image"):
            # Store the base64 data URL directly in PostgreSQL
            urls.append(s)
        else:
            raise HTTPException(
                status_code=400,
                detail="Invalid photo — must be a data: URL or an https:// URL",
            )
        if len(urls) >= MAX_LISTING_PHOTOS:
            break
    return urls


#create: Create a new listing
@router.post("/create")
def create_listing(
    body: CreateListingBody,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    raw_list: list[str] = []
    if body.photos and len(body.photos) > 0:
        if len(body.photos) > MAX_LISTING_PHOTOS:
            raise HTTPException(status_code=400, detail=f"Maximum {MAX_LISTING_PHOTOS} photos allowed")
        raw_list = list(body.photos)
    elif body.photo:
        raw_list = [body.photo]
    else:
        raise HTTPException(status_code=400, detail="At least one photo is required")

    try:
        urls = persist_photo_entries(raw_list)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not urls:
        raise HTTPException(status_code=400, detail="At least one valid photo is required")

    listing = models.Listing(
        sellerid=current_user.userid,
        title=(body.title or "").strip() or None,
        category=body.category,
        location=body.location,
        photo=urls[0],
        photos=json.dumps(urls),
        price=body.price,
        description=body.description or None,
        status="Available",
        posteddate=datetime.utcnow(),
    )
    db.add(listing)
    db.commit()
    db.refresh(listing)

    bundle = listing_photo_bundle(listing)
    return {
        "message": "Listing created",
        "itemid": listing.itemid,
        "listing": {
            "itemid": listing.itemid,
            "title": listing.title,
            "category": listing.category,
            "location": listing.location,
            "photo": bundle["photo"],
            "photos": bundle["photos"],
            "price": listing.price,
            "description": listing.description,
            "status": listing.status,
            "seller_firstname": current_user.firstname,
            "seller_lastname": current_user.lastname,
            "seller_username": current_user.username,
        },
    }


def _listing_to_dict(listing: models.Listing) -> dict:
    bundle = listing_photo_bundle(listing)
    seller = listing.seller
    return {
        "itemid": listing.itemid,
        "sellerid": listing.sellerid,
        "title": listing.title,
        "category": listing.category,
        "location": listing.location,
        "photo": bundle["photo"],
        "photos": bundle["photos"],
        "price": listing.price,
        "description": listing.description,
        "status": listing.status,
        "posteddate": listing.posteddate.isoformat() if listing.posteddate else None,
        "seller_firstname": seller.firstname if seller else None,
        "seller_lastname": seller.lastname if seller else None,
        "seller_username": seller.username if seller else None,
    }


# Fetch all listings
@router.get("/all")
def get_all_listings(db: Session = Depends(get_db)):
    listings = db.query(models.Listing).options(joinedload(models.Listing.seller)).all()
    return [_listing_to_dict(listing) for listing in listings]


# PUT /update/{itemid}: Edit a listing
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
    photos_payload: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
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

    if photos_payload is not None and photos_payload.strip():
        try:
            items = json.loads(photos_payload)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid photos_payload JSON")
        if not isinstance(items, list):
            raise HTTPException(status_code=400, detail="photos_payload must be a JSON array")
        if len(items) > MAX_LISTING_PHOTOS:
            raise HTTPException(status_code=400, detail=f"Maximum {MAX_LISTING_PHOTOS} photos allowed")
        urls = persist_photo_entries([str(x) for x in items])
        if not urls:
            raise HTTPException(status_code=400, detail="At least one photo is required")
        listing.photo = urls[0]
        listing.photos = json.dumps(urls)
    elif photo:
        raw_bytes = photo.file.read()
        mime = photo.content_type or "image/jpeg"
        import base64 as _b64
        b64str = _b64.b64encode(raw_bytes).decode()
        url = f"data:{mime};base64,{b64str}"
        listing.photo = url
        listing.photos = json.dumps([url])

    db.commit()
    db.refresh(listing)

    bundle = listing_photo_bundle(listing)
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
            "photo": bundle["photo"],
            "photos": bundle["photos"],
        }
    }

@router.delete("/delete/{itemid}")
def delete_listing(
    itemid: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
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