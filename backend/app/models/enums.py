"""
Database enums definition
"""

import enum


class PeriodEnum(enum.StrEnum):
    """K线周期枚举"""
    ONE_MIN = "1min"
    FIVE_MIN = "5min"
    FIFTEEN_MIN = "15min"
    SIXTY_MIN = "60min"
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"


class PatternEnum(enum.StrEnum):
    """价格形态枚举"""
    PIN_BAR = "pin_bar"
    ENGULFING = "engulfing"
    EVENING_STAR = "evening_star"
    MORNING_STAR = "morning_star"
    DOJI = "doji"
    HEAD_SHOULDERS_TOP = "head_shoulders_top"
    HEAD_SHOULDERS_BOTTOM = "head_shoulders_bottom"


class LevelTypeEnum(enum.StrEnum):
    """支撑阻力类型枚举"""
    SUPPORT = "support"
    RESISTANCE = "resistance"
    TRENDLINE = "trendline"
    CHANNEL = "channel"
    SWING_HIGH = "swing_high"
    SWING_LOW = "swing_low"


class OrderTypeEnum(enum.StrEnum):
    """订单类型枚举"""
    BUY = "buy"
    SELL = "sell"


class OrderModeEnum(enum.StrEnum):
    """订单模式枚举"""
    MARKET = "market"
    LIMIT = "limit"


class OrderStatusEnum(enum.StrEnum):
    """订单状态枚举"""
    PENDING = "pending"
    FILLED = "filled"
    CANCELLED = "cancelled"


class ReportPeriodEnum(enum.StrEnum):
    """报表周期类型枚举"""
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
