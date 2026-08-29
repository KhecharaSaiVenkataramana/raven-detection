"""
OAOD Project — Auth Router
Handles:
  POST /auth/register  — create a new account
  POST /auth/login     — log in and get a token
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database.session import get_db
from database.crud import create_user, get_user_by_email, update_last_login, get_user_by_id
from schemas import UserRegister, UserLogin, TokenResponse, UserOut
from auth_utils import hash_password, verify_password, create_access_token, get_current_user_id

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserOut, status_code=201)
def register(data: UserRegister, db: Session = Depends(get_db)):
    """
    Create a new user account.

    - Checks if email is already taken
    - Hashes the password before saving (never store plain passwords)
    - Returns the new user's info (without the password)
    """
    # Check if email already exists
    existing = get_user_by_email(db, data.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )

    # Hash password and save user
    hashed = hash_password(data.password)
    user = create_user(db, email=data.email, hashed_password=hashed, full_name=data.full_name)

    return user


@router.post("/login", response_model=TokenResponse)
def login(data: UserLogin, db: Session = Depends(get_db)):
    """
    Log in with email and password.

    - Checks the email exists
    - Verifies the password matches the stored hash
    - Returns a JWT token the frontend uses for all future requests
    """
    # Find user by email
    user = get_user_by_email(db, data.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No account found with this email."
        )

    # Check password
    if not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password."
        )

    # Update last login time
    update_last_login(db, user.id)

    # Create and return token
    token = create_access_token(user.id, user.email)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        email=user.email
    )


@router.get("/me", response_model=UserOut)
def get_me(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id)
):
    """
    Get the currently logged-in user's info.
    Requires a valid token in the request header.
    """
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return user
