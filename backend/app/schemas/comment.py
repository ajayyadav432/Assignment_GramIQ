"""
Pydantic schemas for comment request validation and response serialization.
"""

from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict


class CommentCreate(BaseModel):
    """Schema for creating a comment."""
    content: str = Field(..., min_length=1, max_length=2000, description="The content of the comment")


class CommentResponse(BaseModel):
    """Schema for comment response."""
    id: UUID
    prediction_id: UUID
    user_id: UUID
    content: str
    upvotes: int
    downvotes: int
    created_at: datetime
    username: str
    user_role: str
    user_vote: str | None = None  # "upvote", "downvote", or None

    model_config = ConfigDict(from_attributes=True)


class VoteRequest(BaseModel):
    """Schema for voting on a comment."""
    vote_type: str = Field(..., description="vote_type: upvote or downvote")
