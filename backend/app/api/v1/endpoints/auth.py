"""
Authentication endpoints — User registration and login.
"""

import uuid
import logging
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db
from app.core.security import create_access_token, get_password_hash, verify_password
from app.models.user import User
from app.schemas.user import UserRegister, UserResponse, UserLogin, Token

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post(
    "/auth/register",
    response_model=UserResponse,
    status_code=201,
    summary="Register User",
    description="Create a new user account with role FARMER or AGRONOMIST."
)
async def register(
    user_in: UserRegister,
    db: AsyncSession = Depends(get_db)
):
    # Check if username already exists
    result = await db.execute(select(User).where(User.username == user_in.username))
    existing_user = result.scalar_one_or_none()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Username taken",
                "message": f"Username '{user_in.username}' is already registered."
            }
        )

    # Normalize role to uppercase
    role = user_in.role.strip().upper()
    if role not in {"FARMER", "AGRONOMIST"}:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "Invalid role",
                "message": f"Role must be either FARMER or AGRONOMIST. Received: {user_in.role}"
            }
        )

    # Create new user
    new_user = User(
        id=uuid.uuid4(),
        username=user_in.username,
        password_hash=get_password_hash(user_in.password),
        role=role
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    logger.info(f"Registered user: {new_user.username} with role {new_user.role}")
    return new_user


@router.post(
    "/auth/login",
    response_model=Token,
    summary="Login",
    description="Authenticate username and password to retrieve JWT access token."
)
async def login(
    credentials: UserLogin,
    db: AsyncSession = Depends(get_db)
):
    # Find user by username
    result = await db.execute(select(User).where(User.username == credentials.username))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "error": "Unauthorized",
                "message": "Invalid username or password."
            }
        )
        
    # Generate token containing username and role
    token_data = {
        "sub": str(user.id),
        "username": user.username,
        "role": user.role
    }
    access_token = create_access_token(data=token_data)
    
    logger.info(f"User logged in: {user.username} ({user.role})")
    return Token(
        access_token=access_token,
        token_type="bearer"
    )
