"""FastAPI application entrypoint."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

from app.database import check_database_connection

app = FastAPI(title="Food Consumption Health Monitoring System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=None)
def health() -> dict[str, str] | JSONResponse:
    """Confirm API and PostgreSQL connectivity."""
    try:
        check_database_connection()
    except SQLAlchemyError:
        return JSONResponse(
            status_code=503,
            content={
                "error": {
                    "code": "DATABASE_ERROR",
                    "message": "Database is unavailable.",
                }
            },
        )
    return {"status": "ok"}
