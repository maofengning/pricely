"""
Trade API routes
"""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.core.database import get_db
from app.models.enums import OrderStatusEnum
from app.models.trade import Order, Position, TradeReport
from app.models.user import Fund, User
from app.schemas.trade import (
    FundResetRequest,
    FundResponse,
    OrderCreate,
    OrderResponse,
    PositionResponse,
    TradeReportResponse,
)

router = APIRouter(prefix="/trade", tags=["Trade"])


@router.post("/order", response_model=OrderResponse)
async def create_order(
    data: OrderCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """下单（市价/限价）"""
    # Get user's fund
    fund = db.query(Fund).filter(Fund.user_id == current_user.id).first()
    if not fund:
        raise HTTPException(status_code=400, detail="Fund not found")

    # Create order
    order = Order(
        user_id=current_user.id,
        stock_code=data.stockCode,
        stock_name=data.stockName,
        order_type=data.orderType,
        order_mode=data.orderMode,
        limit_price=data.limitPrice,
        quantity=data.quantity,
        status=OrderStatusEnum.PENDING,
    )

    # For market orders, simulate immediate fill
    if data.orderMode.value == "market":
        # Use a simulated current price (in real app, get from market data)
        from decimal import Decimal
        filled_price = data.limitPrice or Decimal("10.00")  # Placeholder
        order.filled_price = filled_price
        order.status = OrderStatusEnum.FILLED
        order.filled_at = __import__('datetime').datetime.utcnow()

        # Update position
        position = db.query(Position).filter(
            Position.user_id == current_user.id,
            Position.stock_code == data.stockCode,
        ).first()

        if data.orderType.value == "buy":
            if position:
                # Update existing position
                total_quantity = position.quantity + data.quantity
                total_cost = (position.avg_cost * position.quantity) + (filled_price * data.quantity)
                position.avg_cost = total_cost / total_quantity
                position.quantity = total_quantity
            else:
                # Create new position
                position = Position(
                    user_id=current_user.id,
                    stock_code=data.stockCode,
                    stock_name=data.stockName,
                    quantity=data.quantity,
                    avg_cost=filled_price,
                )
                db.add(position)

            # Deduct from available funds
            fund.available -= filled_price * data.quantity

        elif data.orderType.value == "sell":
            if not position or position.quantity < data.quantity:
                raise HTTPException(status_code=400, detail="Insufficient position")

            position.quantity -= data.quantity
            fund.available += filled_price * data.quantity

            if position.quantity == 0:
                db.delete(position)

    db.add(order)
    db.commit()
    db.refresh(order)
    return OrderResponse.model_validate(order)


@router.delete("/order/{order_id}")
async def cancel_order(
    order_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """取消未成交订单"""
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.user_id == current_user.id,
        Order.status == OrderStatusEnum.PENDING,
    ).first()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found or already filled")

    order.status = OrderStatusEnum.CANCELLED
    db.commit()
    return {"success": True}


@router.get("/orders", response_model=list[OrderResponse])
async def list_orders(
    status: str = None,
    db: Annotated[Session, Depends(get_db)] = None,
    current_user: Annotated[User, Depends(get_current_user)] = None,
):
    """查询订单列表"""
    query = db.query(Order).filter(Order.user_id == current_user.id)

    if status:
        query = query.filter(Order.status == status)

    orders = query.order_by(Order.created_at.desc()).all()
    return [OrderResponse.model_validate(o) for o in orders]


@router.get("/position", response_model=list[PositionResponse])
async def list_positions(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """查询当前持仓"""
    positions = db.query(Position).filter(
        Position.user_id == current_user.id,
        Position.quantity > 0,
    ).all()
    return [PositionResponse.model_validate(p) for p in positions]


@router.get("/fund", response_model=FundResponse)
async def get_fund(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """查询资金信息"""
    fund = db.query(Fund).filter(Fund.user_id == current_user.id).first()
    if not fund:
        raise HTTPException(status_code=404, detail="Fund not found")
    return FundResponse.model_validate(fund)


@router.post("/fund/reset")
async def reset_fund(
    data: FundResetRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """重置模拟资金"""
    fund = db.query(Fund).filter(Fund.user_id == current_user.id).first()
    if not fund:
        fund = Fund(user_id=current_user.id)
        db.add(fund)

    fund.total_balance = data.initialCapital
    fund.available = data.initialCapital
    fund.frozen = 0
    fund.initial_capital = data.initialCapital

    # Clear all positions and pending orders
    db.query(Position).filter(Position.user_id == current_user.id).delete()
    db.query(Order).filter(
        Order.user_id == current_user.id,
        Order.status == OrderStatusEnum.PENDING,
    ).delete()

    db.commit()
    return {"success": True}


@router.get("/report", response_model=list[TradeReportResponse])
async def get_reports(
    period_type: str = None,
    db: Annotated[Session, Depends(get_db)] = None,
    current_user: Annotated[User, Depends(get_current_user)] = None,
):
    """查询交易报表"""
    query = db.query(TradeReport).filter(TradeReport.user_id == current_user.id)

    if period_type:
        query = query.filter(TradeReport.period_type == period_type)

    reports = query.order_by(TradeReport.period_date.desc()).all()
    return [TradeReportResponse.model_validate(r) for r in reports]
