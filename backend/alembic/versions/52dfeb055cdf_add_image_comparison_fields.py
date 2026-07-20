"""add_image_comparison_fields

Revision ID: 52dfeb055cdf
Revises: 2fa5b730f288
Create Date: 2026-07-19 13:29:44.327480
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '52dfeb055cdf'
down_revision: Union[str, None] = '2fa5b730f288'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('predictions', sa.Column('after_image_filename', sa.String(length=255), nullable=True))
    op.add_column('predictions', sa.Column('after_notes', sa.Text(), nullable=True))
    op.add_column('predictions', sa.Column('after_uploaded_at', sa.TIMESTAMP(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column('predictions', 'after_uploaded_at')
    op.drop_column('predictions', 'after_notes')
    op.drop_column('predictions', 'after_image_filename')
