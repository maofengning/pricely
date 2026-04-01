"""
Trade schemas for API request/response
"""

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.enums import OrderModeEnum, OrderStatusEnum, OrderTypeEnum, ReportPeriodEnum


class OrderCreate(BaseModel):
    """Order creation request"""
    stockCode: str = Field(..., max_length=10)
    stockName: str | None = Field(None, max_length=50)
    orderType: OrderTypeEnum
    orderMode: OrderModeEnum
    quantity: int = Field(..., gt=0)
    limitPrice: Decimal | None = Field(None, gt=0)


class OrderResponse(BaseModel):
    """Order response"""
    id: UUID
    stockCode: str
    stockName: str | None = None
    orderType: OrderTypeEnum
    orderMode: OrderModeEnum
    limitPrice: Decimal | None = None
    quantity: int
    filledPrice: Decimal | None = None
    filledAt: datetime | None = None
    status: OrderStatusEnum
    createdAt: datetime

    class Config:
        from_attributes = True


class PositionResponse(BaseModel):
    """Position response"""
    id: UUID
    stockCode: str
    stockName: str | None = None
    quantity: int
    avgCost: Decimal
    currentPrice: Decimal | None = None
    profitLoss: Decimal | None = None
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
    winRate: Decimal | None = None
    totalProfit: Decimal
    totalLoss: Decimal
    netProfit: Decimal
    maxDrawdown: Decimal

    class Config:
        from_attributes = True


class TradeReportQuery(BaseModel):
    """Trade report query parameters"""
    periodType: ReportPeriodEnum | None = None
    startDate: datetime | None = None
    endDate: datetime | None = None
