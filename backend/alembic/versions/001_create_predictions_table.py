"""create predictions table

Revision ID: 001
Revises: 
Create Date: 2026-07-17
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

# revision identifiers, used by Alembic.
revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'predictions',
        sa.Column('id', UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text('gen_random_uuid()')),
        sa.Column('crop_type', sa.String(100), nullable=False),
        sa.Column('image_filename', sa.String(255), nullable=True),
        sa.Column('farmer_notes', sa.Text(), nullable=True),
        sa.Column('predicted_disease', sa.String(150), nullable=False),
        sa.Column('confidence', sa.Float(), nullable=False),
        sa.Column('severity', sa.String(50), nullable=True),
        sa.Column('recommendation', sa.Text(), nullable=True),
        sa.Column('ai_provider', sa.String(50), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), nullable=False,
                  server_default=sa.text('CURRENT_TIMESTAMP')),
    )

    # Strategic indexes for analytics performance
    op.create_index('idx_predictions_created_at', 'predictions', ['created_at'])
    op.create_index('idx_predictions_disease', 'predictions', ['predicted_disease'])
    op.create_index('idx_predictions_crop_type', 'predictions', ['crop_type'])


def downgrade() -> None:
    op.drop_index('idx_predictions_crop_type')
    op.drop_index('idx_predictions_disease')
    op.drop_index('idx_predictions_created_at')
    op.drop_table('predictions')
