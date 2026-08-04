# Auth routes — handles user registration and login with JWT token issuance.
from datetime import datetime

from fastapi import APIRouter, HTTPException, status

from models.schemas import TokenResponse, UserLogin, UserRegister
from services.auth_service import create_access_token, hash_password, verify_password
import services.db_service as db_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse)
async def register(request: UserRegister):
    """Register a new user. Returns a JWT access token on success."""
    db = await db_service.get_db()

    # Check for duplicate email
    existing = await db.users.find_one({"email": request.email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists",
        )

    hashed_pw = hash_password(request.password)
    result = await db.users.insert_one({
        "email": request.email,
        "name": request.name,
        "password": hashed_pw,
        "created_at": datetime.utcnow(),
    })

    user_id = str(result.inserted_id)
    access_token = create_access_token({"user_id": user_id, "email": request.email, "name": request.name})
    return TokenResponse(access_token=access_token, token_type="bearer")


@router.post("/login", response_model=TokenResponse)
async def login(request: UserLogin):
    """Authenticate an existing user. Returns a JWT access token on success."""
    db = await db_service.get_db()

    user = await db.users.find_one({"email": request.email})
    if not user or not verify_password(request.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = str(user["_id"])
    access_token = create_access_token({"user_id": user_id, "email": user["email"], "name": user.get("name", "")})
    return TokenResponse(access_token=access_token, token_type="bearer")
