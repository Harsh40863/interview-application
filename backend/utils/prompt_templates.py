# Prompt templates — reusable LangChain prompt strings for question generation and evaluation.

QUESTION_GENERATION_PROMPT = (
    "You are a technical interviewer. Generate a single {difficulty} level "
    "interview question on the topic of {topic}. Return only the question, nothing else."
)

ANSWER_EVALUATION_PROMPT = (
    "You are a technical interviewer. The interview question was: {question}. "
    "The candidate answered: {answer}. Evaluate this answer and respond in this exact "
    "JSON format: {{'score': <number from 1-10>, 'feedback': '<detailed feedback>', "
    "'improvements': '<what could be better>'}}"
)
