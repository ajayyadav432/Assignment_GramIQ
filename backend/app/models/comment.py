"""
SQLAlchemy ORM models for forum comments and upvote/downvote tracking.
"""

import uuid
from datetime import datetime

from sqlalchemy import String, Text, text, Uuid, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import TIMESTAMP
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Comment(Base):
    """
    Represents a forum comment posted by a farmer or agronomist on a prediction case.
    """

    __tablename__ = "comments"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    prediction_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("predictions.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    content: Mapped[str] = mapped_column(
        Text, nullable=False
    )
    upvotes: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False, server_default=text("0")
    )
    downvotes: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False, server_default=text("0")
    )
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP"),
    )

    # Relationships
    prediction = relationship("Prediction", back_populates="comments")
    user = relationship("User")


class CommentVote(Base):
    """
    Tracks which users voted on which comments to prevent multiple voting.
    """

    __tablename__ = "comment_votes"

    comment_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("comments.id", ondelete="CASCADE"),
        primary_key=True,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    vote_type: Mapped[str] = mapped_column(
        String(20), nullable=False, doc="vote_type: upvote or downvote"
    )
