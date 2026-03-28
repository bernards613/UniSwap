from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from .database import Base

# ------------------- USER -------------------
class User(Base):
    __tablename__ = "users"

    userid = Column(Integer, primary_key=True, index=True, autoincrement=True)
    passwordhash = Column(String, nullable=False)
    firstname = Column(String, nullable=False)
    lastname = Column(String, nullable=False)
    username = Column(String, unique=True, nullable=False)
    profilepictureurl = Column(String)
    institution = Column(String)

    listings = relationship("Listing", back_populates="seller")
    sent_messages = relationship("Message", foreign_keys="Message.senderid")
    received_messages = relationship("Message", foreign_keys="Message.receiverid")


# ------------------- LISTING -------------------
class Listing(Base):
    __tablename__ = "listing"

    itemid = Column(Integer, primary_key=True, index=True)
    sellerid = Column(Integer, ForeignKey("users.userid"), nullable=False)
    title = Column(String, nullable=True)
    category = Column(String, nullable=False)
    location = Column(String, nullable=False)
    photo = Column(String)
    photos = Column(Text)  # JSON array of image URLs, max 7; legacy rows use `photo` only
    price = Column(Float, nullable=False)
    description = Column(String)
    status = Column(String, default="Available")
    posteddate = Column(DateTime)

    seller = relationship("User", back_populates="listings")


# ------------------- BOOKMARK -------------------
class Bookmark(Base):
    __tablename__ = "bookmark"

    bookmarkid = Column(Integer, primary_key=True, index=True)
    userid = Column(Integer, ForeignKey("users.userid"), nullable=False)
    itemid = Column(Integer, ForeignKey("listing.itemid"), nullable=False)
    saveddate = Column(DateTime)
    iteminfo = Column(String)

    user = relationship("User")
    item = relationship("Listing")


# ------------------- MESSAGE -------------------
class Message(Base):
    __tablename__ = "message"

    messageid = Column(Integer, primary_key=True, index=True)
    senderid = Column(Integer, ForeignKey("users.userid"), nullable=False)
    receiverid = Column(Integer, ForeignKey("users.userid"), nullable=False)
    messagetimestamp = Column(DateTime)
    messagecontent = Column(String, nullable=False)

    sender = relationship("User", foreign_keys=[senderid], back_populates="sent_messages")
    receiver = relationship("User", foreign_keys=[receiverid], back_populates="received_messages")


# ------------------- TRANSACTION -------------------
class Transaction(Base):
    __tablename__ = "transaction"

    transactionid = Column(Integer, primary_key=True, index=True)
    buyerid = Column(Integer, ForeignKey("users.userid"), nullable=False)
    sellerid = Column(Integer, ForeignKey("users.userid"), nullable=False)
    itemid = Column(Integer, ForeignKey("listing.itemid"), nullable=False)
    transactiondate = Column(DateTime)

    buyer = relationship("User", foreign_keys=[buyerid])
    seller = relationship("User", foreign_keys=[sellerid])
    item = relationship("Listing")


# ------------------- CONVERSATION -------------------
class Conversation(Base):
    __tablename__ = "conversation"

    conversationid = Column(Integer, primary_key=True, index=True)
    itemid = Column(Integer, ForeignKey("listing.itemid"), nullable=True)
    buyerid = Column(Integer, ForeignKey("users.userid"), nullable=False)
    sellerid = Column(Integer, ForeignKey("users.userid"), nullable=False)
    createddate = Column(DateTime)
    requestid = Column(Integer, ForeignKey("buyerrequest.requestid"), nullable=True)

    item = relationship("Listing")
    buyer = relationship("User", foreign_keys=[buyerid])
    seller = relationship("User", foreign_keys=[sellerid])
    request = relationship("BuyerRequest")


# ------------------- BUYER REQUEST -------------------
class BuyerRequest(Base):
    __tablename__ = "buyerrequest"

    requestid = Column(Integer, primary_key=True, index=True)
    userid = Column(Integer, ForeignKey("users.userid"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(String)
    category = Column(String, nullable=False)
    location = Column(String, nullable=False)
    minprice = Column(Float, nullable=True)
    maxprice = Column(Float, nullable=True)
    status = Column(String, default="Open")
    posteddate = Column(DateTime)

    user = relationship("User")
