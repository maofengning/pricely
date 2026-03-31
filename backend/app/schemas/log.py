"""
Trade log schemas for API request/response
"""

from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.enums import PeriodEnum, PatternEnum


class TradeLogCreate(BaseModel):
    """Trade log creation request"""
    stockCode: str = Field(..., max_length=10)
    stockName: Optional[str] = Field(None, max_length=50)
    period: PeriodEnum
    patternType: Optional[PatternEnum] = None
    entryPrice: Decimal = Field(..., gt=0)
    stopLoss: Optional[Decimal] = None
    takeProfit: Optional[Decimal] = None
    exitPrice: Optional[Decimal] = None
    quantity: int = Field(..., gt=0)
    profitLoss: Optional[Decimal] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None
    tradeTime: Optional[datetime] = None


class TradeLogUpdate(BaseModel):
    """Trade log update request"""
    stockCode: Optional[str] = None
    stockName: Optional[str] = None
    period: Optional[PeriodEnum] = None
    patternType: Optional[PatternEnum] = None
    entryPrice: Optional[Decimal] = None
    stopLoss: Optional[Decimal] = None
    takeProfit: Optional[Decimal] = None
    exitPrice: Optional[Decimal] = None
    quantity: Optional[int] = None
    profitLoss: Optional[Decimal] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None
    tradeTime: Optional[datetime] = None


class TradeLogResponse(BaseModel):
    """Trade log response"""
    id: UUID
    stockCode: str
    stockName: Optional[str] = None
    period: PeriodEnum
    patternType: Optional[PatternEnum] = None
    entryPrice: Decimal
    stopLoss: Optional[Decimal] = None
    takeProfit: Optional[Decimal] = None
    exitPrice: Optional[Decimal] = None
    quantity: int
    profitLoss: Optional[Decimal] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None
    tradeTime: Optional[datetime] = None
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


class TradeLogQuery(BaseModel):
    """Trade log query parameters"""
    stockCode: Optional[str] = None
    tags: Optional[List[str]] = None
    startDate: Optional[datetime] = None
    endDate: Optional[datetime] = None