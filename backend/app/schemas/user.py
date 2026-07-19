"""
Pydantic schemas for User registration, login, and profile serialization.
"""

from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict


class UserRegister(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, description="Unique username")
    password: str = Field(..., min_length=6, max_length=50, description="Plaintext password")
    role: str = Field("FARMER", description="Role: FARMER or AGRONOMIST")


class UserLogin(BaseModel):
    username: str = Field(..., description="Username")
    password: str = Field(..., description="Password")


class UserResponse(BaseModel):
    id: UUID
    username: str
    role: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenPayload(BaseModel):
    sub: str | None = None  # user ID
    role: str | None = None  # user role
