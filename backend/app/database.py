import os

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker
from sqlalchemy.pool import StaticPool


class Base(DeclarativeBase):
    pass


def database_url() -> str:
    return os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg://garden@localhost:5433/garden_planner",
    )


def make_engine(url: str):
    options: dict = {"pool_pre_ping": True}
    if url.startswith("sqlite"):
        options.update(
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
    return create_engine(url, **options)


engine = make_engine(database_url())
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def configure_database(url: str) -> None:
    global engine, SessionLocal
    engine.dispose()
    engine = make_engine(url)
    SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_session():
    with SessionLocal() as session:
        yield session
