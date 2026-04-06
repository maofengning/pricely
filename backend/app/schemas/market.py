"""
Market data schemas for API request/response
"""

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.models.enums import PeriodEnum


class KlineData(BaseModel):
    """Single K-line data"""

    time: datetime
    open: Decimal
    high: Decimal
    low: Decimal
    close: Decimal


class KlineResponse(BaseModel):
    """K-line response with pagination"""

    stockCode: str
    period: str
    data: list[KlineData]
    total: int = Field(description="Total number of records")
    page: int = Field(description="Current page number")
    pageSize: int = Field(description="Number of records per page")


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


class StockListResponse(BaseModel):
    """Paginated stock list response"""

    items: list[StockResponse]
    total: int = Field(description="Total number of stocks")
    page: int = Field(description="Current page number")
    pageSize: int = Field(description="Number of records per page")


class StockDetailResponse(BaseModel):
    """Stock detail response"""

    code: str
    name: str
    exchange: str | None = None
    latestPrice: Decimal | None = Field(default=None, description="Latest closing price")
    latestTime: datetime | None = Field(default=None, description="Latest trading time")

    class Config:
        from_attributes = True


class MarketQuery(BaseModel):
    """Market data query parameters"""

    stockCode: str
    period: PeriodEnum | None = None
    startDate: datetime | None = None
    endDate: datetime | None = None
