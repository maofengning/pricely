"""
Authentication API routes
"""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import verify_token
from app.models.user import User
from app.schemas.user import (
    UserCreate,
    UserLogin,
    UserResponse,
    AuthResponse,
    TokenRefreshRequest,
    TokenRefreshResponse,
)
from app.schemas.common import SuccessResponse
from app.services.auth_service import AuthService


router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer()


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    db: Annotated[Session, Depends(get_db)],
) -> User:
    """Get current authenticated user"""
    token = credentials.credentials
    user_id = verify_token(token)

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )

    auth_service = AuthService(db)
    user = auth_service.get_by_id(UUID(user_id))

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    return user


@router.post("/register", response_model=AuthResponse)
async def register(
    user_data: UserCreate,
    db: Annotated[Session, Depends(get_db)],
):
    """Register a new user"""
    auth_service = AuthService(db)
    return auth_service.register(user_data)


@router.post("/login", response_model=AuthResponse)
async def login(
    credentials: UserLogin,
    db: Annotated[Session, Depends(get_db)],
):
    """Login user"""
    auth_service = AuthService(db)
    return auth_service.login(credentials.email, credentials.password)


@router.post("/refresh", response_model=TokenRefreshResponse)
async def refresh_token(
    token_data: TokenRefreshRequest,
    db: Annotated[Session, Depends(get_db)],
):
    """Refresh access token"""
    auth_service = AuthService(db)
    return auth_service.refresh_tokens(token_data.refreshToken)


@router.post("/logout", response_model=SuccessResponse)
async def logout(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
):
    """Logout user"""
    auth_service = AuthService(db)
    auth_service.logout(current_user.id)
    return SuccessResponse(message="Logged out successfully")


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Get current user information"""
    return UserResponse.model_validate(current_user)