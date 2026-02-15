"""
Database initialization script.
Creates all database tables defined in models.py
"""
from app.database import Base, engine
from app import models  # Import all models to register them with Base

def init_db():
    """Create all database tables"""
    try:
        print("Creating database tables...")
        Base.metadata.create_all(bind=engine)
        print("✓ Database tables created successfully!")
        return True
    except Exception as e:
        print(f"✗ Error creating database tables: {e}")
        return False

if __name__ == "__main__":
    init_db()
