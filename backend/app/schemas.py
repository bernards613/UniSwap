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

class ListingUpdate(BaseModel):
    category: str
    location: str
    photo: str | None = None
    price: float
    description: str | None = None


class MessageCreate(BaseModel):
    receiverid: int
    itemid: Optional[int] = None
    requestid: Optional[int] = None
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
    itemid: Optional[int] = None
    buyerid: int
    sellerid: int
    createddate: Optional[str] = None
    item_description: Optional[str] = None
    other_user_name: Optional[str] = None
    requestid: Optional[int] = None

    class Config:
        from_attributes = True


class BuyerRequestCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: str
    location: str
    minprice: Optional[float] = None
    maxprice: Optional[float] = None


class BuyerRequestResponse(BaseModel):
    requestid: int
    userid: int
    title: str
    description: Optional[str] = None
    category: str
    location: str
    minprice: Optional[float] = None
    maxprice: Optional[float] = None
    status: str
    posteddate: Optional[str] = None
    user_firstname: Optional[str] = None
    user_lastname: Optional[str] = None
    user_username: Optional[str] = None

    class Config:
        from_attributes = True

