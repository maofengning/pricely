"""
Authentication service
"""

from uuid import UUID

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import BusinessError
from app.core.security import (
    TokenVerificationError,
    create_access_token,
    create_refresh_token,
    get_password_hash,
    verify_password,
    verify_token,
)
from app.models.user import Fund, User
from app.schemas.user import (
    AuthResponse,
    TokenRefreshResponse,
    UserCreate,
    UserResponse,
)


class AuthService:
    """Authentication service class"""

    def __init__(self, db: Session):
        self.db = db

    def get_by_email(self, email: str) -> User | None:
        """Get user by email"""
        return self.db.query(User).filter(User.email == email).first()

    def get_by_id(self, user_id: UUID) -> User | None:
        """Get user by ID"""
        return self.db.query(User).filter(User.id == user_id).first()

    def create_user(self, user_data: UserCreate) -> User:
        """Create a new user"""
        # Check if email already exists
        existing_user = self.get_by_email(user_data.email)
        if existing_user:
            raise BusinessError(
                code="EMAIL_ALREADY_EXISTS",
                message="该邮箱已被注册",
                details={"email": user_data.email},
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

    def authenticate(self, email: str, password: str) -> User | None:
        """Authenticate user by email and password"""
        user = self.get_by_email(email)
        if not user:
            return None
        if not verify_password(password, str(user.password_hash)):
            return None
        return user

    def login(self, email: str, password: str) -> AuthResponse:
        """Login user and return tokens"""
        user = self.authenticate(email, password)
        if not user:
            raise BusinessError(
                code="INVALID_CREDENTIALS",
                message="邮箱或密码错误",
            )

        if not user.is_active:
            raise BusinessError(
                code="USER_DEACTIVATED",
                message="用户账户已被停用",
                details={"user_id": str(user.id)},
            )

        # Generate tokens
        access_token = create_access_token(user.id)
        refresh_token = create_refresh_token(user.id)

        return AuthResponse(
            userId=UUID(str(user.id)),
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
            userId=UUID(str(user.id)),
            token=access_token,
            refreshToken=refresh_token,
            user=UserResponse.model_validate(user),
        )

    def refresh_tokens(self, refresh_token: str) -> TokenRefreshResponse:
        """Refresh access token using refresh token"""
        # Verify the token is a refresh token
        try:
            user_id = verify_token(refresh_token, token_type="refresh")
        except TokenVerificationError as e:
            raise BusinessError(
                code=e.error_type,
                message=e.message,
            ) from None

        user = self.get_by_id(UUID(user_id))
        if not user:
            raise BusinessError(
                code="USER_NOT_FOUND",
                message="用户不存在",
            )

        if not user.is_active:
            raise BusinessError(
                code="USER_DEACTIVATED",
                message="用户账户已被停用",
                details={"user_id": str(user.id)},
            )

        new_access_token = create_access_token(user.id)
        return TokenRefreshResponse(token=new_access_token)

    def logout(self, user_id: UUID) -> bool:
        """Logout user (in production, invalidate tokens in Redis)"""
        # In a real implementation, you would add the token to a blacklist in Redis
        return True
