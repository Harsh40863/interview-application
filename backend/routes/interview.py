# Interview routes — handles starting interviews, submitting answers, and fetching results.
import asyncio
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException

from models.schemas import AnswerRequest, InterviewStartRequest
from services.auth_service import get_current_user
from services.db_service import get_session, get_session_results, get_user_sessions, save_answer, save_session
from services.llm_service import evaluate_answer, generate_question
from services.vector_store import add_to_index, get_weak_topics

router = APIRouter(prefix="/interview", tags=["interview"])

TOTAL_QUESTIONS = 5


@router.get("/question/{session_id}")
async def get_question(session_id: str, current_user: dict = Depends(get_current_user)):
    """Return the current question and progress info for a session."""
    try:
        session = await get_session(session_id)
        # Ensure the session belongs to the requesting user
        if session.get("user_id") != current_user["id"]:
            raise HTTPException(status_code=403, detail="Access denied to this session")
        return {
            "question": session["current_question"],
            "current_index": session["current_index"],
            "total_questions": session["total_questions"],
        }
    except HTTPException:
        raise
    except RuntimeError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/start")
async def start_interview(request: InterviewStartRequest, current_user: dict = Depends(get_current_user)):
    """Start a new interview session, generate the first question, and persist to DB."""
    try:
        question = await asyncio.to_thread(generate_question, request.topic, request.difficulty)
        session_id = str(uuid4())
        await save_session(session_id, question, request.topic, request.difficulty, user_id=current_user["id"])
        return {
            "session_id": session_id,
            "question": question,
            "current_index": 0,
            "total_questions": TOTAL_QUESTIONS,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start interview: {str(e)}")


@router.post("/answer")
async def submit_answer(request: AnswerRequest, current_user: dict = Depends(get_current_user)):
    """
    Evaluate the submitted answer, persist it to MongoDB and FAISS, then either
    return the next context-aware question or signal session completion.
    """
    try:
        session = await get_session(request.session_id)

        # Ensure the session belongs to the requesting user
        if session.get("user_id") != current_user["id"]:
            raise HTTPException(status_code=403, detail="Access denied to this session")

        current_question = session["current_question"]
        topic = session["topic"]
        difficulty = session["difficulty"]

        # Evaluate the answer via Gemini
        evaluation = await asyncio.to_thread(evaluate_answer, current_question, request.answer)
        score = evaluation.get("score", 0)
        feedback = evaluation.get("feedback", "")
        improvements = evaluation.get("improvements", "")

        new_index = session["current_index"] + 1
        completed = new_index >= session["total_questions"]

        # ── FAISS: index this Q&A pair (non-fatal if it fails) ──────────────
        try:
            await asyncio.to_thread(
                add_to_index,
                request.session_id,
                current_question,
                request.answer,
                score,
                topic,
            )
        except Exception as ve:
            print(f"[vector_store] Indexing skipped: {ve}")

        # Generate next question (with context) if the session is not yet complete
        next_question = None
        if not completed:
            # Build context string from weak topics detected via FAISS
            try:
                weak = await asyncio.to_thread(get_weak_topics, request.session_id)
            except Exception:
                weak = []

            context: str | None = None
            if weak:
                weak_lines = "\n".join(
                    f"- Topic: {w['topic']}, Score: {w['score']}/10, "
                    f"Question asked: {w['question']}"
                    for w in weak
                )
                # Also include all questions already asked so Gemini avoids repeats
                answered = session.get("questions", [])
                prev_lines = "\n".join(
                    f"- {q['question']}" for q in answered
                )
                prev_lines += f"\n- {current_question}"  # include current (not yet saved)
                context = (
                    f"Previous questions asked:\n{prev_lines}\n\n"
                    f"Topics where candidate scored poorly (score ≤ 5):\n{weak_lines}"
                )
            else:
                # Even without weak topics, pass prior questions to avoid repeats
                answered = session.get("questions", [])
                if answered:
                    prev_lines = "\n".join(f"- {q['question']}" for q in answered)
                    prev_lines += f"\n- {current_question}"
                    context = f"Previous questions asked:\n{prev_lines}"

            next_question = await asyncio.to_thread(
                generate_question, topic, difficulty, context
            )

        # Persist the answer and advance the session state in MongoDB
        await save_answer(
            session_id=request.session_id,
            question=current_question,
            answer=request.answer,
            score=score,
            feedback=feedback,
            improvements=improvements,
            next_question=next_question,
        )

        if completed:
            return {
                "completed": True,
                "session_id": request.session_id,
            }

        return {
            "completed": False,
            "next_question": next_question,
            "current_index": new_index,
            "total_questions": session["total_questions"],
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to evaluate answer: {str(e)}")



@router.get("/results/{session_id}")
async def get_results(session_id: str, current_user: dict = Depends(get_current_user)):
    """Return the full session with all questions, answers, scores, and feedback."""
    try:
        session = await get_session_results(session_id)
        # Ensure the session belongs to the requesting user
        if session.get("user_id") != current_user["id"]:
            raise HTTPException(status_code=403, detail="Access denied to this session")
        return session
    except HTTPException:
        raise
    except RuntimeError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/history")
async def get_history(current_user: dict = Depends(get_current_user)):
    """Return all interview sessions for the authenticated user, newest first."""
    try:
        sessions = await get_user_sessions(current_user["id"])
        return sessions
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch history: {str(e)}")
