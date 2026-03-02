from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from datetime import datetime
from app.database import get_db
from app import models, schemas, auth

router = APIRouter(
    prefix="/messages",
    tags=["Messages"]
)


@router.post("/send")
def send_message(
    message: schemas.MessageCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Send a message to another user about a listing"""
    
    # Check if listing exists
    listing = db.query(models.Listing).filter(models.Listing.itemid == message.itemid).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    # Check if receiver exists
    receiver = db.query(models.User).filter(models.User.userid == message.receiverid).first()
    if not receiver:
        raise HTTPException(status_code=404, detail="Receiver not found")
    
    # Cannot message yourself
    if message.receiverid == current_user.userid:
        raise HTTPException(status_code=400, detail="Cannot send message to yourself")
    
    # Find or create conversation
    conversation = db.query(models.Conversation).filter(
        models.Conversation.itemid == message.itemid,
        ((models.Conversation.buyerid == current_user.userid) & (models.Conversation.sellerid == message.receiverid)) |
        ((models.Conversation.buyerid == message.receiverid) & (models.Conversation.sellerid == current_user.userid))
    ).first()
    
    if not conversation:
        # Determine buyer/seller roles
        if listing.sellerid == current_user.userid:
            buyerid = message.receiverid
            sellerid = current_user.userid
        else:
            buyerid = current_user.userid
            sellerid = listing.sellerid
        
        conversation = models.Conversation(
            itemid=message.itemid,
            buyerid=buyerid,
            sellerid=sellerid,
            createddate=datetime.utcnow()
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)
    
    # Create message
    db_message = models.Message(
        senderid=current_user.userid,
        receiverid=message.receiverid,
        messagecontent=message.messagecontent,
        messagetimestamp=datetime.utcnow()
    )
    
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    
    return {
        "message": "Message sent successfully",
        "messageid": db_message.messageid,
        "conversationid": conversation.conversationid
    }


@router.get("/conversation/{conversationid}")
def get_conversation_messages(
    conversationid: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Get all messages in a conversation"""
    
    # Get conversation and verify user is part of it
    conversation = db.query(models.Conversation).filter(
        models.Conversation.conversationid == conversationid
    ).first()
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    if current_user.userid not in [conversation.buyerid, conversation.sellerid]:
        raise HTTPException(status_code=403, detail="Not authorized to view this conversation")
    
    # Get the other user in the conversation
    other_userid = conversation.sellerid if current_user.userid == conversation.buyerid else conversation.buyerid
    other_user = db.query(models.User).filter(models.User.userid == other_userid).first()
    
    # Get listing info
    listing = db.query(models.Listing).filter(models.Listing.itemid == conversation.itemid).first()
    
    # Get all messages between these two users
    messages = db.query(models.Message).filter(
        ((models.Message.senderid == current_user.userid) & (models.Message.receiverid == other_userid)) |
        ((models.Message.senderid == other_userid) & (models.Message.receiverid == current_user.userid))
    ).order_by(models.Message.messagetimestamp.asc()).all()
    
    return {
        "conversationid": conversationid,
        "item": {
            "itemid": listing.itemid if listing else None,
            "description": listing.description if listing else None,
            "photo": listing.photo if listing else None,
            "price": listing.price if listing else None
        },
        "other_user": {
            "userid": other_user.userid if other_user else None,
            "username": other_user.username if other_user else None,
            "firstname": other_user.firstname if other_user else None
        },
        "messages": [
            {
                "messageid": m.messageid,
                "senderid": m.senderid,
                "receiverid": m.receiverid,
                "messagecontent": m.messagecontent,
                "messagetimestamp": m.messagetimestamp.isoformat() if m.messagetimestamp else None,
                "is_mine": m.senderid == current_user.userid
            }
            for m in messages
        ]
    }


@router.get("/inbox")
def get_all_conversations(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Get all conversations for the current user (inbox)"""
    
    conversations = db.query(models.Conversation).options(
        joinedload(models.Conversation.item),
        joinedload(models.Conversation.buyer),
        joinedload(models.Conversation.seller)
    ).filter(
        (models.Conversation.buyerid == current_user.userid) |
        (models.Conversation.sellerid == current_user.userid)
    ).order_by(models.Conversation.createddate.desc()).all()
    
    results = []
    for conv in conversations:
        # Determine the other user
        if conv.buyerid == current_user.userid:
            other_user = conv.seller
        else:
            other_user = conv.buyer
        
        # Get the last message in this conversation
        last_message = db.query(models.Message).filter(
            ((models.Message.senderid == current_user.userid) & (models.Message.receiverid == other_user.userid)) |
            ((models.Message.senderid == other_user.userid) & (models.Message.receiverid == current_user.userid))
        ).order_by(models.Message.messagetimestamp.desc()).first()
        
        results.append({
            "conversationid": conv.conversationid,
            "itemid": conv.itemid,
            "item_description": conv.item.description if conv.item else None,
            "item_photo": conv.item.photo if conv.item else None,
            "item_price": conv.item.price if conv.item else None,
            "other_user": {
                "userid": other_user.userid,
                "username": other_user.username,
                "firstname": other_user.firstname,
                "lastname": other_user.lastname
            },
            "last_message": {
                "content": last_message.messagecontent if last_message else None,
                "timestamp": last_message.messagetimestamp.isoformat() if last_message and last_message.messagetimestamp else None,
                "is_mine": last_message.senderid == current_user.userid if last_message else None
            },
            "createddate": conv.createddate.isoformat() if conv.createddate else None
        })
    
    return results
