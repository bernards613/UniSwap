from fastapi import APIRouter, Depends, HTTPException, Security
from sqlalchemy.orm import Session, joinedload
from datetime import datetime
from app.database import get_db
from app import models, schemas
from app.auth import get_current_user


router = APIRouter(
    prefix="/buyer-requests",
    tags=["Buyer Requests"]
)


@router.get("/all")
def get_all_requests(db: Session = Depends(get_db)):
    requests = db.query(models.BuyerRequest).options(
        joinedload(models.BuyerRequest.user)
    ).all()
    
    results = []
    for req in requests:
        results.append({
            "requestid": req.requestid,
            "userid": req.userid,
            "title": req.title,
            "description": req.description,
            "category": req.category,
            "location": req.location,
            "minprice": req.minprice,
            "maxprice": req.maxprice,
            "status": req.status,
            "posteddate": req.posteddate.isoformat() if req.posteddate else None,
            "user_firstname": req.user.firstname if req.user else None,
            "user_lastname": req.user.lastname if req.user else None,
            "user_username": req.user.username if req.user else None,
        })
    
    return results


@router.get("/my")
def get_my_requests(
    db: Session = Depends(get_db),
    current_user = Security(get_current_user)
):
    requests = db.query(models.BuyerRequest).filter(
        models.BuyerRequest.userid == current_user.userid
    ).all()
    
    results = []
    for req in requests:
        results.append({
            "requestid": req.requestid,
            "userid": req.userid,
            "title": req.title,
            "description": req.description,
            "category": req.category,
            "location": req.location,
            "minprice": req.minprice,
            "maxprice": req.maxprice,
            "status": req.status,
            "posteddate": req.posteddate.isoformat() if req.posteddate else None,
        })
    
    return results


@router.post("/create")
def create_request(
    request: schemas.BuyerRequestCreate,
    db: Session = Depends(get_db),
    current_user = Security(get_current_user)
):
    db_request = models.BuyerRequest(
        userid=current_user.userid,
        title=request.title,
        description=request.description,
        category=request.category,
        location=request.location,
        minprice=request.minprice,
        maxprice=request.maxprice,
        status="Open",
        posteddate=datetime.utcnow()
    )
    
    db.add(db_request)
    db.commit()
    db.refresh(db_request)
    
    return {"message": "Request created", "request_id": db_request.requestid}


@router.put("/update/{requestid}")
def update_request(
    requestid: int,
    request: schemas.BuyerRequestCreate,
    db: Session = Depends(get_db),
    current_user = Security(get_current_user)
):
    db_request = db.query(models.BuyerRequest).filter(
        models.BuyerRequest.requestid == requestid,
        models.BuyerRequest.userid == current_user.userid
    ).first()
    
    if not db_request:
        raise HTTPException(status_code=404, detail="Request not found or unauthorized")
    
    db_request.title = request.title
    db_request.description = request.description
    db_request.category = request.category
    db_request.location = request.location
    db_request.minprice = request.minprice
    db_request.maxprice = request.maxprice
    
    db.commit()
    db.refresh(db_request)
    
    return {"message": "Request updated", "request_id": db_request.requestid}


@router.put("/status/{requestid}")
def update_request_status(
    requestid: int,
    status: str,
    db: Session = Depends(get_db),
    current_user = Security(get_current_user)
):
    db_request = db.query(models.BuyerRequest).filter(
        models.BuyerRequest.requestid == requestid,
        models.BuyerRequest.userid == current_user.userid
    ).first()
    
    if not db_request:
        raise HTTPException(status_code=404, detail="Request not found or unauthorized")
    
    if status not in ["Open", "Closed", "Fulfilled"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    db_request.status = status
    db.commit()
    
    return {"message": "Status updated", "new_status": status}


@router.delete("/delete/{requestid}")
def delete_request(
    requestid: int,
    db: Session = Depends(get_db),
    current_user = Security(get_current_user)
):
    db_request = db.query(models.BuyerRequest).filter(
        models.BuyerRequest.requestid == requestid,
        models.BuyerRequest.userid == current_user.userid
    ).first()
    
    if not db_request:
        raise HTTPException(status_code=404, detail="Request not found or unauthorized")
    
    db.delete(db_request)
    db.commit()
    
    return {"message": "Request deleted", "deleted_id": requestid}
