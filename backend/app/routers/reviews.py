from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional
from ..database import get_db
from .. import models, auth

router = APIRouter(prefix="/reviews", tags=["Reviews"])


class ReviewCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = Field(None, max_length=300)


@router.post("/{transactionid}")
def create_review(
    transactionid: int,
    review: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    transaction = db.query(models.Transaction).filter(
        models.Transaction.transactionid == transactionid
    ).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    if transaction.buyerid != current_user.userid:
        raise HTTPException(status_code=403, detail="Only the buyer can review this transaction")

    existing = db.query(models.Review).filter(
        models.Review.transactionid == transactionid
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You have already reviewed this transaction")

    db_review = models.Review(
        reviewerid=current_user.userid,
        sellerid=transaction.sellerid,
        transactionid=transactionid,
        rating=review.rating,
        comment=review.comment.strip() if review.comment else None,
        reviewdate=datetime.utcnow(),
    )
    db.add(db_review)
    db.commit()
    db.refresh(db_review)

    return {"message": "Review submitted", "reviewid": db_review.reviewid}


@router.get("/seller/{sellerid}")
def get_seller_reviews(
    sellerid: int,
    db: Session = Depends(get_db),
):
    seller = db.query(models.User).filter(models.User.userid == sellerid).first()
    if not seller:
        raise HTTPException(status_code=404, detail="Seller not found")

    reviews = (
        db.query(models.Review)
        .filter(models.Review.sellerid == sellerid)
        .order_by(models.Review.reviewdate.desc())
        .all()
    )

    avg_row = (
        db.query(func.avg(models.Review.rating))
        .filter(models.Review.sellerid == sellerid)
        .scalar()
    )

    results = []
    for r in reviews:
        reviewer = db.query(models.User).filter(models.User.userid == r.reviewerid).first()
        results.append({
            "reviewid": r.reviewid,
            "rating": r.rating,
            "comment": r.comment,
            "reviewdate": r.reviewdate.isoformat() if r.reviewdate else None,
            "reviewer_username": reviewer.username if reviewer else "Unknown",
        })

    return {
        "sellerid": sellerid,
        "seller_username": seller.username,
        "average_rating": round(float(avg_row), 1) if avg_row else None,
        "total_reviews": len(results),
        "reviews": results,
    }


@router.get("/mine")
def get_my_reviews(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    reviews = (
        db.query(models.Review)
        .filter(models.Review.sellerid == current_user.userid)
        .order_by(models.Review.reviewdate.desc())
        .all()
    )

    avg_row = (
        db.query(func.avg(models.Review.rating))
        .filter(models.Review.sellerid == current_user.userid)
        .scalar()
    )

    results = []
    for r in reviews:
        reviewer = db.query(models.User).filter(models.User.userid == r.reviewerid).first()
        results.append({
            "reviewid": r.reviewid,
            "rating": r.rating,
            "comment": r.comment,
            "reviewdate": r.reviewdate.isoformat() if r.reviewdate else None,
            "reviewer_username": reviewer.username if reviewer else "Unknown",
        })

    return {
        "average_rating": round(float(avg_row), 1) if avg_row else None,
        "total_reviews": len(results),
        "reviews": results,
    }
