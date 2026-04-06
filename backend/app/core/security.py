"""
Security utilities for authentication and password handling
"""

from datetime import datetime, timedelta
from typing import Any

from jose import ExpiredSignatureError, JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash"""
    result: bool = pwd_context.verify(plain_password, hashed_password)
    return result


def get_password_hash(password: str) -> str:
    """Generate password hash"""
    result: str = pwd_context.hash(password)
    return result


def create_access_token(
    subject: Any,
    expires_delta: timedelta | None = None
) -> str:
    """Create JWT access token"""
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode = {"exp": expire, "sub": str(subject), "type": "access"}
    encoded_jwt: str = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt


def create_refresh_token(subject: Any) -> str:
    """Create JWT refresh token"""
    expire = datetime.utcnow() + timedelta(
        days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS
    )

    to_encode = {"exp": expire, "sub": str(subject), "type": "refresh"}
    encoded_jwt: str = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt


class TokenVerificationError(Exception):
    """Exception raised when token verification fails."""

    def __init__(self, error_type: str, message: str):
        self.error_type = error_type
        self.message = message
        super().__init__(message)


def verify_token(token: str, token_type: str | None = None) -> str:
    """
    Verify JWT token and return subject.

    Args:
        token: JWT token string
        token_type: Expected token type ('access' or 'refresh'). If None, any type is accepted.

    Returns:
        Subject string if valid

    Raises:
        TokenVerificationError: If token is expired, invalid, or wrong type
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        # Verify token type if specified
        if token_type is not None:
            actual_type = payload.get("type")
            if actual_type != token_type:
                raise TokenVerificationError(
                    error_type="INVALID_TOKEN",
                    message="令牌类型不正确"
                )
        sub = payload.get("sub")
        if sub is None:
            raise TokenVerificationError(
                error_type="INVALID_TOKEN",
                message="无效的令牌"
            )
        return str(sub)
    except ExpiredSignatureError:
        raise TokenVerificationError(
            error_type="TOKEN_EXPIRED",
            message="令牌已过期"
        ) from None
    except JWTError as e:
        raise TokenVerificationError(
            error_type="INVALID_TOKEN",
            message="无效的令牌"
        ) from e
