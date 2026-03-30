from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from fastapi.security import OAuth2PasswordRequestForm
from datetime import datetime
from app.database import get_db
from app import models, schemas, auth
from app.routers.listings import listing_photo_bundle
from app.auth import (
    hash_password,
    verify_password,
    validate_password,
    create_access_token,
    get_current_user
)

router = APIRouter(prefix="/users", tags=["Users"])

@router.post("/register")
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    try:
        # Check if username already exists
        existing = db.query(models.User).filter(models.User.username == user.username).first()
        if existing:
            raise HTTPException(status_code=400, detail="Username already taken")

        # Validate password meets minimum requirements
        try:
            validate_password(user.password)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

        # Hash the password
        hashed_pw = hash_password(user.password)

        # Create new user
        db_user = models.User(
            firstname=user.firstname,
            lastname=user.lastname,
            username=user.username,
            passwordhash=hashed_pw,
            institution=user.institution,
        )

        db.add(db_user)
        db.commit()
        db.refresh(db_user)

        return {
            "message": "User created successfully",
            "userid": db_user.userid,
            "username": db_user.username,
            "firstname": db_user.firstname,
            "lastname": db_user.lastname,
            "institution": db_user.institution
        }
    except HTTPException:
        # Re-raise HTTP exceptions (like username already taken)
        raise
    except Exception as e:
        # Rollback on any other error
        db.rollback()
        print(f"Error creating user: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Error creating user: {str(e)}"
        )

@router.post("/login")
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):

    user = db.query(models.User).filter(models.User.username == form.username).first()
    if not user or not verify_password(form.password, user.passwordhash):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    token = create_access_token({"user_id": user.userid})

    return {
    "message": "Login successful",
    "access_token": token,
    "token_type": "bearer",
    "user": {
        "userid": user.userid,
        "username": user.username,
        "firstname": user.firstname,
        "lastname": user.lastname,
        "institution": user.institution,
        "profilepictureurl": user.profilepictureurl
    }
}

@router.post("/bookmark/{itemid}")
def bookmark_listing(
    itemid: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):

    # Check listing exists
    listing = db.query(models.Listing).filter(models.Listing.itemid == itemid).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    # Prevent bookmarking your own listing
    if listing.sellerid == current_user.userid:
        raise HTTPException(status_code=400, detail="You cannot bookmark your own listing")

    # Prevent duplicate bookmarks
    existing = db.query(models.Bookmark).filter(
        models.Bookmark.userid == current_user.userid,
        models.Bookmark.itemid == itemid
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Already bookmarked")

    # Create bookmark
    bookmark = models.Bookmark(
        userid=current_user.userid,
        itemid=itemid,
        saveddate=datetime.utcnow()
    )

    db.add(bookmark)
    db.commit()
    db.refresh(bookmark)

    return {"message": "Bookmarked", "bookmarkid": bookmark.bookmarkid}

@router.delete("/bookmark/{bookmarkid}")
def remove_bookmark(
    bookmarkid: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    bookmark = db.query(models.Bookmark).filter(
        models.Bookmark.bookmarkid == bookmarkid,
        models.Bookmark.userid == current_user.userid  # ensure ownership
    ).first()

    if not bookmark:
        raise HTTPException(status_code=404, detail="Bookmark not found")

    db.delete(bookmark)
    db.commit()
    return {"message": "Bookmark removed"}

@router.put("/change-password")
def change_password(
    password_data: schemas.PasswordChange,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    try:
        # Verify that the old password matches the current user's password
        if not verify_password(password_data.old_password, current_user.passwordhash):
            raise HTTPException(status_code=401, detail="Current password is incorrect")

        # Check that new password and confirm password match
        if password_data.new_password != password_data.confirm_password:
            raise HTTPException(status_code=400, detail="New passwords do not match")

        # Validate new password meets minimum requirements
        try:
            validate_password(password_data.new_password)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

        # Ensure new password is different from old password
        if verify_password(password_data.new_password, current_user.passwordhash):
            raise HTTPException(status_code=400, detail="New password must be different from current password")

        # Hash the new password and update
        new_hashed_pw = hash_password(password_data.new_password)
        current_user.passwordhash = new_hashed_pw
        db.commit()
        db.refresh(current_user)

        return {"message": "Password changed successfully"}

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error changing password: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error changing password: {str(e)}"
        )

@router.get("/me", response_model=schemas.User)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user


@router.put("/profile-picture")
def update_profile_picture(
    data: schemas.ProfilePictureUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    current_user.profilepictureurl = data.profilepictureurl
    db.commit()
    db.refresh(current_user)
    return {"message": "Profile picture updated", "profilepictureurl": current_user.profilepictureurl}


@router.put("/profile", response_model=schemas.User)
def update_profile(
    data: schemas.ProfileUpdate,
    db: Session = Depends(get_db), #temporar
    current_user: models.User = Depends(get_current_user)
):
    if data.firstname is not None:
        current_user.firstname = data.firstname
    if data.lastname is not None:
        current_user.lastname = data.lastname
    if data.institution is not None:
        current_user.institution = data.institution
    
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/bookmarks")
def get_bookmarked_listings(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    bookmarks = (
        db.query(models.Bookmark)
        .options(
            joinedload(models.Bookmark.item).joinedload(models.Listing.seller)
        )
        .filter(models.Bookmark.userid == current_user.userid)
        .all()
    )

    results = []
    for b in bookmarks:
        if b.item:
            seller = b.item.seller
            bundle = listing_photo_bundle(b.item)
            results.append({
                "bookmarkid": b.bookmarkid,
                "itemid": b.item.itemid,
                "title": b.item.title,
                "category": b.item.category,
                "location": b.item.location,
                "photo": bundle["photo"],
                "photos": bundle["photos"],
                "price": b.item.price,
                "description": b.item.description,
                "status": b.item.status,
                "sellerid": b.item.sellerid,
                "seller_firstname": seller.firstname if seller else None,
                "seller_lastname": seller.lastname if seller else None,
                "seller_username": seller.username if seller else None,
                "saveddate": b.saveddate.isoformat() if b.saveddate else None,
            })

    return results

@router.get("/purchases")
def get_purchase_history(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    purchases = (
        db.query(models.Transaction)
        .options(
            joinedload(models.Transaction.item).joinedload(models.Listing.seller)
        )
        .filter(models.Transaction.buyerid == current_user.userid)
        .all()
    )

    results = []
    for p in purchases:
        if p.item:
            seller = p.item.seller
            bundle = listing_photo_bundle(p.item)
            results.append({
                "transactionid": p.transactionid,
                "itemid": p.item.itemid,
                "title": p.item.title,
                "category": p.item.category,
                "location": p.item.location,
                "photo": bundle["photo"],
                "photos": bundle["photos"],
                "price": p.item.price,
                "description": p.item.description,
                "status": p.item.status,
                "sellerid": p.item.sellerid,
                "seller_firstname": seller.firstname if seller else None,
                "seller_lastname": seller.lastname if seller else None,
                "seller_username": seller.username if seller else None,
                "transactiondate": p.transactiondate.isoformat() if p.transactiondate else None,
            })

    return results

@router.get("/{user_id}", response_model=schemas.User)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.userid == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user