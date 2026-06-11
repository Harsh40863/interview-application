# LLM service — generates interview questions and evaluates candidate answers via Gemini.
import ast
import json
import os
import re
from dotenv import load_dotenv
from langchain_core.prompts import PromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash-lite")
USE_MOCK_LLM = os.getenv("USE_MOCK_LLM", "false").lower() == "true"

MOCK_QUESTIONS = {
    ("Python", "Easy"): "What is the difference between a list and a tuple in Python?",
    ("Python", "Medium"): "Explain how Python's GIL affects multi-threaded programs.",
    ("Python", "Hard"): "Design a thread-safe in-memory cache with TTL eviction in Python.",
    ("DSA", "Easy"): "What is the time complexity of binary search?",
    ("DSA", "Medium"): "Given an array, find two numbers that add up to a target. Describe your approach.",
    ("DSA", "Hard"): "Explain how you would implement an LRU cache from scratch.",
    ("System Design", "Easy"): "What is the difference between vertical and horizontal scaling?",
    ("System Design", "Medium"): "How would you design a URL shortener?",
    ("System Design", "Hard"): "Design a real-time notification system for 10M users.",
    ("JavaScript", "Easy"): "What is the difference between `let`, `const`, and `var`?",
    ("JavaScript", "Medium"): "Explain the event loop in JavaScript.",
    ("JavaScript", "Hard"): "How would you optimize rendering performance in a large React app?",
    ("Database", "Easy"): "What is the difference between SQL and NoSQL databases?",
    ("Database", "Medium"): "Explain database indexing and when it helps.",
    ("Database", "Hard"): "How would you design a schema for a multi-tenant SaaS app?",
}


def _get_llm() -> ChatGoogleGenerativeAI:
    if not GEMINI_API_KEY:
        raise ValueError(
            "GEMINI_API_KEY is not set. Get one at https://aistudio.google.com/apikey"
        )
    return ChatGoogleGenerativeAI(
        model=GEMINI_MODEL,
        google_api_key=GEMINI_API_KEY,
        max_retries=0,
    )


def _friendly_llm_error(error: Exception) -> str:
    message = str(error)
    if "429" in message or "quota" in message.lower() or "ResourceExhausted" in message:
        return (
            "Gemini API quota exceeded or unavailable. Check your API key at "
            "https://aistudio.google.com/apikey, or set USE_MOCK_LLM=true in .env to use demo questions."
        )
    if "404" in message and "model" in message.lower():
        return f"Gemini model '{GEMINI_MODEL}' not found. Set GEMINI_MODEL in .env to a valid model."
    if "API key" in message or "401" in message or "403" in message:
        return (
            "Invalid Gemini API key. Create one at https://aistudio.google.com/apikey"
        )
    return message


def _mock_question(topic: str, difficulty: str) -> str:
    return MOCK_QUESTIONS.get(
        (topic, difficulty),
        f"Explain a core concept in {topic} at {difficulty} difficulty.",
    )


def _mock_evaluation(question: str, answer: str) -> dict:
    word_count = len(answer.split())
    score = min(10, max(3, word_count // 10 + 4))
    return {
        "score": score,
        "feedback": (
            "Demo mode: Gemini is unavailable, so this is placeholder feedback. "
            f"You wrote {word_count} words for: {question[:80]}..."
        ),
        "improvements": "Add more structure, examples, and trade-offs to strengthen your answer.",
    }


def generate_question(topic: str, difficulty: str) -> str:
    """Generate an interview question for the given topic and difficulty level."""
    if USE_MOCK_LLM:
        return _mock_question(topic, difficulty)

    prompt = PromptTemplate(
        input_variables=["topic", "difficulty"],
        template=(
            "You are a technical interviewer. Generate a single {difficulty} level "
            "interview question on the topic of {topic}. Return only the question, nothing else."
        ),
    )
    try:
        chain = prompt | _get_llm()
        response = chain.invoke({"topic": topic, "difficulty": difficulty})
        return response.content.strip()
    except Exception as e:
        raise RuntimeError(_friendly_llm_error(e)) from e


def _parse_evaluation_response(text: str) -> dict:
    """Parse LLM evaluation response into a dict."""
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        return ast.literal_eval(cleaned)


def evaluate_answer(question: str, answer: str) -> dict:
    """Evaluate a candidate's answer and return structured feedback."""
    if USE_MOCK_LLM:
        return _mock_evaluation(question, answer)

    prompt = PromptTemplate(
        input_variables=["question", "answer"],
        template=(
            "You are a technical interviewer. The interview question was: {question}. "
            "The candidate answered: {answer}. Evaluate this answer and respond in this exact "
            "JSON format: {{'score': <number from 1-10>, 'feedback': '<detailed feedback>', "
            "'improvements': '<what could be better>'}}"
        ),
    )
    try:
        chain = prompt | _get_llm()
        response = chain.invoke({"question": question, "answer": answer})
        return _parse_evaluation_response(response.content)
    except Exception as e:
        raise RuntimeError(_friendly_llm_error(e)) from e
