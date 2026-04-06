"""
User schemas for API request/response
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    """Base user schema"""
    email: EmailStr
    nickname: str | None = None


class UserCreate(UserBase):
    """User registration request"""
    password: str = Field(..., min_length=8, max_length=100)


class UserLogin(BaseModel):
    """User login request"""
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """User response"""
    id: UUID
    email: str
    nickname: str | None = None
    created_at: datetime
    is_active: bool

    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    """Authentication response"""
    userId: UUID
    token: str
    refreshToken: str
    user: UserResponse | None = None


class TokenRefreshRequest(BaseModel):
    """Token refresh request"""
    refreshToken: str


class TokenRefreshResponse(BaseModel):
    """Token refresh response"""
    token: str


class UserUpdate(BaseModel):
    """User update request"""
    nickname: str | None = None


class PasswordChange(BaseModel):
    """Password change request"""
    currentPassword: str = Field(..., min_length=8, max_length=100)
    newPassword: str = Field(..., min_length=8, max_length=100)


# Aliases for frontend compatibility
LoginRequest = UserLogin
RegisterRequest = UserCreate
