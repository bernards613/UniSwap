from fastapi import APIRouter, Depends, HTTPException, Security
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from datetime import datetime
from app.database import get_db
from app import models, schemas
from app.auth import get_current_user


router = APIRouter(
    prefix="/listings",
    tags=["Listings"]
)

@router.get("/")
def get_listings():
    return {"message": "Listings endpoint working"}

@router.post("/create")
def create_listing(
    listing: schemas.ListingCreate,
    db: Session = Depends(get_db),
    current_user = Security(get_current_user)
):
    db_listing = models.Listing(
        sellerid = current_user.userid,
        category = listing.category,
        location = listing.location,
        photo = listing.photo,
        price = listing.price,
        description = listing.description,
        posteddate = datetime.utcnow()
    )

    db.add(db_listing)
    db.commit()
    db.refresh(db_listing)

    return {"message": "Listing created", "listing_id": db_listing.itemid}
