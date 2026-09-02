"""Add separate season plans and planned plantings.

Revision ID: 20260902_06
Revises: 20260901_05
Create Date: 2026-09-02
"""

from alembic import op
import sqlalchemy as sa


revision = "20260902_06"
down_revision = "20260901_05"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "season_plans",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("garden_id", sa.String(length=36), nullable=False),
        sa.Column("external_id", sa.String(length=120), nullable=False),
        sa.Column("season_year", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["garden_id"], ["gardens.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("garden_id", "external_id"),
        sa.UniqueConstraint("garden_id", "season_year"),
    )
    op.create_index("ix_season_plans_garden_id", "season_plans", ["garden_id"])
    op.create_table(
        "planned_plantings",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("season_plan_id", sa.String(length=36), nullable=False),
        sa.Column("growing_area_id", sa.String(length=36), nullable=False),
        sa.Column("external_id", sa.String(length=120), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("common_name", sa.String(length=200), nullable=False),
        sa.Column("plant_type", sa.String(length=200), nullable=True),
        sa.Column("variety", sa.String(length=200), nullable=True),
        sa.Column("crop_family", sa.String(length=32), nullable=False),
        sa.ForeignKeyConstraint(["season_plan_id"], ["season_plans.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["growing_area_id"], ["growing_areas.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("season_plan_id", "external_id"),
    )
    op.create_index("ix_planned_plantings_season_plan_id", "planned_plantings", ["season_plan_id"])


def downgrade() -> None:
    op.drop_index("ix_planned_plantings_season_plan_id", table_name="planned_plantings")
    op.drop_table("planned_plantings")
    op.drop_index("ix_season_plans_garden_id", table_name="season_plans")
    op.drop_table("season_plans")
