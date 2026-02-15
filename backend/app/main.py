from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import users, listings, messages, transactions
from app.database import Base, engine
from app import models  # Import all models to register them with Base


app = FastAPI()

# Create database tables on startup
@app.on_event("startup")
def create_tables():
    """Create all database tables when the app starts"""
    try:
        print("Initializing database tables...")
        Base.metadata.create_all(bind=engine)
        print("✓ Database tables initialized successfully!")
    except Exception as e:
        print(f"✗ Error initializing database tables: {e}")
        print("Please check your database connection and try again.")

# Add CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

app.include_router(users.router)
app.include_router(listings.router)
app.include_router(messages.router)
app.include_router(transactions.router)


@app.get("/")
def home():
    return {"message": "Welcome to UniSwap API"}