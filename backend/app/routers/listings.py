from fastapi import APIRouter

router = APIRouter(
    prefix="/listings",
    tags=["Listings"]
)

@router.get("/")
def get_listings():
    return {"message": "Listings endpoint working"}
