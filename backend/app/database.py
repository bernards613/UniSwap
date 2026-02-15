from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from dotenv import load_dotenv
from pathlib import Path

backend_dir = Path(__file__).parent.parent
env_path = backend_dir / ".env"

load_dotenv(dotenv_path=str(env_path), override=True)
load_dotenv(dotenv_path=env_path, override=True)

load_dotenv(override=True)

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL and env_path.exists():
    with open(env_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                if key.strip() == 'DATABASE_URL':
                    DATABASE_URL = value.strip()
                    os.environ['DATABASE_URL'] = DATABASE_URL
                    break

if not DATABASE_URL:
    raise ValueError(
        f"DATABASE_URL not found in environment variables. "
        f"Please create a .env file at {env_path} with DATABASE_URL set."
    )

if DATABASE_URL and DATABASE_URL.startswith("sqlite"):
    db_path = DATABASE_URL.replace("sqlite:///", "").replace("sqlite://", "")
    db_dir = os.path.dirname(db_path)
    if db_dir and not os.path.exists(db_dir):
        os.makedirs(db_dir, exist_ok=True)
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
print("DATABASE_URL =", DATABASE_URL)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()