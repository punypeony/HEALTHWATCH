from unittest.mock import patch

from sqlalchemy.exc import SQLAlchemyError

from app.database import check_database_connection, database_is_available


def test_connection_executes_query_against_postgres():
    assert check_database_connection() is True


def test_database_is_available():
    assert database_is_available() is True


def test_database_is_unavailable():
    with patch("app.database.engine.connect", side_effect=SQLAlchemyError("offline")):
        assert database_is_available() is False
