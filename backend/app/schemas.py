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
    profilepictureurl: Optional[str] = None

    class Config:
        from_attributes = True


class ProfilePictureUpdate(BaseModel):
    profilepictureurl: str


class ProfileUpdate(BaseModel):
    firstname: Optional[str] = None
    lastname: Optional[str] = None
    institution: Optional[str] = None


class ListingCreate(BaseModel):
    category: str
    location: str
    photo: str | None = None
    price: float
    description: str | None = None


class MessageCreate(BaseModel):
    receiverid: int
    itemid: int
    messagecontent: str


class MessageResponse(BaseModel):
    messageid: int
    senderid: int
    receiverid: int
    messagecontent: str
    messagetimestamp: Optional[str] = None

    class Config:
        from_attributes = True


class ConversationResponse(BaseModel):
    conversationid: int
    itemid: int
    buyerid: int
    sellerid: int
    createddate: Optional[str] = None
    item_description: Optional[str] = None
    other_user_name: Optional[str] = None

    class Config:
        from_attributes = True

