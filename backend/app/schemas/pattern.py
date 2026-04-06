"""
Pattern schemas for API request/response
"""

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field, ValidationInfo, field_validator

from app.models.enums import PatternEnum, PeriodEnum


class PatternCreate(BaseModel):
    """Pattern creation request"""
    stockCode: str = Field(..., max_length=10, description="股票代码")
    period: PeriodEnum = Field(..., description="K线周期")
    patternType: PatternEnum = Field(..., description="形态类型")
    startTime: datetime = Field(..., description="形态起始时间")
    endTime: datetime = Field(..., description="形态结束时间")
    startPrice: Decimal | None = Field(None, description="形态起始价格")
    endPrice: Decimal | None = Field(None, description="形态结束价格")
    description: str | None = Field(None, max_length=500, description="形态描述")

    @field_validator("endTime")
    @classmethod
    def validate_time_range(cls, v: datetime, info: ValidationInfo) -> datetime:
        """Validate that endTime is after startTime."""
        if "startTime" in info.data and v < info.data["startTime"]:
            raise ValueError("结束时间必须大于起始时间")
        return v


class PatternUpdate(BaseModel):
    """Pattern update request"""
    patternType: PatternEnum | None = Field(None, description="形态类型")
    startTime: datetime | None = Field(None, description="形态起始时间")
    endTime: datetime | None = Field(None, description="形态结束时间")
    startPrice: Decimal | None = Field(None, description="形态起始价格")
    endPrice: Decimal | None = Field(None, description="形态结束价格")
    description: str | None = Field(None, max_length=500, description="形态描述")
    isValid: bool | None = Field(None, description="形态有效性标记")

    @field_validator("endTime")
    @classmethod
    def validate_time_range(cls, v: datetime | None, info: ValidationInfo) -> datetime | None:
        """Validate that endTime is after startTime when both are provided."""
        if v is None:
            return v
        start_time_raw = info.data.get("startTime")
        if start_time_raw is not None and v < start_time_raw:
            raise ValueError("结束时间必须大于起始时间")
        return v


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
