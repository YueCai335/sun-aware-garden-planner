"""Create garden operations persistence tables.

Revision ID: 20260831_01
Revises:
Create Date: 2026-08-31
"""

from alembic import op
import sqlalchemy as sa


revision = "20260831_01"
down_revision = None
branch_labels = None
depends_on = None


def care_target_columns() -> list[sa.Column]:
    return [
        sa.Column("target_scope", sa.String(length=32), nullable=False),
        sa.Column("growing_area_external_id", sa.String(length=120), nullable=True),
        sa.Column("growing_area_name_snapshot", sa.String(length=200), nullable=True),
        sa.Column("target_area_deleted", sa.Boolean(), nullable=True),
        sa.Column("planting_external_id", sa.String(length=120), nullable=True),
        sa.Column("planting_name_snapshot", sa.String(length=240), nullable=True),
        sa.Column("target_planting_deleted", sa.Boolean(), nullable=True),
    ]


def upgrade() -> None:
    op.create_table(
        "workspaces",
        sa.Column("id", sa.String(length=120), nullable=False),
        sa.Column("schema_version", sa.Integer(), nullable=False),
        sa.Column("selected_garden_external_id", sa.String(length=120), nullable=False),
        sa.Column("import_hash", sa.String(length=64), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "gardens",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("workspace_id", sa.String(length=120), nullable=False),
        sa.Column("external_id", sa.String(length=120), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("plan_width_meters", sa.Float(), nullable=False),
        sa.Column("plan_depth_meters", sa.Float(), nullable=False),
        sa.ForeignKeyConstraint(["workspace_id"], ["workspaces.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("workspace_id", "external_id"),
    )
    op.create_index("ix_gardens_workspace_id", "gardens", ["workspace_id"])
    op.create_table(
        "growing_areas",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("garden_id", sa.String(length=36), nullable=False),
        sa.Column("external_id", sa.String(length=120), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("kind", sa.String(length=32), nullable=False),
        sa.Column("plan_x", sa.Float(), nullable=False),
        sa.Column("plan_y", sa.Float(), nullable=False),
        sa.Column("plan_rotation_degrees", sa.Float(), nullable=False),
        sa.Column("layout", sa.JSON(), nullable=True),
        sa.ForeignKeyConstraint(["garden_id"], ["gardens.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("garden_id", "external_id"),
    )
    op.create_index("ix_growing_areas_garden_id", "growing_areas", ["garden_id"])
    op.create_table(
        "plantings",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("garden_id", sa.String(length=36), nullable=False),
        sa.Column("growing_area_id", sa.String(length=36), nullable=False),
        sa.Column("external_id", sa.String(length=120), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("common_name", sa.String(length=200), nullable=False),
        sa.Column("crop_family", sa.String(length=32), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("planting_date", sa.Date(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(["garden_id"], ["gardens.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["growing_area_id"], ["growing_areas.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("garden_id", "external_id"),
    )
    op.create_index("ix_plantings_garden_id", "plantings", ["garden_id"])
    for table_name, date_name, kind_name in [("care_events", "occurred_on", "event_type"), ("care_tasks", "due_date", "task_type")]:
        columns = [
            sa.Column("id", sa.String(length=36), nullable=False),
            sa.Column("garden_id", sa.String(length=36), nullable=False),
            sa.Column("external_id", sa.String(length=120), nullable=False),
            sa.Column("position", sa.Integer(), nullable=False),
            sa.Column(kind_name, sa.String(length=32), nullable=False),
            sa.Column(date_name, sa.Date(), nullable=False),
            sa.Column("note", sa.Text(), nullable=False),
            *care_target_columns(),
        ]
        if table_name == "care_events":
            columns.extend(
                [
                    sa.Column("fertilizer_product", sa.String(length=200), nullable=True),
                    sa.Column("fertilizer_amount", sa.Float(), nullable=True),
                    sa.Column("fertilizer_unit", sa.String(length=80), nullable=True),
                ]
            )
        else:
            columns.append(sa.Column("repeat_interval_days", sa.Integer(), nullable=True))
        columns.extend(
            [
                sa.ForeignKeyConstraint(["garden_id"], ["gardens.id"], ondelete="CASCADE"),
                sa.PrimaryKeyConstraint("id"),
                sa.UniqueConstraint("garden_id", "external_id"),
            ]
        )
        op.create_table(table_name, *columns)
        op.create_index(f"ix_{table_name}_garden_id", table_name, ["garden_id"])


def downgrade() -> None:
    for table_name in ["care_tasks", "care_events", "plantings", "growing_areas", "gardens", "workspaces"]:
        op.drop_table(table_name)
