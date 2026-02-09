from pydantic import BaseModel

class UserCreate(BaseModel):
    FirstName: str
    LastName: str
    Username: str
    Password: str
    Institution: str

class User(BaseModel):
    UserID: int
    FirstName: str
    LastName: str
    Username: str
    ProfilePictureURL: str | None
    Institution: str

    class Config:
        orm_mode = True
