# Database service — manages async MongoDB connection and database operations.
import os
from datetime import datetime
from typing import Optional

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "ai_mock_interviewer")

client: Optional[AsyncIOMotorClient] = None
db = None


async def save_session(session_id: str, question: str, topic: str, difficulty: str, user_id: Optional[str] = None):
    """Save a new interview session to the database with multi-question structure."""
    if db is None:
        raise RuntimeError("Database not connected")
    await db.sessions.insert_one({
        "session_id": session_id,
        "topic": topic,
        "difficulty": difficulty,
        "current_question": question,
        "questions": [],
        "current_index": 0,
        "status": "in_progress",
        "total_questions": 5,
        "user_id": user_id,
        "created_at": datetime.utcnow(),
    })


async def get_session(session_id: str) -> dict:
    """Retrieve an interview session from the database by session ID."""
    if db is None:
        raise RuntimeError("Database not connected")
    session = await db.sessions.find_one({"session_id": session_id})
    if not session:
        raise RuntimeError(f"Session {session_id} not found")
    session.pop("_id", None)
    return session


async def save_answer(
    session_id: str,
    question: str,
    answer: str,
    score: int,
    feedback: str,
    improvements: str,
    next_question: Optional[str] = None,
):
    """
    Push the answered question into the questions array, increment current_index,
    update status to 'completed' if all questions are answered, and set the next
    current_question if the session is still in progress.
    """
    if db is None:
        raise RuntimeError("Database not connected")

    entry = {
        "question": question,
        "answer": answer,
        "score": score,
        "feedback": feedback,
        "improvements": improvements,
    }

    update: dict = {
        "$push": {"questions": entry},
        "$inc": {"current_index": 1},
    }

    # Peek at the current session to decide status and next question
    session = await get_session(session_id)
    new_index = session["current_index"] + 1
    total = session["total_questions"]

    if new_index >= total:
        update["$set"] = {"status": "completed", "current_question": None}
    else:
        update["$set"] = {"current_question": next_question}

    await db.sessions.update_one({"session_id": session_id}, update)


async def get_session_results(session_id: str) -> dict:
    """Fetch the full session document including all answered questions."""
    if db is None:
        raise RuntimeError("Database not connected")
    session = await db.sessions.find_one({"session_id": session_id})
    if not session:
        raise RuntimeError(f"Session {session_id} not found")
    session.pop("_id", None)
    return session


async def get_user_sessions(user_id: str) -> list:
    """Fetch all interview sessions belonging to a user, newest first."""
    if db is None:
        raise RuntimeError("Database not connected")
    cursor = db.sessions.find({"user_id": user_id}).sort("created_at", -1)
    sessions = []
    async for session in cursor:
        session.pop("_id", None)
        # Calculate average score from answered questions
        questions = session.get("questions", [])
        if questions:
            scores = [q.get("score", 0) for q in questions if isinstance(q.get("score"), (int, float))]
            session["average_score"] = round(sum(scores) / len(scores), 1) if scores else 0
        else:
            session["average_score"] = 0
        sessions.append(session)
    return sessions



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
