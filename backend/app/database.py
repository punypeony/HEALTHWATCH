"""Database engine and connectivity checks for the FastAPI backend."""

import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import DeclarativeBase, sessionmaker

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg://postgres:postgres@localhost:5432/food_monitor",
)

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine)


class Base(DeclarativeBase):
    pass


def create_tables() -> None:
    """Create missing development tables; does not migrate existing tables."""
    from app import models  # noqa: F401 -- register metadata and profile hook

    Base.metadata.create_all(engine)


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
