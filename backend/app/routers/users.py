from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from app.database import get_db
from app import models, schemas
from app.auth import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/users", tags=["Users"])

@router.post("/register")
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):

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


@router.post("/login")
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):

    user = db.query(models.User).filter(models.User.Username == form.username).first()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    if not verify_password(form.password, user.PasswordHash):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    token = create_access_token({"user_id": user.UserID})

    return {"access_token": token, "token_type": "bearer"}


@router.get("/{user_id}", response_model=schemas.User)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.UserID == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user
