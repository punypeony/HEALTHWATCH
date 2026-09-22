from unittest.mock import patch

from fastapi.testclient import TestClient
from sqlalchemy.exc import SQLAlchemyError

from app.main import app

client = TestClient(app)


def test_health_returns_ok_when_database_is_available() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_health_returns_error_when_database_is_unavailable() -> None:
    with patch(
        "app.main.check_database_connection",
        side_effect=SQLAlchemyError("connection failed"),
    ):
        response = client.get("/health")

    assert response.status_code == 503
    assert response.json() == {
        "error": {
            "code": "DATABASE_ERROR",
            "message": "Database is unavailable.",
        }
    }
