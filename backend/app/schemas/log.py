"""
Trade log schemas for API request/response
"""

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.enums import PatternEnum, PeriodEnum


class TradeLogCreate(BaseModel):
    """Trade log creation request"""
    stockCode: str = Field(..., max_length=10)
    stockName: str | None = Field(None, max_length=50)
    period: PeriodEnum
    patternType: PatternEnum | None = None
    entryPrice: Decimal = Field(..., gt=0)
    stopLoss: Decimal | None = None
    takeProfit: Decimal | None = None
    exitPrice: Decimal | None = None
    quantity: int = Field(..., gt=0)
    profitLoss: Decimal | None = None
    notes: str | None = None
    tags: list[str] | None = None
    tradeTime: datetime | None = None


class TradeLogUpdate(BaseModel):
    """Trade log update request"""
    stockCode: str | None = None
    stockName: str | None = None
    period: PeriodEnum | None = None
    patternType: PatternEnum | None = None
    entryPrice: Decimal | None = None
    stopLoss: Decimal | None = None
    takeProfit: Decimal | None = None
    exitPrice: Decimal | None = None
    quantity: int | None = None
    profitLoss: Decimal | None = None
    notes: str | None = None
    tags: list[str] | None = None
    tradeTime: datetime | None = None


class TradeLogResponse(BaseModel):
    """Trade log response"""
    id: UUID
    stockCode: str
    stockName: str | None = None
    period: PeriodEnum
    patternType: PatternEnum | None = None
    entryPrice: Decimal
    stopLoss: Decimal | None = None
    takeProfit: Decimal | None = None
    exitPrice: Decimal | None = None
    quantity: int
    profitLoss: Decimal | None = None
    notes: str | None = None
    tags: list[str] | None = None
    tradeTime: datetime | None = None
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


class TradeLogQuery(BaseModel):
    """Trade log query parameters"""
    stockCode: str | None = None
    tags: list[str] | None = None
    startDate: datetime | None = None
    endDate: datetime | None = None


class TradeLogListResponse(BaseModel):
    """Paginated trade log list response"""
    items: list[TradeLogResponse]
    total: int
    page: int
    pageSize: int
