# FastAPI application entry point — configures middleware, routers, and health check.
import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes import interview, auth
from services.db_service import close_mongodb_connection, connect_to_mongodb
from services.vector_store import load_index

load_dotenv()

FRONTEND_URL = os.getenv("FRONTEND_URL", "")


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongodb()
    load_index()   # Load or initialise FAISS index from disk
    yield
    await close_mongodb_connection()


app = FastAPI(title="AI Mock Interviewer", lifespan=lifespan)

# Build allowed origins list — always include localhost, optionally add FRONTEND_URL
_origins = [
    "http://localhost:5173",
    "http://localhost:5174",
]
if FRONTEND_URL:
    _origins.append(FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    # Also permit any *.vercel.app deployment via regex
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(interview.router)
app.include_router(auth.router)


@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "Server is running"}
