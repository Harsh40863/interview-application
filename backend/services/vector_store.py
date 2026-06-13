# Vector store service — manages FAISS index for semantic search over interview Q&A pairs.
import json
import os
from typing import Optional

import faiss
import numpy as np
from dotenv import load_dotenv
from langchain_google_genai import GoogleGenerativeAIEmbeddings

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
EMBEDDING_MODEL = "models/embedding-001"
EMBEDDING_DIM = 768
INDEX_PATH = "faiss_index.index"
METADATA_PATH = "faiss_metadata.json"

# Module-level singletons
_index: Optional[faiss.IndexFlatL2] = None
_metadata: list[dict] = []
_embeddings: Optional[GoogleGenerativeAIEmbeddings] = None


def _get_embeddings() -> GoogleGenerativeAIEmbeddings:
    """Lazily initialise the Google embeddings client."""
    global _embeddings
    if _embeddings is None:
        if not GEMINI_API_KEY:
            raise ValueError(
                "GEMINI_API_KEY is not set. Cannot initialise embeddings."
            )
        _embeddings = GoogleGenerativeAIEmbeddings(
            model=EMBEDDING_MODEL,
            google_api_key=GEMINI_API_KEY,
        )
    return _embeddings


def _embed(text: str) -> np.ndarray:
    """Convert text to a normalised float32 numpy vector."""
    vector = _get_embeddings().embed_query(text)
    arr = np.array(vector, dtype=np.float32).reshape(1, -1)
    return arr


def load_index() -> None:
    """
    Load the FAISS index and metadata from disk if they exist,
    otherwise initialise a fresh empty index.  Called once on app startup.
    """
    global _index, _metadata

    if os.path.exists(INDEX_PATH) and os.path.exists(METADATA_PATH):
        try:
            _index = faiss.read_index(INDEX_PATH)
            with open(METADATA_PATH, "r") as f:
                _metadata = json.load(f)
            print(
                f"[vector_store] Loaded FAISS index ({_index.ntotal} vectors) "
                f"and {len(_metadata)} metadata entries from disk."
            )
            return
        except Exception as exc:
            print(f"[vector_store] Failed to load index from disk: {exc}. Creating fresh index.")

    _index = faiss.IndexFlatL2(EMBEDDING_DIM)
    _metadata = []
    print("[vector_store] Initialised fresh FAISS IndexFlatL2(768).")


def save_index() -> None:
    """Persist the FAISS index and metadata list to disk."""
    global _index, _metadata
    if _index is None:
        return
    try:
        faiss.write_index(_index, INDEX_PATH)
        with open(METADATA_PATH, "w") as f:
            json.dump(_metadata, f, ensure_ascii=False, indent=2)
    except Exception as exc:
        print(f"[vector_store] Warning: failed to save index — {exc}")


def add_to_index(
    session_id: str,
    question: str,
    answer: str,
    score: int,
    topic: str,
) -> None:
    """
    Embed the combined question+answer text, add the vector to the FAISS index,
    append matching metadata, and persist to disk.
    """
    global _index, _metadata
    if _index is None:
        load_index()

    combined = f"Question: {question}\nAnswer: {answer}"
    try:
        vector = _embed(combined)
        _index.add(vector)
        _metadata.append({
            "session_id": session_id,
            "question": question,
            "answer": answer,
            "score": score,
            "topic": topic,
        })
        save_index()
    except Exception as exc:
        # Non-fatal — log and continue so the rest of the flow is unaffected
        print(f"[vector_store] Warning: could not add to index — {exc}")


def search_similar(query_text: str, session_id: str, top_k: int = 5) -> list[dict]:
    """
    Embed query_text, search the FAISS index for the top_k nearest vectors,
    then filter results to only those belonging to the given session_id.
    Returns a list of matching metadata dicts.
    """
    global _index, _metadata
    if _index is None or _index.ntotal == 0:
        return []

    try:
        vector = _embed(query_text)
        k = min(top_k * 4, _index.ntotal)  # over-fetch to allow filtering
        _distances, indices = _index.search(vector, k)

        results = []
        for idx in indices[0]:
            if idx == -1:
                continue
            meta = _metadata[idx]
            if meta.get("session_id") == session_id:
                results.append(meta)
            if len(results) >= top_k:
                break
        return results
    except Exception as exc:
        print(f"[vector_store] Warning: search failed — {exc}")
        return []


def get_weak_topics(session_id: str) -> list[dict]:
    """
    Return all index entries for this session where score <= 5.
    Each entry contains topic and question so the LLM can probe deeper.
    """
    global _metadata
    return [
        {"topic": m["topic"], "question": m["question"], "score": m["score"]}
        for m in _metadata
        if m.get("session_id") == session_id and m.get("score", 10) <= 5
    ]
