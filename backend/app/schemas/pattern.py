"""
Pattern schemas for API request/response
"""

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.enums import PatternEnum, PeriodEnum


class PatternCreate(BaseModel):
    """Pattern creation request"""
    stockCode: str = Field(..., max_length=10)
    period: PeriodEnum
    patternType: PatternEnum
    startTime: datetime
    endTime: datetime
    startPrice: Decimal | None = None
    endPrice: Decimal | None = None
    description: str | None = None


class PatternUpdate(BaseModel):
    """Pattern update request"""
    patternType: PatternEnum | None = None
    startTime: datetime | None = None
    endTime: datetime | None = None
    startPrice: Decimal | None = None
    endPrice: Decimal | None = None
    description: str | None = None
    isValid: bool | None = None


class PatternResponse(BaseModel):
    """Pattern response"""
    id: UUID
    stockCode: str
    period: PeriodEnum
    patternType: PatternEnum
    startTime: datetime
    endTime: datetime
    startPrice: Decimal | None = None
    endPrice: Decimal | None = None
    description: str | None = None
    isValid: bool
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


class PatternQuery(BaseModel):
    """Pattern query parameters"""
    stockCode: str | None = None
    period: PeriodEnum | None = None
    patternType: PatternEnum | None = None
