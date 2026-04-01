"""
Market data schemas for API request/response
"""

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel

from app.models.enums import PeriodEnum


class KlineData(BaseModel):
    """Single K-line data"""
    time: datetime
    open: Decimal
    high: Decimal
    low: Decimal
    close: Decimal


class KlineResponse(BaseModel):
    """K-line response"""
    stockCode: str
    period: str
    data: list[KlineData]


class MultiPeriodResponse(BaseModel):
    """Multi-period K-line response"""
    stockCode: str
    periods: dict[str, list[KlineData]]


class RealtimeQuote(BaseModel):
    """Realtime quote response"""
    stockCode: str
    price: Decimal
    change: Decimal
    changePct: Decimal
    time: datetime


class StockResponse(BaseModel):
    """Stock response"""
    code: str
    name: str
    exchange: str | None = None

    class Config:
        from_attributes = True


class MarketQuery(BaseModel):
    """Market data query parameters"""
    stockCode: str
    period: PeriodEnum | None = None
    startDate: datetime | None = None
    endDate: datetime | None = None
