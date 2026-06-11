# Pydantic schemas — defines request and response data models for the API.
from pydantic import BaseModel


class InterviewStartRequest(BaseModel):
    topic: str
    difficulty: str


class AnswerRequest(BaseModel):
    question: str
    answer: str
    session_id: str
