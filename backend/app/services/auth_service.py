"""
Authentication service
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.user import User, Fund
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    verify_token,
)
from app.core.config import settings
from app.schemas.user import (
    UserCreate,
    AuthResponse,
    UserResponse,
)


class AuthService:
    """Authentication service class"""

    def __init__(self, db: Session):
        self.db = db

    def get_by_email(self, email: str) -> Optional[User]:
        """Get user by email"""
        return self.db.query(User).filter(User.email == email).first()

    def get_by_id(self, user_id: UUID) -> Optional[User]:
        """Get user by ID"""
        return self.db.query(User).filter(User.id == user_id).first()

    def create_user(self, user_data: UserCreate) -> User:
        """Create a new user"""
        # Check if email already exists
        existing_user = self.get_by_email(user_data.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

        # Create user
        user = User(
            email=user_data.email,
            password_hash=get_password_hash(user_data.password),
            nickname=user_data.nickname,
        )
        self.db.add(user)
        self.db.flush()  # Get user ID

        # Create initial fund for user
        fund = Fund(
            user_id=user.id,
            total_balance=settings.INITIAL_CAPITAL,
            available=settings.INITIAL_CAPITAL,
            frozen=0,
            initial_capital=settings.INITIAL_CAPITAL,
        )
        self.db.add(fund)
        self.db.commit()
        self.db.refresh(user)

        return user

    def authenticate(self, email: str, password: str) -> Optional[User]:
        """Authenticate user by email and password"""
        user = self.get_by_email(email)
        if not user:
            return None
        if not verify_password(password, user.password_hash):
            return None
        return user

    def login(self, email: str, password: str) -> AuthResponse:
        """Login user and return tokens"""
        user = self.authenticate(email, password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is deactivated"
            )

        # Generate tokens
        access_token = create_access_token(user.id)
        refresh_token = create_refresh_token(user.id)

        return AuthResponse(
            userId=user.id,
            token=access_token,
            refreshToken=refresh_token,
            user=UserResponse.model_validate(user),
        )

    def register(self, user_data: UserCreate) -> AuthResponse:
        """Register new user and return tokens"""
        user = self.create_user(user_data)

        # Generate tokens
        access_token = create_access_token(user.id)
        refresh_token = create_refresh_token(user.id)

        return AuthResponse(
            userId=user.id,
            token=access_token,
            refreshToken=refresh_token,
            user=UserResponse.model_validate(user),
        )

    def refresh_tokens(self, refresh_token: str) -> dict:
        """Refresh access token"""
        user_id = verify_token(refresh_token)
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token"
            )

        user = self.get_by_id(UUID(user_id))
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or deactivated"
            )

        new_access_token = create_access_token(user.id)
        return {"token": new_access_token}

    def logout(self, user_id: UUID) -> bool:
        """Logout user (in production, invalidate tokens in Redis)"""
        # In a real implementation, you would add the token to a blacklist in Redis
        return True