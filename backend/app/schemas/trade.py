"""
Trade schemas for API request/response
"""

from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.enums import OrderTypeEnum, OrderModeEnum, OrderStatusEnum, ReportPeriodEnum


class OrderCreate(BaseModel):
    """Order creation request"""
    stockCode: str = Field(..., max_length=10)
    stockName: Optional[str] = Field(None, max_length=50)
    orderType: OrderTypeEnum
    orderMode: OrderModeEnum
    quantity: int = Field(..., gt=0)
    limitPrice: Optional[Decimal] = Field(None, gt=0)


class OrderResponse(BaseModel):
    """Order response"""
    id: UUID
    stockCode: str
    stockName: Optional[str] = None
    orderType: OrderTypeEnum
    orderMode: OrderModeEnum
    limitPrice: Optional[Decimal] = None
    quantity: int
    filledPrice: Optional[Decimal] = None
    filledAt: Optional[datetime] = None
    status: OrderStatusEnum
    createdAt: datetime

    class Config:
        from_attributes = True


class PositionResponse(BaseModel):
    """Position response"""
    id: UUID
    stockCode: str
    stockName: Optional[str] = None
    quantity: int
    avgCost: Decimal
    currentPrice: Optional[Decimal] = None
    profitLoss: Optional[Decimal] = None
    updatedAt: datetime

    class Config:
        from_attributes = True


class FundResponse(BaseModel):
    """Fund response"""
    totalBalance: Decimal
    available: Decimal
    frozen: Decimal
    initialCapital: Decimal

    class Config:
        from_attributes = True


class FundResetRequest(BaseModel):
    """Fund reset request"""
    initialCapital: Decimal = Field(..., ge=10000, le=1000000)


class TradeReportResponse(BaseModel):
    """Trade report response"""
    id: UUID
    periodType: ReportPeriodEnum
    periodDate: datetime
    tradeCount: int
    winCount: int
    lossCount: int
    winRate: Optional[Decimal] = None
    totalProfit: Decimal
    totalLoss: Decimal
    netProfit: Decimal
    maxDrawdown: Decimal

    class Config:
        from_attributes = True


class TradeReportQuery(BaseModel):
    """Trade report query parameters"""
    periodType: Optional[ReportPeriodEnum] = None
    startDate: Optional[datetime] = None
    endDate: Optional[datetime] = None