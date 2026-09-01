"""Add workspace-level care records for all-garden actions.

Revision ID: 20260901_03
Revises: 20260901_02
Create Date: 2026-09-01
"""

from alembic import op
import sqlalchemy as sa


revision = "20260901_03"
down_revision = "20260901_02"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "workspace_care_events",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("workspace_id", sa.String(length=120), nullable=False),
        sa.Column("external_id", sa.String(length=120), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("event_type", sa.String(length=32), nullable=False),
        sa.Column("occurred_on", sa.Date(), nullable=False),
        sa.Column("note", sa.Text(), nullable=False),
        sa.Column("fertilizer_product", sa.String(length=200), nullable=True),
        sa.Column("fertilizer_amount", sa.Float(), nullable=True),
        sa.Column("fertilizer_unit", sa.String(length=80), nullable=True),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("workspace_id", "external_id"),
    )
    op.create_index("ix_workspace_care_events_workspace_id", "workspace_care_events", ["workspace_id"])
    op.create_table(
        "workspace_care_tasks",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("workspace_id", sa.String(length=120), nullable=False),
        sa.Column("external_id", sa.String(length=120), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("task_type", sa.String(length=32), nullable=False),
        sa.Column("due_date", sa.Date(), nullable=False),
        sa.Column("note", sa.Text(), nullable=False),
        sa.Column("repeat_interval_days", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("workspace_id", "external_id"),
    )
    op.create_index("ix_workspace_care_tasks_workspace_id", "workspace_care_tasks", ["workspace_id"])


def downgrade() -> None:
    op.drop_table("workspace_care_tasks")
    op.drop_table("workspace_care_events")
