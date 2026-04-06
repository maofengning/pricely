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
    """价格形态枚举 - 8种图表形态类型"""
    HEAD_AND_SHOULDERS_TOP = "head_and_shoulders_top"  # 头肩顶
    HEAD_AND_SHOULDERS_BOTTOM = "head_and_shoulders_bottom"  # 头肩底
    DOUBLE_TOP = "double_top"  # 双顶
    DOUBLE_BOTTOM = "double_bottom"  # 双底
    TRIPLE_TOP = "triple_top"  # 三重顶
    TRIPLE_BOTTOM = "triple_bottom"  # 三重底
    TRIANGLE = "triangle"  # 三角形
    FLAG = "flag"  # 旗形


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


class WarningTypeEnum(enum.StrEnum):
    """风险提示类型枚举"""
    HOMEPAGE = "homepage"
    TRADE_PAGE = "trade_page"
