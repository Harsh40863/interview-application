# Pydantic schemas — defines request and response data models for the API.
from pydantic import BaseModel


class InterviewStartRequest(BaseModel):
    topic: str
    difficulty: str


class AnswerRequest(BaseModel):
    answer: str
    session_id: str


# ── Authentication schemas ──────────────────────────────────────────────────

class UserRegister(BaseModel):
    email: str
    password: str
    name: str


class UserLogin(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
