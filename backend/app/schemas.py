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
        orm_mode = True
