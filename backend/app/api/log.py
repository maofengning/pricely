"""
Trade log API routes
"""

from datetime import datetime
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.core.database import get_db
from app.models.log import TradeLog
from app.models.user import User
from app.schemas.log import (
    TradeLogCreate,
    TradeLogResponse,
    TradeLogUpdate,
)

router = APIRouter(prefix="/logs", tags=["Trade Log"])


@router.post("", response_model=TradeLogResponse)
async def create_log(
    data: TradeLogCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """创建交易日志"""
    log = TradeLog(
        user_id=current_user.id,
        stock_code=data.stockCode,
        stock_name=data.stockName,
        period=data.period,
        pattern_type=data.patternType,
        entry_price=data.entryPrice,
        stop_loss=data.stopLoss,
        take_profit=data.takeProfit,
        exit_price=data.exitPrice,
        quantity=data.quantity,
        profit_loss=data.profitLoss,
        notes=data.notes,
        tags=data.tags,
        trade_time=data.tradeTime,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return TradeLogResponse.model_validate(log)


@router.get("", response_model=list[TradeLogResponse])
async def list_logs(
    stock_code: str | None = None,
    tags: str | None = None,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    db: Annotated[Session, Depends(get_db)] = None,
    current_user: Annotated[User, Depends(get_current_user)] = None,
):
    """查询日志列表"""
    query = db.query(TradeLog).filter(TradeLog.user_id == current_user.id)

    if stock_code:
        query = query.filter(TradeLog.stock_code == stock_code)
    if start_date:
        query = query.filter(TradeLog.trade_time >= start_date)
    if end_date:
        query = query.filter(TradeLog.trade_time <= end_date)

    logs = query.order_by(TradeLog.created_at.desc()).limit(100).all()
    return [TradeLogResponse.model_validate(log) for log in logs]


@router.get("/{log_id}", response_model=TradeLogResponse)
async def get_log(
    log_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """查询日志详情"""
    log = db.query(TradeLog).filter(
        TradeLog.id == log_id,
        TradeLog.user_id == current_user.id,
    ).first()

    if not log:
        raise HTTPException(status_code=404, detail="Log not found")

    return TradeLogResponse.model_validate(log)


@router.put("/{log_id}", response_model=TradeLogResponse)
async def update_log(
    log_id: UUID,
    data: TradeLogUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """更新日志"""
    log = db.query(TradeLog).filter(
        TradeLog.id == log_id,
        TradeLog.user_id == current_user.id,
    ).first()

    if not log:
        raise HTTPException(status_code=404, detail="Log not found")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(log, field, value)

    db.commit()
    db.refresh(log)
    return TradeLogResponse.model_validate(log)


@router.delete("/{log_id}")
async def delete_log(
    log_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """删除日志"""
    log = db.query(TradeLog).filter(
        TradeLog.id == log_id,
        TradeLog.user_id == current_user.id,
    ).first()

    if not log:
        raise HTTPException(status_code=404, detail="Log not found")

    db.delete(log)
    db.commit()
    return {"success": True}
