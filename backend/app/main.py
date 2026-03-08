from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text, inspect
from app.routers import users, listings, messages, transactions, buyer_requests
from app.database import Base, engine
from app import models


app = FastAPI()


def migrate_conversation_table():
    """Add requestid column and make itemid nullable for buyer-request conversations."""
    try:
        insp = inspect(engine)
        if "conversation" not in insp.get_table_names():
            return
        cols = {c["name"] for c in insp.get_columns("conversation")}
        if "requestid" in cols:
            return
        with engine.connect() as conn:
            conn.execute(text(
                "CREATE TABLE conversation_new ("
                "conversationid SERIAL PRIMARY KEY, "
                "itemid INTEGER REFERENCES listing(itemid), "
                "buyerid INTEGER NOT NULL REFERENCES users(userid), "
                "sellerid INTEGER NOT NULL REFERENCES users(userid), "
                "createddate TIMESTAMP, "
                "requestid INTEGER REFERENCES buyerrequest(requestid))"
            ))
            conn.execute(text(
                "INSERT INTO conversation_new (conversationid, itemid, buyerid, sellerid, createddate) "
                "SELECT conversationid, itemid, buyerid, sellerid, createddate FROM conversation"
            ))
            conn.execute(text("DROP TABLE conversation"))
            conn.execute(text("ALTER TABLE conversation_new RENAME TO conversation"))
            conn.commit()
        print("Conversation table migrated for buyer requests.")
    except Exception as e:
        print(f"Conversation migration note: {e}")


@app.on_event("startup")
def create_tables():
    """Create all database tables when the app starts"""
    try:
        print("Initializing database tables...")
        Base.metadata.create_all(bind=engine)
        migrate_conversation_table()
        print("Database tables initialized successfully!")
    except Exception as e:
        print(f"Error initializing database tables: {e}")
        print("Please check your database connection and try again.")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "http://localhost:5177",
        "http://localhost:5178",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(listings.router)
app.include_router(messages.router)
app.include_router(transactions.router)
app.include_router(buyer_requests.router)
app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
def home():
    return {"message": "Welcome to UniSwap API"}