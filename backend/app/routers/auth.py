import os
import secrets
import hashlib

from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel

router = APIRouter(prefix="/auth", tags=["auth"])

# Simple token-based auth. Password defaults to "admin", override via ADMIN_PASSWORD env var.
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "admin")
# A static bearer token we compare against (no expiry, single-user)
ADMIN_TOKEN = os.environ.get(
    "ADMIN_TOKEN",
    hashlib.sha256(b"inventory-admin-token-secret").hexdigest()[:32],
)


class LoginRequest(BaseModel):
    password: str


class LoginResponse(BaseModel):
    token: str
    message: str


@router.post("/login", response_model=LoginResponse)
def login(body: LoginRequest):
    if body.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid password")
    return LoginResponse(
        token=ADMIN_TOKEN,
        message="Login successful",
    )


@router.get("/verify")
def verify(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")
    # Accept "Bearer <token>" or bare token
    token = authorization.replace("Bearer ", "").strip()
    if token != ADMIN_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid token")
    return {"status": "ok"}


def require_admin(authorization: str = Header(None)):
    """Dependency that raises 401 if the request isn't authenticated."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")
    token = authorization.replace("Bearer ", "").strip()
    if token != ADMIN_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid token")
    return True