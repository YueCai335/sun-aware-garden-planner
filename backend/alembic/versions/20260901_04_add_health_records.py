"""Add garden health records and local photo paths.

Revision ID: 20260901_04
Revises: 20260901_03
Create Date: 2026-09-01
"""

from alembic import op
import sqlalchemy as sa


revision = "20260901_04"
down_revision = "20260901_03"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "health_records",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("garden_id", sa.String(length=36), nullable=False),
        sa.Column("external_id", sa.String(length=120), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("observed_on", sa.Date(), nullable=False),
        sa.Column("symptoms", sa.Text(), nullable=False),
        sa.Column("severity", sa.String(length=16), nullable=False),
        sa.Column("photo_paths", sa.JSON(), nullable=False),
        sa.Column("assessment", sa.JSON(), nullable=True),
        sa.Column("target_scope", sa.String(length=32), nullable=False),
        sa.Column("growing_area_external_id", sa.String(length=120), nullable=True),
        sa.Column("growing_area_name_snapshot", sa.String(length=200), nullable=True),
        sa.Column("target_area_deleted", sa.Boolean(), nullable=True),
        sa.Column("planting_external_id", sa.String(length=120), nullable=True),
        sa.Column("planting_name_snapshot", sa.String(length=240), nullable=True),
        sa.Column("target_planting_deleted", sa.Boolean(), nullable=True),
        sa.ForeignKeyConstraint(["garden_id"], ["gardens.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("garden_id", "external_id"),
    )
    op.create_index("ix_health_records_garden_id", "health_records", ["garden_id"])


def downgrade() -> None:
    op.drop_index("ix_health_records_garden_id", table_name="health_records")
    op.drop_table("health_records")
