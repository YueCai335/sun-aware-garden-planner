from app.database import database_url, normalize_database_url


def test_database_url_accepts_standard_postgres_connection_strings(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "postgresql://user:password@host:5432/database?sslmode=require")
    assert database_url() == "postgresql+psycopg://user:password@host:5432/database?sslmode=require"

    monkeypatch.setenv("DATABASE_URL", "postgres://user:password@host:5432/database")
    assert database_url() == "postgresql+psycopg://user:password@host:5432/database"


def test_normalize_database_url_supports_alembic_connection_urls():
    assert normalize_database_url("postgresql://user:password@host:5432/database") == (
        "postgresql+psycopg://user:password@host:5432/database"
    )
