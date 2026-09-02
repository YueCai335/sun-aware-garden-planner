from app.database import database_url


def test_database_url_accepts_standard_postgres_connection_strings(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", "postgresql://user:password@host:5432/database?sslmode=require")
    assert database_url() == "postgresql+psycopg://user:password@host:5432/database?sslmode=require"

    monkeypatch.setenv("DATABASE_URL", "postgres://user:password@host:5432/database")
    assert database_url() == "postgresql+psycopg://user:password@host:5432/database"
