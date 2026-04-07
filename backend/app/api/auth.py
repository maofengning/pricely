"""
Authentication API routes
"""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends

# from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer  # TEMPORARILY DISABLED FOR TESTING
from sqlalchemy.orm import Session

from app.core.database import get_db

# from app.core.exceptions import BusinessError  # TEMPORARILY DISABLED FOR TESTING
# from app.core.security import TokenVerificationError, verify_token  # TEMPORARILY DISABLED FOR TESTING
from app.models.user import User
from app.schemas.common import SuccessResponse
from app.schemas.user import (
    AuthResponse,
    PasswordChange,
    TokenRefreshRequest,
    TokenRefreshResponse,
    UserCreate,
    UserLogin,
    UserResponse,
    UserUpdate,
)
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])
# security = HTTPBearer()  # TEMPORARILY DISABLED FOR TESTING


# Mock test user ID for testing without auth
TEST_USER_ID = "00000000-0000-0000-0000-000000000001"


async def get_current_user(
    # credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],  # TEMPORARILY DISABLED
    db: Annotated[Session, Depends(get_db)],
) -> User:
    """Get current authenticated user - TEMPORARILY DISABLED FOR TESTING"""
    # Original auth check disabled for testing:
    # token = credentials.credentials
    # try:
    #     user_id = verify_token(token)
    # except TokenVerificationError as e:
    #     raise BusinessError(code=e.error_type, message=e.message) from None

    # Return mock test user for testing
    auth_service = AuthService(db)
    user = auth_service.get_by_id(UUID(TEST_USER_ID))

    # Create test user if not exists
    if not user:
        from app.schemas.user import UserCreate
        user = auth_service.create_user(
            UserCreate(
                email="test@test.com",
                password="test123",
                nickname="Test User",
            )
        )

    return user


@router.post("/register", response_model=AuthResponse)
async def register(
    user_data: UserCreate,
    db: Annotated[Session, Depends(get_db)],
) -> AuthResponse:
    """Register a new user"""
    auth_service = AuthService(db)
    return auth_service.register(user_data)


@router.post("/login", response_model=AuthResponse)
async def login(
    credentials: UserLogin,
    db: Annotated[Session, Depends(get_db)],
) -> AuthResponse:
    """Login user"""
    auth_service = AuthService(db)
    return auth_service.login(credentials.email, credentials.password)


@router.post("/refresh", response_model=TokenRefreshResponse)
async def refresh_token(
    token_data: TokenRefreshRequest,
    db: Annotated[Session, Depends(get_db)],
) -> TokenRefreshResponse:
    """Refresh access token"""
    auth_service = AuthService(db)
    return auth_service.refresh_tokens(token_data.refreshToken)


@router.post("/logout", response_model=SuccessResponse)
async def logout(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> SuccessResponse:
    """Logout user"""
    auth_service = AuthService(db)
    auth_service.logout(UUID(str(current_user.id)))
    return SuccessResponse(message="退出登录成功")


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: Annotated[User, Depends(get_current_user)],
) -> UserResponse:
    """Get current user information"""
    return UserResponse.model_validate(current_user)


@router.put("/me", response_model=UserResponse)
async def update_current_user_info(
    user_data: UserUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> UserResponse:
    """Update current user profile"""
    auth_service = AuthService(db)
    return auth_service.update_user(UUID(str(current_user.id)), user_data)


@router.put("/password", response_model=SuccessResponse)
async def change_password(
    password_data: PasswordChange,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> SuccessResponse:
    """Change user password"""
    auth_service = AuthService(db)
    auth_service.change_password(
        UUID(str(current_user.id)),
        password_data.currentPassword,
        password_data.newPassword,
    )
    return SuccessResponse(message="密码修改成功")
