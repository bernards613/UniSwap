from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
import hashlib

router = APIRouter(prefix="/users", tags=["Users"])

# simple hashing for now
def hash_password(password: str):
    return hashlib.sha256(password.encode()).hexdigest()


@router.post("/register")
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):

    hashed_pw = hash_password(user.Password)

    db_user = models.User(
        FirstName=user.FirstName,
        LastName=user.LastName,
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
    return user
