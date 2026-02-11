from fastapi import FastAPI
from app.routers import users, listings, messages, transactions


app = FastAPI()

app.include_router(users.router)
app.include_router(listings.router)
app.include_router(messages.router)
app.include_router(transactions.router)


@app.get("/")
def home():
    return {"message": "Welcome to UniSwap API"}