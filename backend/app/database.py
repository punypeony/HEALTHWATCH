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
    """Create missing development tables, then add intake columns on existing meal logs."""
    from app import models  # noqa: F401 -- register metadata and profile hook

    Base.metadata.create_all(engine)
    with engine.begin() as connection:
        connection.execute(text(
            'ALTER TABLE meal_logs ADD COLUMN IF NOT EXISTS eaten boolean NOT NULL DEFAULT false'))
        connection.execute(text(
            'ALTER TABLE meal_logs ADD COLUMN IF NOT EXISTS grams_eaten numeric(7, 2)'))
        connection.execute(text("""
            DO $$ BEGIN
                ALTER TABLE meal_logs ADD CONSTRAINT ck_meal_logs_eaten_grams
                CHECK ((eaten = false AND grams_eaten IS NULL)
                    OR (eaten = true AND grams_eaten > 0));
            EXCEPTION WHEN duplicate_object THEN NULL;
            END $$
        """))


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
