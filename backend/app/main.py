from fastapi import FastAPI
from app.routers import users, listings, messages, transactions


app = FastAPI()

app.include_router(users.router)
#TEST 2 MF
@app.get("/")
def home():
    return {"message": "Welcome to UniSwap API"}