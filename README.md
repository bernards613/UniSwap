UniSwap – Oakland University Dorm Marketplace

UniSwap is a web-based marketplace designed for Oakland University students to buy, sell, and exchange dorm-related items—especially during move-in and move-out periods.
The platform enables student-to-student, on-campus exchanges with simple item posting, messaging, and local pickup coordination.

🚀 Project Structure
UniSwap/
│── frontend/        # Vite + React (client)
│── backend/         # Python backend (API)
│── database/        # Database files, schemas, or migrations
│── docs/            # Project documentation
│── images/          # App mockups, UI design assets
│── README.md

🖥️ Frontend (React + Vite)
Tech Stack

React

Vite

JavaScript

Node.js

Setup & Run
1. Navigate to the frontend folder:
cd frontend/uniswap

2. Install dependencies:
npm install

3. Run the development server:
npm run dev


Frontend will open at:

http://localhost:5173/

🐍 Backend (Python)
Tech Stack

Python 3

Virtual environment (venv)

FastAPI

Setup
1. Navigate to backend:
cd backend

2. Activate the virtual environment:

Windows:

venv\Scripts\activate


Mac/Linux:

source venv/bin/activate

3. Install backend requirements:
pip install -r requirements.txt

4. Run the backend:

(Replace app.py with your backend entry file if different)

python app.py

🗄️ Database

SQLite (local dev)

PostgreSQL

📌 Features (Planned)
🎒 Marketplace

Post items with photos & descriptions

Browse listings by category

Search & filter

Mark item as sold

👥 User Accounts

Student login

Profile page

View your listings

💬 Messaging

Chat between buyers & sellers

Notification system

📍 Campus-Focused Design

Only Oakland University students

Local pickup locations

“Dorm Only” exchange rules

🤝 Contributing

Create a new branch (frontend-dev or backend-dev)

Make changes

Commit and push

Open a Pull Request

📄 License

This project is for educational use for the Oakland University senior capstone course.
