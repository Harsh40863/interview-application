# Database service — manages async MongoDB connection and database operations.
import os
from typing import Optional

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "ai_mock_interviewer")

client: Optional[AsyncIOMotorClient] = None
db = None


async def save_session(session_id: str, user_id: str, topic: str, difficulty: str, question: str, answer: str, feedback: str, created_at: datetime):
    """Save a session to the database."""
    from datetime import datetime
    if db is None:
        raise RuntimeError("Database not connected")
    await db.sessions.insert_one({
        "session_id": session_id,
        "topic": topic,
        "difficulty": difficulty,
        "question": question,
        "created_at": datetime.utcnow()})


async def get_session(session_id: str) -> dict:
    if db is None:
        raise RuntimeError("Database not connected")
    session = await db.sessions.find_one({"session_id": session_id})
    if not session:
        raise RuntimeError(f"Session {session_id} not found")
    session.pop("_id", None)
    return session

async def connect_to_mongodb():
    """Establish async connection to MongoDB using Motor."""
    global client, db
    if not MONGODB_URI:
        raise ValueError("MONGODB_URI is not set in .env")

    client = AsyncIOMotorClient(MONGODB_URI)
    await client.admin.command("ping")

    try:
        db = client.get_default_database()
    except Exception:
        db = client[MONGODB_DB_NAME]

    print(f"Connected to MongoDB database: {db.name}")
    return db


async def close_mongodb_connection():
    """Close the MongoDB connection."""
    global client
    if client:
        client.close()
