"""
Trade API routes
"""

from datetime import datetime
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.core.database import get_db
from app.models.enums import OrderStatusEnum, ReportPeriodEnum
from app.models.user import User
from app.schemas.common import SuccessResponse
from app.schemas.trade import (
    FundResetRequest,
    FundResponse,
    OrderCreate,
    OrderResponse,
    PositionResponse,
    TradeReportResponse,
)
from app.services.report_service import ReportService
from app.services.trade_service import TradeService

router = APIRouter(prefix="/trade", tags=["Trade"])


@router.post("/order", response_model=OrderResponse)
async def create_order(
    data: OrderCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> OrderResponse:
    """
    下单（市价/限价）

    - 市价单：立即成交
    - 限价单：冻结资金，等待价格触发
    """
    service = TradeService(db)
    order = service.create_order(UUID(str(current_user.id)), data)
    return OrderResponse.model_validate(order)


@router.delete("/order/{order_id}", response_model=SuccessResponse)
async def cancel_order(
    order_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> SuccessResponse:
    """
    取消未成交订单

    只能取消状态为 pending 的订单。
    限价买单取消后会解冻冻结资金。
    """
    service = TradeService(db)
    service.cancel_order(UUID(str(current_user.id)), order_id)
    return SuccessResponse(message="订单已取消")


@router.get("/orders", response_model=list[OrderResponse])
async def list_orders(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    status: OrderStatusEnum | None = Query(None, description="订单状态筛选"),
) -> list[OrderResponse]:
    """
    查询订单列表

    可按状态筛选：pending, filled, cancelled
    """
    service = TradeService(db)
    orders = service.list_orders(UUID(str(current_user.id)), status)
    return [OrderResponse.model_validate(o) for o in orders]


@router.get("/position", response_model=list[PositionResponse])
async def list_positions(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> list[PositionResponse]:
    """
    查询当前持仓

    返回所有持仓，包含实时价格和盈亏计算。
    """
    service = TradeService(db)
    positions = service.list_positions(UUID(str(current_user.id)))
    return [PositionResponse.model_validate(p) for p in positions]


@router.get("/fund", response_model=FundResponse)
async def get_fund(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> FundResponse:
    """
    查询资金信息

    返回：总资产、可用资金、冻结资金、初始资金
    """
    service = TradeService(db)
    fund = service.get_fund(UUID(str(current_user.id)))
    return FundResponse.model_validate(fund)


@router.post("/fund/reset", response_model=SuccessResponse)
async def reset_fund(
    data: FundResetRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> SuccessResponse:
    """
    重置模拟资金

    - 清空所有持仓
    - 取消所有挂单
    - 重置资金到指定金额
    """
    service = TradeService(db)
    service.reset_fund(UUID(str(current_user.id)), data)
    return SuccessResponse(message="资金已重置")


@router.get("/report", response_model=list[TradeReportResponse])
async def get_reports(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    period_type: ReportPeriodEnum | None = Query(None, description="报表周期类型"),
) -> list[TradeReportResponse]:
    """
    查询交易报表

    可按周期类型筛选：daily, weekly, monthly
    """
    service = TradeService(db)
    reports = service.get_trade_reports(UUID(str(current_user.id)), period_type)
    return [TradeReportResponse.model_validate(r) for r in reports]


@router.post("/report/generate", response_model=TradeReportResponse)
async def generate_report(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    period_type: ReportPeriodEnum = Query(..., description="报表周期类型"),
    period_date: datetime | None = Query(None, description="统计周期起始日期（可选，默认为前一个周期）"),
) -> TradeReportResponse:
    """
    手动生成交易报表

    - period_type: daily/weekly/monthly
    - period_date: 可选，默认自动计算前一个周期起始日期
      - 日报：昨天
      - 周报：上周一
      - 月报：上月1日
    """
    service = ReportService(db)
    if period_date is None:
        period_date = service.get_period_date_for_report(period_type)

    report = service.generate_report(UUID(str(current_user.id)), period_type, period_date)
    return TradeReportResponse.model_validate(report)
