"""
Market data API routes
"""

from datetime import datetime
from typing import Annotated, Optional, List

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.market import (
    KlineResponse,
    MultiPeriodResponse,
    RealtimeQuote,
    StockResponse,
)
from app.services.market_service import MarketService


router = APIRouter(prefix="/market", tags=["Market Data"])


@router.get("/stocks", response_model=List[StockResponse])
async def get_stocks(
    keyword: Optional[str] = Query(None, description="搜索关键词"),
    db: Annotated[Session, Depends(get_db)] = None,
):
    """获取股票列表"""
    service = MarketService(db)
    return service.get_stocks(keyword)


@router.get("/kline", response_model=KlineResponse)
async def get_kline(
    stock_code: str = Query(..., description="股票代码"),
    period: str = Query("daily", description="K线周期"),
    start: Optional[datetime] = Query(None, description="开始时间"),
    end: Optional[datetime] = Query(None, description="结束时间"),
    db: Annotated[Session, Depends(get_db)] = None,
):
    """获取单周期K线数据"""
    service = MarketService(db)
    data = service.get_kline(stock_code, period, start, end)
    return KlineResponse(stockCode=stock_code, period=period, data=data)


@router.get("/multi-period", response_model=MultiPeriodResponse)
async def get_multi_period(
    stock_code: str = Query(..., description="股票代码"),
    periods: str = Query("daily,weekly", description="周期列表，逗号分隔"),
    db: Annotated[Session, Depends(get_db)] = None,
):
    """获取多周期K线数据"""
    period_list = [p.strip() for p in periods.split(",")]
    service = MarketService(db)
    data = service.get_multi_period(stock_code, period_list)
    return MultiPeriodResponse(stockCode=stock_code, periods=data)


@router.get("/realtime", response_model=RealtimeQuote)
async def get_realtime(
    stock_code: str = Query(..., description="股票代码"),
    db: Annotated[Session, Depends(get_db)] = None,
):
    """获取实时行情"""
    service = MarketService(db)
    quote = service.get_realtime_quote(stock_code)
    if not quote:
        return {"error": "Stock not found"}
    return quote