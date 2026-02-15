from pydantic import BaseModel
from typing import Optional

class UserCreate(BaseModel):
    firstname: str
    lastname: str
    username: str
    password: str
    institution: Optional[str] = None

class User(BaseModel):
    userid: int
    firstname: str
    lastname: str
    username: str
    institution: Optional[str] = None

    class Config:
        from_attributes = True

class ListingCreate(BaseModel):
    category: str
    location: str
    photo: str | None = None
    price: float
    description: str | None = None
