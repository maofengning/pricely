"""
AI detection API routes
"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.core.database import get_db
from app.models.enums import PeriodEnum
from app.models.user import User
from app.schemas.ai import (
    IntLevelResponse,
    SRCorrectionRequest,
    SRDetectionRequest,
    SRLevelResponse,
)
from app.services.ai_service import AIDetectionService

router = APIRouter(prefix="/ai", tags=["AI Detection"])


@router.post("/support-resistance", response_model=list[SRLevelResponse])
async def detect_support_resistance(
    request: SRDetectionRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """自动识别支撑阻力"""
    service = AIDetectionService(db)
    levels = service.detect_support_resistance(request.stockCode, request.period)
    return [SRLevelResponse.model_validate(level) for level in levels]


@router.get("/int-levels", response_model=list[IntLevelResponse])
async def get_integer_levels(
    stock_code: str,
    period: PeriodEnum,
    db: Annotated[Session, Depends(get_db)],
):
    """获取整数关口"""
    service = AIDetectionService(db)
    levels = service.get_integer_levels(stock_code, period)
    return [IntLevelResponse.model_validate(level) for level in levels]


@router.post("/correct-result", response_model=SRLevelResponse)
async def correct_detection_result(
    request: SRCorrectionRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """用户修正识别结果"""
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
