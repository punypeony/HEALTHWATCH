"""JWT bearer authentication and caregiver account operations."""
import os
from datetime import datetime, timedelta, timezone
from typing import Annotated

import jwt
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app import database
from app.errors import ApiError
from app.models import User
from app.passwords import hash_password, verify_password
from app.schemas import RegisterInput, LoginInput

JWT_ALGORITHM = 'HS256'
TOKEN_LIFETIME = timedelta(hours=1)
JWT_ISSUER = 'food-monitor'
JWT_AUDIENCE = 'food-monitor-mobile'
bearer = HTTPBearer(auto_error=False)
DUMMY_PASSWORD_HASH = hash_password('dummy-password-for-timing-only')


def get_session():
    with Session(database.engine) as session:
        yield session


DbSession = Annotated[Session, Depends(get_session)]


def jwt_secret() -> str:
    secret = os.getenv('JWT_SECRET')
    if not secret or not secret.strip():
        raise ApiError(503, 'CONFIGURATION_ERROR', 'Authentication is not configured.')
    return secret


def create_access_token(user_id: int) -> str:
    now = datetime.now(timezone.utc)
    return jwt.encode({'sub': str(user_id), 'iat': now, 'exp': now + TOKEN_LIFETIME,
                       'iss': JWT_ISSUER, 'aud': JWT_AUDIENCE}, jwt_secret(), algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> int:
    try:
        payload = jwt.decode(token, jwt_secret(), algorithms=[JWT_ALGORITHM],
                             issuer=JWT_ISSUER, audience=JWT_AUDIENCE,
                             options={'require': ['sub', 'exp', 'iat', 'iss', 'aud']})
        subject = payload['sub']
        if not isinstance(subject, str) or not subject.isascii() or not subject.isdigit():
            raise ValueError('Invalid subject')
        user_id = int(subject)
        if not 0 < user_id <= 2147483647:
            raise ValueError('Invalid subject')
        return user_id
    except (jwt.InvalidTokenError, ValueError, TypeError, OverflowError) as exc:
        raise ApiError(401, 'UNAUTHORIZED', 'Invalid or expired authentication token.') from exc


def get_current_user(session: DbSession,
                     credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)]) -> User:
    if credentials is None or credentials.scheme.lower() != 'bearer':
        raise ApiError(401, 'UNAUTHORIZED', 'Bearer authentication is required.')
    user = session.get(User, decode_access_token(credentials.credentials))
    if user is None:
        raise ApiError(401, 'UNAUTHORIZED', 'Invalid or expired authentication token.')
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def register_user(session: Session, data: RegisterInput) -> User:
    if session.scalar(select(User.id).where(User.email == data.email)) is not None:
        raise ApiError(409, 'DUPLICATE_EMAIL', 'An account with this email already exists.')
    user = User(name=data.name, email=data.email, password_hash=hash_password(data.password))
    session.add(user)
    try:
        session.commit()
    except IntegrityError as exc:
        session.rollback()
        if getattr(exc.orig, 'sqlstate', None) == '23505':
            raise ApiError(409, 'DUPLICATE_EMAIL', 'An account with this email already exists.') from exc
        raise
    session.refresh(user)
    return user


def authenticate_user(session: Session, data: LoginInput) -> User:
    user = session.scalar(select(User).where(User.email == data.email))
    valid = verify_password(data.password, user.password_hash if user else DUMMY_PASSWORD_HASH)
    if user is None or not valid:
        raise ApiError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.')
    return user
