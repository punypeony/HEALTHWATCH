"""Database engine and connectivity checks for the FastAPI backend."""

import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg://postgres:postgres@localhost:5432/food_monitor",
)

engine = create_engine(DATABASE_URL, pool_pre_ping=True)


def check_database_connection() -> bool:
    """Return True when PostgreSQL accepts a simple query."""
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))
    return True


def database_is_available() -> bool:
    """Return False when PostgreSQL cannot be reached."""
    try:
        return check_database_connection()
    except SQLAlchemyError:
        return False
