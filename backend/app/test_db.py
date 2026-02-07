from app.database import engine

try:
    connection = engine.connect()
    print("PostgreSQL database connection successful!")
    connection.close()
except Exception as e:
    print("Error connecting to PostgreSQL:", e)
