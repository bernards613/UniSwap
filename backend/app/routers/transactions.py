from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from ..database import get_db
from .. import models, auth

router = APIRouter(prefix="/transactions", tags=["Transactions"])

@router.post("/purchase/{itemid}")
def purchase_listing(
    itemid: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):

    listing = db.query(models.Listing).filter(models.Listing.itemid == itemid).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    # Prevent buying your own item
    if listing.sellerid == current_user.userid:
        raise HTTPException(status_code=400, detail="You cannot purchase your own listing")

    # Prevent repurchase
    existing = db.query(models.Transaction).filter(
        models.Transaction.itemid == itemid
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Item already purchased")

    # Mark listing as sold
    listing.status = "Sold"

    transaction = models.Transaction(
        buyerid=current_user.userid,
        sellerid=listing.sellerid,
        itemid=itemid,
        transactiondate=datetime.utcnow()
    )

    db.add(transaction)
    db.commit()
    db.refresh(transaction)

    return {"message": "Purchase successful", "transactionid": transaction.transactionid}