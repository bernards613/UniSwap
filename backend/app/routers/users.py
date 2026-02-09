from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
import hashlib

router = APIRouter(prefix="/users", tags=["Users"])

def hash_password(password: str):
    return hashlib.sha256(password.encode()).hexdigest()

@router.post("/register")
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):

    # Check if username exists
    existing = db.query(models.User).filter(models.User.Username == user.Username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already taken")

    hashed_pw = hash_password(user.Password)

    db_user = models.User(
        FirstName=user.FirstName,
        LastName=user.LastName,
        Username=user.Username,
        PasswordHash=hashed_pw,
        Institution=user.Institution,
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return {"message": "User created", "UserID": db_user.UserID}


@router.get("/{user_id}", response_model=schemas.User)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.UserID == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user
