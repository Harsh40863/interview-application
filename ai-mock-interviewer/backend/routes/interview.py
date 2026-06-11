# Interview routes — handles starting interviews and submitting answers.
from uuid import uuid4

from fastapi import APIRouter, HTTPException

from models.schemas import AnswerRequest, InterviewStartRequest
from services.llm_service import evaluate_answer, generate_question

router = APIRouter(prefix="/interview", tags=["interview"])


@router.post("/start")
async def start_interview(request: InterviewStartRequest):
    try:
        question = generate_question(request.topic, request.difficulty)
        session_id = str(uuid4())
        await save_session(session_id, question, request.topic, request.difficulty) 
        return {"session_id": session_id, "question": question}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start interview: {str(e)}")


@router.post("/answer")
async def submit_answer(request: AnswerRequest):
    try:
        evaluation = evaluate_answer(request.question, request.answer)
        return evaluation
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to evaluate answer: {str(e)}")
