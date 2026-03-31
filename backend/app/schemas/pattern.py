"""
Pattern schemas for API request/response
"""

from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.enums import PeriodEnum, PatternEnum


class PatternCreate(BaseModel):
    """Pattern creation request"""
    stockCode: str = Field(..., max_length=10)
    period: PeriodEnum
    patternType: PatternEnum
    startTime: datetime
    endTime: datetime
    startPrice: Optional[Decimal] = None
    endPrice: Optional[Decimal] = None
    description: Optional[str] = None


class PatternUpdate(BaseModel):
    """Pattern update request"""
    patternType: Optional[PatternEnum] = None
    startTime: Optional[datetime] = None
    endTime: Optional[datetime] = None
    startPrice: Optional[Decimal] = None
    endPrice: Optional[Decimal] = None
    description: Optional[str] = None
    isValid: Optional[bool] = None


class PatternResponse(BaseModel):
    """Pattern response"""
    id: UUID
    stockCode: str
    period: PeriodEnum
    patternType: PatternEnum
    startTime: datetime
    endTime: datetime
    startPrice: Optional[Decimal] = None
    endPrice: Optional[Decimal] = None
    description: Optional[str] = None
    isValid: bool
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


class PatternQuery(BaseModel):
    """Pattern query parameters"""
    stockCode: Optional[str] = None
    period: Optional[PeriodEnum] = None
    patternType: Optional[PatternEnum] = None