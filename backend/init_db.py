"""Run from backend: python init_db.py."""

from app.database import create_tables

if __name__ == "__main__":
    create_tables()
    print("Database tables created.")
