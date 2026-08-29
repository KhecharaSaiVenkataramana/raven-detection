"""
OAOD Project — Auth Utilities
Handles two things:
  1. Password hashing — never store plain passwords
  2. JWT tokens — proof that a user is logged in
"""

import os
import secrets
from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

# ── Config ────────────────────────────────────────────────────────────────────
# SECRET_KEY: used to sign tokens. Must be set via env var in production.
# In dev, a random key is generated per-run if unset (tokens won't survive a restart).
SECRET_KEY = os.environ.get("JWT_SECRET_KEY") or secrets.token_hex(32)
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # tokens last 24 hours

# ── Password hashing ──────────────────────────────────────────────────────────
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(plain_password: str) -> str:
    """Convert plain text password to a safe hash."""
    return pwd_context.hash(plain_password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Check if a plain password matches the stored hash."""
    return pwd_context.verify(plain_password, hashed_password)


# ── JWT tokens ────────────────────────────────────────────────────────────────
def create_access_token(user_id: int, email: str) -> str:
    """
    Create a JWT token that proves the user is logged in.
    The token contains user_id and email, and expires after 24 hours.
    """
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": str(user_id),
        "email": email,
        "exp": expire
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict:
    """
    Decode a JWT token and return its contents.
    Raises an error if the token is invalid or expired.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )


# ── FastAPI dependency — get current logged-in user ───────────────────────────
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_current_user_id(token: str = Depends(oauth2_scheme)) -> int:
    """
    FastAPI dependency. Add this to any protected route like:
        @app.get("/protected")
        def protected(user_id: int = Depends(get_current_user_id)):
            ...
    It automatically reads the token from the request header and
    returns the user's ID.
    """
    payload = decode_access_token(token)
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not identify user from token."
        )
    return int(user_id)


# ── Optional variant — used by routes that work for both guests and logged-in
# users (e.g. detection can be run without an account, but is attributed to
# the user when logged in) ─────────────────────────────────────────────────
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)

def get_current_user_id_optional(token: str = Depends(oauth2_scheme_optional)) -> int | None:
    """Like get_current_user_id, but returns None instead of raising when
    there's no token or it's invalid — for routes that allow guest access."""
    if not token:
        return None
    try:
        payload = decode_access_token(token)
    except HTTPException:
        return None
    user_id = payload.get("sub")
    if user_id is None:
        return None
    return int(user_id)
