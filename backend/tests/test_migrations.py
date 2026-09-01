from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, inspect


def test_initial_migration_creates_garden_operations_schema(tmp_path):
    database_path = tmp_path / "garden.db"
    config = Config(str(Path(__file__).parents[1] / "alembic.ini"))
    config.set_main_option("sqlalchemy.url", f"sqlite+pysqlite:///{database_path}")

    command.upgrade(config, "head")

    assert {"workspaces", "gardens", "growing_areas", "plantings", "care_events", "care_tasks"} <= set(
        inspect(create_engine(f"sqlite+pysqlite:///{database_path}")).get_table_names()
    )
