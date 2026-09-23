import os
from pathlib import Path

import pytest
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app import database


@pytest.fixture(autouse=True)
def test_database(monkeypatch):
    """Keep integration tests on the dedicated PostgreSQL test database."""
    load_dotenv(Path(__file__).resolve().parents[1] / ".env")
    engine = create_engine(os.getenv(
        "TEST_DATABASE_URL",
        "postgresql+psycopg://postgres:postgres@localhost:5432/food_monitor_test",
    ))
    monkeypatch.setattr(database, "engine", engine)
    yield
    engine.dispose()


@pytest.fixture
def db_session(test_database):
    """Rollback each test, including commits inside seed-idempotency tests."""
    database.create_tables()
    with database.engine.connect() as connection:
        transaction = connection.begin()
        with Session(bind=connection, join_transaction_mode='create_savepoint') as session:
            yield session
        transaction.rollback()
