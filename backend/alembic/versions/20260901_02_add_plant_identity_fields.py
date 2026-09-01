"""Add optional plant type and variety fields.

Revision ID: 20260901_02
Revises: 20260831_01
Create Date: 2026-09-01
"""

from alembic import op
import sqlalchemy as sa


revision = "20260901_02"
down_revision = "20260831_01"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("plantings", sa.Column("plant_type", sa.String(length=200), nullable=True))
    op.add_column("plantings", sa.Column("variety", sa.String(length=200), nullable=True))


def downgrade() -> None:
    op.drop_column("plantings", "variety")
    op.drop_column("plantings", "plant_type")
