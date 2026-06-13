# FastAPI application entry point — configures middleware, routers, and health check.
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes import interview, auth
from services.db_service import close_mongodb_connection, connect_to_mongodb
from services.vector_store import load_index


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongodb()
    load_index()   # Load or initialise FAISS index from disk
    yield
    await close_mongodb_connection()


app = FastAPI(title="AI Mock Interviewer", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(interview.router)
app.include_router(auth.router)


@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "Server is running"}
