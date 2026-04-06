"""
AI detection API routes
"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from loguru import logger
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.core.database import get_db
from app.models.enums import PeriodEnum
from app.models.user import User
from app.schemas.ai import (
    IntLevelResponse,
    SRCorrectionRequest,
    SRDetectionRequest,
    SRDetectResponse,
    SRLegacyItem,
    SRLevelResponse,
)
from app.services.ai_service import AIDetectionService

router = APIRouter(prefix="/ai", tags=["AI Detection"])


@router.post("/sr-detect", response_model=SRDetectResponse)
async def detect_sr_levels(
    request: SRDetectionRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> SRDetectResponse:
    """
    Detect support/resistance levels using rule-based algorithm

    Uses local extrema detection + price clustering to identify
    support and resistance levels with strength scoring.

    Args:
        request: Detection request with stockCode and period

    Returns:
        List of support levels and resistance levels with strength scores
    """
    service = AIDetectionService(db)
    try:
        levels = service.detect_sr_levels(request.stockCode, request.period)

        # Separate support and resistance levels
        support_levels = [
            SRLegacyItem(**level) for level in levels if level["levelType"] == "support"
        ]
        resistance_levels = [
            SRLegacyItem(**level) for level in levels if level["levelType"] == "resistance"
        ]

        logger.info(
            f"Detected {len(support_levels)} support, "
            f"{len(resistance_levels)} resistance levels for "
            f"{request.stockCode}/{request.period}"
        )

        return SRDetectResponse(
            stockCode=request.stockCode,
            period=request.period,
            supportLevels=support_levels,
            resistanceLevels=resistance_levels,
        )
    except Exception as e:
        logger.error(f"SR detection error: {e}")
        raise HTTPException(
            status_code=400,
            detail={
                "code": "SR_ALGORITHM_ERROR",
                "message": str(e),
                "details": {"stock_code": request.stockCode, "period": request.period},
            },
        ) from e


@router.post("/support-resistance", response_model=list[SRLevelResponse])
async def detect_support_resistance(
    request: SRDetectionRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> list[SRLevelResponse]:
    """
    Legacy endpoint: Auto-detect support/resistance levels

    Uses the legacy algorithm for backward compatibility.
    """
    service = AIDetectionService(db)
    levels = service.detect_support_resistance(request.stockCode, request.period)
    return [SRLevelResponse.model_validate(level) for level in levels]


@router.get("/int-levels", response_model=list[IntLevelResponse])
async def get_integer_levels(
    stock_code: str,
    period: PeriodEnum,
    db: Annotated[Session, Depends(get_db)],
) -> list[IntLevelResponse]:
    """Get integer levels (price levels at multiples of 5 or 10)"""
    service = AIDetectionService(db)
    levels = service.get_integer_levels(stock_code, period)
    return [IntLevelResponse.model_validate(level) for level in levels]


@router.post("/correct-result", response_model=SRLevelResponse)
async def correct_detection_result(
    request: SRCorrectionRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> SRLevelResponse:
    """User correction for detected level"""
    service = AIDetectionService(db)
    level = service.correct_level(
        str(request.levelId),
        request.correctedPrice,
        request.action,
        str(current_user.id),
    )

    if not level:
        raise HTTPException(status_code=404, detail="Level not found")

    return SRLevelResponse.model_validate(level)
