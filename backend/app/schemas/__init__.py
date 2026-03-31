"""
Pydantic schemas package - exports all schemas
"""

from app.schemas.user import (
    UserCreate,
    UserLogin,
    UserResponse,
    AuthResponse,
    TokenRefreshRequest,
    TokenRefreshResponse,
    LoginRequest,
    RegisterRequest,
)
from app.schemas.trade import (
    OrderCreate,
    OrderResponse,
    PositionResponse,
    FundResponse,
    FundResetRequest,
    TradeReportResponse,
    TradeReportQuery,
)
from app.schemas.log import (
    TradeLogCreate,
    TradeLogUpdate,
    TradeLogResponse,
    TradeLogQuery,
)
from app.schemas.pattern import (
    PatternCreate,
    PatternUpdate,
    PatternResponse,
    PatternQuery,
)
from app.schemas.market import (
    KlineData,
    KlineResponse,
    MultiPeriodResponse,
    RealtimeQuote,
    StockResponse,
    MarketQuery,
)
from app.schemas.ai import (
    SRLevelResponse,
    IntLevelResponse,
    SRDetectionRequest,
    SRCorrectionRequest,
    AIQuery,
)
from app.schemas.compliance import RiskWarningResponse
from app.schemas.common import (
    ErrorResponse,
    ErrorDetail,
    SuccessResponse,
    PaginationMeta,
    PaginatedResponse,
)

__all__ = [
    # User
    "UserCreate",
    "UserLogin",
    "UserResponse",
    "AuthResponse",
    "TokenRefreshRequest",
    "TokenRefreshResponse",
    "LoginRequest",
    "RegisterRequest",
    # Trade
    "OrderCreate",
    "OrderResponse",
    "PositionResponse",
    "FundResponse",
    "FundResetRequest",
    "TradeReportResponse",
    "TradeReportQuery",
    # Log
    "TradeLogCreate",
    "TradeLogUpdate",
    "TradeLogResponse",
    "TradeLogQuery",
    # Pattern
    "PatternCreate",
    "PatternUpdate",
    "PatternResponse",
    "PatternQuery",
    # Market
    "KlineData",
    "KlineResponse",
    "MultiPeriodResponse",
    "RealtimeQuote",
    "StockResponse",
    "MarketQuery",
    # AI
    "SRLevelResponse",
    "IntLevelResponse",
    "SRDetectionRequest",
    "SRCorrectionRequest",
    "AIQuery",
    # Compliance
    "RiskWarningResponse",
    # Common
    "ErrorResponse",
    "ErrorDetail",
    "SuccessResponse",
    "PaginationMeta",
    "PaginatedResponse",
]