"""
Pattern marking API routes
"""

from typing import Annotated, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.user import User
from app.models.enums import PeriodEnum, PatternEnum
from app.schemas.pattern import (
    PatternCreate,
    PatternUpdate,
    PatternResponse,
)
from app.models.pattern import PatternMark


router = APIRouter(prefix="/patterns", tags=["Pattern Marking"])


@router.post("", response_model=PatternResponse)
async def create_pattern(
    data: PatternCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """创建形态标注"""
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


@router.get("", response_model=List[PatternResponse])
async def list_patterns(
    stock_code: Optional[str] = None,
    period: Optional[PeriodEnum] = None,
    pattern_type: Optional[PatternEnum] = None,
    db: Annotated[Session, Depends(get_db)] = None,
    current_user: Annotated[User, Depends(get_current_user)] = None,
):
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


@router.get("/by-period", response_model=List[PatternResponse])
async def list_by_period(
    period: PeriodEnum,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """按周期查询标注"""
    patterns = (
        db.query(PatternMark)
        .filter(PatternMark.user_id == current_user.id, PatternMark.period == period)
        .all()
    )
    return [PatternResponse.model_validate(p) for p in patterns]


@router.get("/{pattern_id}", response_model=PatternResponse)
async def get_pattern(
    pattern_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """查询标注详情"""
    pattern = db.query(PatternMark).filter(
        PatternMark.id == pattern_id,
        PatternMark.user_id == current_user.id,
    ).first()

    if not pattern:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Pattern not found")

    return PatternResponse.model_validate(pattern)


@router.put("/{pattern_id}", response_model=PatternResponse)
async def update_pattern(
    pattern_id: UUID,
    data: PatternUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """更新标注"""
    pattern = db.query(PatternMark).filter(
        PatternMark.id == pattern_id,
        PatternMark.user_id == current_user.id,
    ).first()

    if not pattern:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Pattern not found")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(pattern, field, value)

    db.commit()
    db.refresh(pattern)
    return PatternResponse.model_validate(pattern)


@router.delete("/{pattern_id}")
async def delete_pattern(
    pattern_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """删除标注"""
    pattern = db.query(PatternMark).filter(
        PatternMark.id == pattern_id,
        PatternMark.user_id == current_user.id,
    ).first()

    if not pattern:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Pattern not found")

    db.delete(pattern)
    db.commit()
    return {"success": True}