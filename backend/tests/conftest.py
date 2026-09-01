import pytest
from fastapi.testclient import TestClient

from app import database
from app.database import Base
from app.main import app


@pytest.fixture(autouse=True)
def test_database():
    database.configure_database("sqlite+pysqlite://")
    Base.metadata.create_all(database.engine)
    yield
    Base.metadata.drop_all(database.engine)


@pytest.fixture
def client():
    with TestClient(app) as client:
        yield client
