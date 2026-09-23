"""FastAPI application entrypoint."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException

from app.database import check_database_connection
from app.errors import (ApiError, api_error_handler, validation_error_handler,
                        http_error_handler, database_error_handler, unexpected_error_handler)
from app.routes import router

app = FastAPI(title="Food Consumption Health Monitoring System")
app.add_exception_handler(ApiError, api_error_handler)
app.add_exception_handler(RequestValidationError, validation_error_handler)
app.add_exception_handler(HTTPException, http_error_handler)
app.add_exception_handler(SQLAlchemyError, database_error_handler)
app.add_exception_handler(Exception, unexpected_error_handler)
app.include_router(router)

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
