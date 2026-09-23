"""One public error envelope for application and framework failures."""
import logging

from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError
from starlette.exceptions import HTTPException

logger = logging.getLogger(__name__)


class ApiError(Exception):
    def __init__(self, status: int, code: str, message: str):
        self.status, self.code, self.message = status, code, message


def error_response(status: int, code: str, message: str, headers=None):
    return JSONResponse(status_code=status, content={'error': {'code': code, 'message': message}}, headers=headers)


async def api_error_handler(request: Request, exc: ApiError):
    headers = {'WWW-Authenticate': 'Bearer'} if exc.status == 401 else None
    return error_response(exc.status, exc.code, exc.message, headers)


async def validation_error_handler(request: Request, exc: RequestValidationError):
    # Never echo raw validation input: it can contain passwords or tokens.
    return error_response(422, 'VALIDATION_ERROR', 'Request fields are missing or invalid.')


async def http_error_handler(request: Request, exc: HTTPException):
    codes = {400: 'VALIDATION_ERROR', 401: 'UNAUTHORIZED', 403: 'FORBIDDEN',
             404: 'NOT_FOUND', 405: 'METHOD_NOT_ALLOWED'}
    return error_response(exc.status_code, codes.get(exc.status_code, 'HTTP_ERROR'), str(exc.detail), exc.headers)


async def database_error_handler(request: Request, exc: SQLAlchemyError):
    return error_response(503, 'DATABASE_ERROR', 'Database is unavailable.')


async def unexpected_error_handler(request: Request, exc: Exception):
    logger.error('Unhandled API error of type %s', type(exc).__name__)
    return error_response(500, 'INTERNAL_ERROR', 'An unexpected error occurred.')
