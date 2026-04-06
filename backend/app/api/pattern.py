"""
Pattern marking API routes
"""

from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy import and_
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.core.database import get_db
from app.core.exceptions import BusinessError
from app.models.enums import PatternEnum, PeriodEnum
from app.models.pattern import PatternMark
from app.models.user import User
from app.schemas.pattern import (
    PatternCreate,
    PatternResponse,
    PatternUpdate,
)

router = APIRouter(prefix="/patterns", tags=["Pattern Marking"])


def _validate_time_range(start_time: datetime, end_time: datetime) -> None:
    """Validate that time range is valid."""
    if start_time > end_time:
        raise BusinessError(
            code="INVALID_INPUT",
            message="起始时间不能大于结束时间",
            details={"startTime": start_time.isoformat(), "endTime": end_time.isoformat()},
        )


def _get_pattern_or_raise(
    db: Session,
    pattern_id: UUID,
    user_id: UUID,
) -> PatternMark:
    """Get pattern by ID and user, raise error if not found."""
    pattern: PatternMark | None = db.query(PatternMark).filter(
        and_(PatternMark.id == pattern_id, PatternMark.user_id == user_id),
    ).first()

    if not pattern:
        raise BusinessError(
            code="PATTERN_NOT_FOUND",
            message="形态标注不存在",
            details={"patternId": str(pattern_id)},
        )

    return pattern


@router.post("", response_model=PatternResponse)
async def create_pattern(
    data: PatternCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PatternResponse:
    """创建形态标注"""
    # Validate time range
    _validate_time_range(data.startTime, data.endTime)

    pattern = PatternMark(
        user_id=current_user.id,
        stock_code=data.stockCode,
        period=data.period,
        pattern_type=data.patternType,
        start_time=data.startTime,
        end_time=data.endTime,
        start_price=data.startPrice,
        end_price=data.endPrice,
        description=data.description,
    )
    db.add(pattern)
    db.commit()
    db.refresh(pattern)
    return PatternResponse.model_validate(pattern)


@router.get("", response_model=list[PatternResponse])
async def list_patterns(
    stock_code: str | None = None,
    period: PeriodEnum | None = None,
    pattern_type: PatternEnum | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[PatternResponse]:
    """查询标注列表"""
    query = db.query(PatternMark).filter(PatternMark.user_id == current_user.id)

    if stock_code:
        query = query.filter(PatternMark.stock_code == stock_code)
    if period:
        query = query.filter(PatternMark.period == period)
    if pattern_type:
        query = query.filter(PatternMark.pattern_type == pattern_type)

    patterns = query.order_by(PatternMark.created_at.desc()).all()
    return [PatternResponse.model_validate(p) for p in patterns]


@router.get("/by-period", response_model=list[PatternResponse])
async def list_by_period(
    period: PeriodEnum,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[PatternResponse]:
    """按周期查询标注"""
    patterns = (
        db.query(PatternMark)
        .filter(
            and_(
                PatternMark.user_id == current_user.id,
                PatternMark.period == period,
            ),
        )
        .order_by(PatternMark.created_at.desc())
        .all()
    )
    return [PatternResponse.model_validate(p) for p in patterns]


@router.get("/{pattern_id}", response_model=PatternResponse)
async def get_pattern(
    pattern_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PatternResponse:
    """查询标注详情"""
    pattern = _get_pattern_or_raise(db, pattern_id, current_user.id)  # type: ignore[arg-type]
    return PatternResponse.model_validate(pattern)


@router.put("/{pattern_id}", response_model=PatternResponse)
async def update_pattern(
    pattern_id: UUID,
    data: PatternUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PatternResponse:
    """更新标注"""
    pattern = _get_pattern_or_raise(db, pattern_id, current_user.id)  # type: ignore[arg-type]

    update_data = data.model_dump(exclude_unset=True)

    # Validate time range if both are being updated
    new_start_time = update_data.get("startTime", pattern.start_time)
    new_end_time = update_data.get("endTime", pattern.end_time)
    if "startTime" in update_data or "endTime" in update_data:
        _validate_time_range(new_start_time, new_end_time)

    for field, value in update_data.items():
        setattr(pattern, field, value)

    db.commit()
    db.refresh(pattern)
    return PatternResponse.model_validate(pattern)


@router.delete("/{pattern_id}")
async def delete_pattern(
    pattern_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, bool]:
    """删除标注"""
    pattern = _get_pattern_or_raise(db, pattern_id, current_user.id)  # type: ignore[arg-type]
    db.delete(pattern)
    db.commit()
    return {"success": True}
