"""
AI detection schemas for API request/response
"""

from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.enums import LevelTypeEnum, PeriodEnum


class SRLevelResponse(BaseModel):
    """Support/Resistance level response"""

    id: UUID
    levelType: LevelTypeEnum
    price: Decimal
    strength: int | None = None
    isAiDetected: bool
    isUserCorrected: bool

    class Config:
        from_attributes = True


class IntLevelResponse(BaseModel):
    """Integer level response"""

    id: UUID
    price: Decimal
    levelType: LevelTypeEnum
    touchesCount: int

    class Config:
        from_attributes = True


class SRDetectionRequest(BaseModel):
    """Support/Resistance detection request"""

    stockCode: str
    period: PeriodEnum


class SRCorrectionRequest(BaseModel):
    """Support/Resistance correction request"""

    levelId: UUID
    correctedPrice: Decimal
    action: str = Field(..., pattern="^(update|delete)$")


class AIQuery(BaseModel):
    """AI detection query parameters"""

    stockCode: str
    period: PeriodEnum


class SRLegacyItem(BaseModel):
    """Single support/resistance level item"""

    price: Decimal
    levelType: str = Field(..., description="support or resistance")
    strength: int = Field(..., ge=1, le=10, description="Strength score 1-10")
    touches: int | None = Field(None, description="Number of price touches")


class SRDetectResponse(BaseModel):
    """Support/Resistance detection response"""

    stockCode: str
    period: PeriodEnum
    supportLevels: list[SRLegacyItem] = Field(default_factory=list)
    resistanceLevels: list[SRLegacyItem] = Field(default_factory=list)
