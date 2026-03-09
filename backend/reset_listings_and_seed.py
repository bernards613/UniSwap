"""
Reset listings in the development database and seed 4 test listings.
Run from the backend directory: python reset_listings_and_seed.py
"""
import os
import sys
import shutil
from pathlib import Path
from datetime import datetime

# Run from backend directory so app and .env are found
BACKEND_DIR = Path(__file__).resolve().parent
os.chdir(BACKEND_DIR)
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from sqlalchemy import text, inspect
from app.database import engine

# Cursor assets folder (where the 4 attached images were saved)
ASSETS_DIR = Path(
    os.environ.get(
        "CURSOR_ASSETS",
        r"C:\Users\fasan\.cursor\projects\c-Users-fasan-OneDrive-Desktop-UniSwap-main\assets",
    )
)
STATIC_IMAGES = BACKEND_DIR / "static" / "images"
BACKEND_URL = "http://localhost:8000"

# Map our short name -> (asset filename pattern, listing info)
TEST_LISTINGS = [
    {
        "image_pattern": "brush",
        "title": "CROWN AFFAIR Paddle Hairbrush",
        "description": "Elegant oval hairbrush with mixed black nylon and natural boar bristles. Matte black handle, CROWN AFFAIR branding. Gently detangles and adds shine.",
        "category": "Other",
        "location": "West Hall, Room 204",
        "price": 28.00,
    },
    {
        "image_pattern": "microwave",
        "title": "GE Microwave Oven",
        "description": "Countertop microwave with black finish and stainless steel accents. Digital display, preset buttons for Popcorn, Beverage, Potato, Reheat, Pizza, Vegetable, Auto Defrost. Clean and in excellent condition.",
        "category": "Appliances",
        "location": "North Dorm, Room 101",
        "price": 45.00,
    },
    {
        "image_pattern": "couch",
        "title": "Modern Tan Leather Three-Seater Sofa",
        "description": "Stylish three-seater sofa in tan leather with sleek lines and sturdy wooden legs. Plump cushions, minimal design. Perfect for a modern living space.",
        "category": "Furniture",
        "location": "Campus Housing, Apt 3B",
        "price": 220.00,
    },
    {
        "image_pattern": "computer",
        "title": "Desktop PC Setup with Monitor, Keyboard & Mouse",
        "description": "Complete desktop setup: black flat-screen monitor, full-size keyboard, optical mouse, and vertical PC tower. Minimalist design, ready for study or work.",
        "category": "Electronics",
        "location": "East Hall, Room 305",
        "price": 180.00,
    },
]


def find_asset_image(pattern: str) -> Path | None:
    """Find first file in ASSETS_DIR whose name contains pattern."""
    if not ASSETS_DIR.exists():
        return None
    for f in ASSETS_DIR.iterdir():
        if f.is_file() and pattern.lower() in f.name.lower() and f.suffix.lower() in (".png", ".jpg", ".jpeg"):
            return f
    return None


def copy_images_to_static():
    """Copy the 4 test images to backend/static/images/ with short names."""
    STATIC_IMAGES.mkdir(parents=True, exist_ok=True)
    copied = {}
    for i, listing in enumerate(TEST_LISTINGS):
        pattern = listing["image_pattern"]
        src = find_asset_image(pattern)
        if not src:
            print(f"  Warning: no image found for '{pattern}', skipping copy.")
            continue
        ext = src.suffix.lower()
        short_name = f"test-{pattern}{ext}"
        dest = STATIC_IMAGES / short_name
        shutil.copy2(src, dest)
        copied[pattern] = f"{BACKEND_URL}/static/images/{short_name}"
        print(f"  Copied {src.name} -> static/images/{short_name}")
    return copied


def ensure_listing_has_title(conn):
    """Add title column to listing table if missing (development DB may not have been migrated)."""
    insp = inspect(engine)
    if "listing" not in insp.get_table_names():
        return
    cols = {c["name"] for c in insp.get_columns("listing")}
    if "title" in cols:
        return
    conn.execute(text("ALTER TABLE listing ADD COLUMN title VARCHAR"))
    conn.commit()
    print("  Added title column to listing table.")


def delete_all_listings(conn):
    """Remove related rows then all listings."""
    conn.execute(text("DELETE FROM bookmark"))
    conn.execute(text('DELETE FROM "transaction"'))  # quoted: reserved keyword in SQLite
    conn.execute(text("UPDATE conversation SET itemid = NULL WHERE itemid IS NOT NULL"))
    conn.execute(text("DELETE FROM listing"))
    conn.commit()
    print("  Deleted all bookmarks, transactions, and listings; nulled conversation.itemid.")


def get_first_user_id(conn):
    """Return the first user's ID for use as sellerid."""
    row = conn.execute(text("SELECT userid FROM users ORDER BY userid LIMIT 1")).fetchone()
    if not row:
        raise RuntimeError("No users in database. Create a user account first (register/login).")
    return row[0]


def insert_listings(conn, image_urls: dict):
    """Insert 4 test listings with title, description, price, status, location, photo."""
    sellerid = get_first_user_id(conn)
    posted = datetime.now().isoformat()
    for listing in TEST_LISTINGS:
        pattern = listing["image_pattern"]
        photo = image_urls.get(pattern) or f"{BACKEND_URL}/static/images/monitor.jpg"
        conn.execute(
            text("""
                INSERT INTO listing (sellerid, title, category, location, photo, price, description, status, posteddate)
                VALUES (:sellerid, :title, :category, :location, :photo, :price, :description, 'Available', :posted)
            """),
            {
                "sellerid": sellerid,
                "title": listing["title"],
                "category": listing["category"],
                "location": listing["location"],
                "photo": photo,
                "price": listing["price"],
                "description": listing["description"],
                "posted": posted,
            },
        )
    conn.commit()
    print(f"  Inserted {len(TEST_LISTINGS)} test listings for user id {sellerid}.")


def main():
    print("Resetting development listings and seeding test data...")
    with engine.connect() as conn:
        ensure_listing_has_title(conn)
        delete_all_listings(conn)

    print("Copying test images to static/images/...")
    image_urls = copy_images_to_static()

    print("Inserting test listings...")
    with engine.connect() as conn:
        insert_listings(conn, image_urls)

    print("Done. Restart or refresh the app and open http://localhost:5173 to see the 4 listings with titles and images.")


if __name__ == "__main__":
    main()
