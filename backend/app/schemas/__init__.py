"""
Pydantic schemas package - exports all schemas
"""

from app.schemas.ai import (
    AIQuery,
    IntLevelResponse,
    SRCorrectionRequest,
    SRDetectionRequest,
    SRLevelResponse,
)
from app.schemas.common import (
    ErrorDetail,
    ErrorResponse,
    PaginatedResponse,
    PaginationMeta,
    SuccessResponse,
)
from app.schemas.compliance import RiskWarningResponse
from app.schemas.log import (
    TradeLogCreate,
    TradeLogQuery,
    TradeLogResponse,
    TradeLogUpdate,
)
from app.schemas.market import (
    KlineData,
    KlineResponse,
    MarketQuery,
    MultiPeriodResponse,
    RealtimeQuote,
    StockResponse,
)
from app.schemas.pattern import (
    PatternCreate,
    PatternQuery,
    PatternResponse,
    PatternUpdate,
)
from app.schemas.trade import (
    FundResetRequest,
    FundResponse,
    OrderCreate,
    OrderResponse,
    PositionResponse,
    TradeReportQuery,
    TradeReportResponse,
)
from app.schemas.user import (
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    TokenRefreshRequest,
    TokenRefreshResponse,
    UserCreate,
    UserLogin,
    UserResponse,
)
from app.schemas.websocket import (
    WSAction,
    WSErrorMessage,
    WSHeartbeatMessage,
    WSMessageType,
    WSPongMessage,
    WSPriceUpdate,
    WSSubscribedMessage,
    WSSubscribeMessage,
    WSUnsubscribedMessage,
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
    # WebSocket
    "WSAction",
    "WSMessageType",
    "WSSubscribeMessage",
    "WSPriceUpdate",
    "WSSubscribedMessage",
    "WSUnsubscribedMessage",
    "WSErrorMessage",
    "WSPongMessage",
    "WSHeartbeatMessage",
]
