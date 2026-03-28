from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from datetime import datetime
from app.database import get_db
from app import models, schemas, auth
from app.routers.listings import listing_photo_bundle

router = APIRouter(
    prefix="/messages",
    tags=["Messages"]
)

IMAGE_PREFIX = "[IMAGE]"


@router.post("/send")
def send_message(
    message: schemas.MessageCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Send a message to another user about a listing or buyer request"""

    listing = None
    buyer_request = None

    if message.itemid:
        listing = db.query(models.Listing).filter(models.Listing.itemid == message.itemid).first()
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")
    elif message.requestid:
        buyer_request = db.query(models.BuyerRequest).filter(
            models.BuyerRequest.requestid == message.requestid
        ).first()
        if not buyer_request:
            raise HTTPException(status_code=404, detail="Buyer request not found")
    else:
        raise HTTPException(status_code=400, detail="Either itemid or requestid is required")

    receiver = db.query(models.User).filter(models.User.userid == message.receiverid).first()
    if not receiver:
        raise HTTPException(status_code=404, detail="Receiver not found")

    if message.receiverid == current_user.userid:
        raise HTTPException(status_code=400, detail="Cannot send message to yourself")

    if message.itemid:
        conversation = db.query(models.Conversation).filter(
            models.Conversation.itemid == message.itemid,
            (
                (models.Conversation.buyerid == current_user.userid) &
                (models.Conversation.sellerid == message.receiverid)
            ) | (
                (models.Conversation.buyerid == message.receiverid) &
                (models.Conversation.sellerid == current_user.userid)
            )
        ).first()

        if not conversation:
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
    else:
        conversation = db.query(models.Conversation).filter(
            models.Conversation.requestid == message.requestid,
            (
                (models.Conversation.buyerid == current_user.userid) &
                (models.Conversation.sellerid == message.receiverid)
            ) | (
                (models.Conversation.buyerid == message.receiverid) &
                (models.Conversation.sellerid == current_user.userid)
            )
        ).first()

        if not conversation:
            if buyer_request.userid == current_user.userid:
                buyerid = current_user.userid
                sellerid = message.receiverid
            else:
                buyerid = buyer_request.userid
                sellerid = current_user.userid

            conversation = models.Conversation(
                requestid=message.requestid,
                buyerid=buyerid,
                sellerid=sellerid,
                createddate=datetime.utcnow()
            )
            db.add(conversation)
            db.commit()
            db.refresh(conversation)

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


@router.post("/upload-image")
def upload_message_image(
    payload: dict,
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Accept a base64 data URL image and return it directly.
    The image is NOT written to disk — it will be stored inside the message
    content in PostgreSQL (as [IMAGE]<data_url>), keeping everything in the DB.
    """
    data_url = payload.get("image")
    if not data_url or not isinstance(data_url, str):
        raise HTTPException(status_code=400, detail="No image provided")
    if not data_url.startswith("data:image"):
        raise HTTPException(status_code=400, detail="Image must be a data URL (data:image/...)")
    return {"url": data_url}


@router.delete("/{messageid}")
def delete_message(
    messageid: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Delete a message — only the sender can unsend it."""
    msg = db.query(models.Message).filter(
        models.Message.messageid == messageid
    ).first()

    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")

    if msg.senderid != current_user.userid:
        raise HTTPException(status_code=403, detail="You can only unsend your own messages")

    db.delete(msg)
    db.commit()
    return {"message": "Message deleted", "messageid": messageid}


@router.delete("/conversation/{conversationid}")
def delete_conversation(
    conversationid: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Delete a conversation and all its messages. Both participants can do this."""
    conversation = db.query(models.Conversation).filter(
        models.Conversation.conversationid == conversationid
    ).first()

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if current_user.userid not in [conversation.buyerid, conversation.sellerid]:
        raise HTTPException(status_code=403, detail="Not authorized to delete this conversation")

    other_userid = (
        conversation.sellerid
        if current_user.userid == conversation.buyerid
        else conversation.buyerid
    )

    db.query(models.Message).filter(
        (
            (models.Message.senderid == current_user.userid) &
            (models.Message.receiverid == other_userid)
        ) | (
            (models.Message.senderid == other_userid) &
            (models.Message.receiverid == current_user.userid)
        )
    ).delete(synchronize_session=False)

    db.delete(conversation)
    db.commit()
    return {"message": "Conversation deleted", "conversationid": conversationid}


@router.get("/conversation/{conversationid}")
def get_conversation_messages(
    conversationid: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Get all messages in a conversation"""

    conversation = db.query(models.Conversation).filter(
        models.Conversation.conversationid == conversationid
    ).first()

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if current_user.userid not in [conversation.buyerid, conversation.sellerid]:
        raise HTTPException(status_code=403, detail="Not authorized to view this conversation")

    other_userid = (
        conversation.sellerid
        if current_user.userid == conversation.buyerid
        else conversation.buyerid
    )
    other_user = db.query(models.User).filter(models.User.userid == other_userid).first()

    listing = None
    buyer_request = None

    if conversation.itemid:
        listing = db.query(models.Listing).filter(
            models.Listing.itemid == conversation.itemid
        ).first()
    elif conversation.requestid:
        buyer_request = db.query(models.BuyerRequest).filter(
            models.BuyerRequest.requestid == conversation.requestid
        ).first()

    messages = db.query(models.Message).filter(
        (
            (models.Message.senderid == current_user.userid) &
            (models.Message.receiverid == other_userid)
        ) | (
            (models.Message.senderid == other_userid) &
            (models.Message.receiverid == current_user.userid)
        )
    ).order_by(models.Message.messagetimestamp.asc()).all()

    item_data = None
    request_data = None

    if listing:
        bundle = listing_photo_bundle(listing)
        item_data = {
            "itemid": listing.itemid,
            "description": listing.description,
            "photo": bundle["photo"],
            "photos": bundle["photos"],
            "price": listing.price
        }

    if buyer_request:
        request_data = {
            "requestid": buyer_request.requestid,
            "title": buyer_request.title,
            "description": buyer_request.description,
            "maxprice": buyer_request.maxprice
        }

    return {
        "conversationid": conversationid,
        "item": item_data,
        "request": request_data,
        "other_user": {
            "userid": other_user.userid if other_user else None,
            "username": other_user.username if other_user else None,
            "firstname": other_user.firstname if other_user else None,
            "lastname": other_user.lastname if other_user else None
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
        joinedload(models.Conversation.request),
        joinedload(models.Conversation.buyer),
        joinedload(models.Conversation.seller)
    ).filter(
        (models.Conversation.buyerid == current_user.userid) |
        (models.Conversation.sellerid == current_user.userid)
    ).order_by(models.Conversation.createddate.desc()).all()

    results = []
    for conv in conversations:
        if conv.buyerid == current_user.userid:
            other_user = conv.seller
        else:
            other_user = conv.buyer

        last_message = db.query(models.Message).filter(
            (
                (models.Message.senderid == current_user.userid) &
                (models.Message.receiverid == other_user.userid)
            ) | (
                (models.Message.senderid == other_user.userid) &
                (models.Message.receiverid == current_user.userid)
            )
        ).order_by(models.Message.messagetimestamp.desc()).first()

        item_description = None
        item_price = None

        if conv.item:
            item_description = conv.item.description
            item_price = conv.item.price
        elif conv.request:
            item_description = conv.request.title
            item_price = conv.request.maxprice

        last_content = last_message.messagecontent if last_message else None
        is_image = bool(
            last_message
            and last_message.messagecontent
            and last_message.messagecontent.startswith("[IMAGE]")
        )
        if is_image:
            last_content = "Photo"

        item_photo = None
        item_photos = None
        if conv.item:
            ib = listing_photo_bundle(conv.item)
            item_photo = ib["photo"]
            item_photos = ib["photos"]

        results.append({
            "conversationid": conv.conversationid,
            "itemid": conv.itemid,
            "requestid": conv.requestid,
            "item_description": item_description,
            "item_photo": item_photo,
            "item_photos": item_photos,
            "item_price": item_price,
            "is_buyer_request": conv.requestid is not None,
            "other_user": {
                "userid": other_user.userid,
                "username": other_user.username,
                "firstname": other_user.firstname,
                "lastname": other_user.lastname
            },
            "last_message": {
                "content": last_content,
                "is_image": is_image,
                "timestamp": (
                    last_message.messagetimestamp.isoformat()
                    if last_message and last_message.messagetimestamp
                    else None
                ),
                "is_mine": last_message.senderid == current_user.userid if last_message else None
            },
            "createddate": conv.createddate.isoformat() if conv.createddate else None
        })

    return results