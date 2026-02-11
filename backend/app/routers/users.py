from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from app.database import get_db
from app import models, schemas
from app.auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/users", tags=["Users"])

@router.post("/register")
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):

    existing = db.query(models.User).filter(models.User.username == user.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already taken")

    hashed_pw = hash_password(user.password)

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
        "institution": user.institution
    }
}

@router.get("/me", response_model=schemas.User)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@router.get("/{user_id}", response_model=schemas.User)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.userid == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user