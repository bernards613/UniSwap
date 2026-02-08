from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base


# ------------------- USER -------------------
class User(Base):
    __tablename__ = "users"

    UserID = Column(Integer, primary_key=True, index=True)
    PasswordHash = Column(String, nullable=False)
    FirstName = Column(String, nullable=False)
    LastName = Column(String, nullable=False)
    ProfilePictureURL = Column(String)
    Institution = Column(String)

    listings = relationship("Listing", back_populates="seller")
    sent_messages = relationship("Message", foreign_keys="Message.SenderID")
    received_messages = relationship("Message", foreign_keys="Message.ReceiverID")


# ------------------- LISTING -------------------
class Listing(Base):
    __tablename__ = "listing"

    ItemID = Column(Integer, primary_key=True, index=True)
    SellerID = Column(Integer, ForeignKey("users.UserID"), nullable=False)
    Category = Column(String, nullable=False)
    Location = Column(String, nullable=False)
    Photo = Column(String)
    Price = Column(Float, nullable=False)
    Description = Column(String)
    Status = Column(String, default="Available")
    PostedDate = Column(DateTime)

    seller = relationship("User", back_populates="listings")


# ------------------- BOOKMARK -------------------
class Bookmark(Base):
    __tablename__ = "bookmark"

    BookmarkID = Column(Integer, primary_key=True, index=True)
    UserID = Column(Integer, ForeignKey("users.UserID"), nullable=False)
    ItemID = Column(Integer, ForeignKey("listing.ItemID"), nullable=False)
    SavedDate = Column(DateTime)
    ItemInfo = Column(String)

    user = relationship("User")
    item = relationship("Listing")


# ------------------- MESSAGE -------------------
class Message(Base):
    __tablename__ = "message"

    MessageID = Column(Integer, primary_key=True, index=True)
    SenderID = Column(Integer, ForeignKey("users.UserID"), nullable=False)
    ReceiverID = Column(Integer, ForeignKey("users.UserID"), nullable=False)
    MessageTimestamp = Column(DateTime)
    MessageContent = Column(String, nullable=False)

    sender = relationship("User", foreign_keys=[SenderID], back_populates="sent_messages")
    receiver = relationship("User", foreign_keys=[ReceiverID], back_populates="received_messages")


# ------------------- TRANSACTION -------------------
class Transaction(Base):
    __tablename__ = "transaction"

    TransactionID = Column(Integer, primary_key=True, index=True)
    BuyerID = Column(Integer, ForeignKey("users.UserID"), nullable=False)
    SellerID = Column(Integer, ForeignKey("users.UserID"), nullable=False)
    ItemID = Column(Integer, ForeignKey("listing.ItemID"), nullable=False)
    TransactionDate = Column(DateTime)

    buyer = relationship("User", foreign_keys=[BuyerID])
    seller = relationship("User", foreign_keys=[SellerID])
    item = relationship("Listing")


# ------------------- CONVERSATION -------------------
class Conversation(Base):
    __tablename__ = "conversation"

    ConversationID = Column(Integer, primary_key=True, index=True)
    ItemID = Column(Integer, ForeignKey("listing.ItemID"), nullable=False)
    BuyerID = Column(Integer, ForeignKey("users.UserID"), nullable=False)
    SellerID = Column(Integer, ForeignKey("users.UserID"), nullable=False)
    CreatedDate = Column(DateTime)

    item = relationship("Listing")
    buyer = relationship("User", foreign_keys=[BuyerID])
    seller = relationship("User", foreign_keys=[SellerID])
