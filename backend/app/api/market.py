"""
Market data API routes
"""

from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Path, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.exceptions import BusinessError
from app.schemas.market import (
    KlineResponse,
    MultiPeriodResponse,
    RealtimeQuote,
    StockDetailResponse,
    StockListResponse,
)
from app.services.market_service import MarketService

router = APIRouter(prefix="/market", tags=["Market Data"])


@router.get("/stocks", response_model=StockListResponse)
async def get_stocks(
    keyword: str | None = Query(None, description="Search keyword for code or name"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Number of records per page"),
    db: Annotated[Session, Depends(get_db)] = None,
) -> StockListResponse:
    """
    Get paginated stock list.

    Supports keyword search on stock code and name.
    """
    service = MarketService(db)
    items, total = service.get_stocks(keyword, page, page_size)
    return StockListResponse(
        items=items,
        total=total,
        page=page,
        pageSize=page_size,
    )


@router.get("/stocks/{code}", response_model=StockDetailResponse)
async def get_stock_detail(
    code: str = Path(..., description="Stock code"),
    db: Annotated[Session, Depends(get_db)] = None,
) -> StockDetailResponse:
    """
    Get stock detail by code.

    Returns stock information with latest price data.
    """
    service = MarketService(db)
    return service.get_stock_by_code(code)


@router.get("/klines", response_model=KlineResponse)
async def get_klines(
    stock_code: str = Query(..., description="Stock code"),
    period: str = Query("daily", description="K-line period (1min, 5min, 15min, 30min, 60min, daily, weekly, monthly)"),
    start_time: datetime | None = Query(None, description="Start time"),
    end_time: datetime | None = Query(None, description="End time"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(100, ge=1, le=500, description="Number of records per page"),
    db: Annotated[Session, Depends(get_db)] = None,
) -> KlineResponse:
    """
    Get K-line data with pagination.

    Supports multiple periods: 1min, 5min, 15min, 30min, 60min, daily, weekly, monthly.
    """
    service = MarketService(db)
    data, total = service.get_kline(stock_code, period, start_time, end_time, page, page_size)
    return KlineResponse(
        stockCode=stock_code,
        period=period,
        data=data,
        total=total,
        page=page,
        pageSize=page_size,
    )


@router.get("/multi-period", response_model=MultiPeriodResponse)
async def get_multi_period(
    stock_code: str = Query(..., description="Stock code"),
    periods: str = Query("daily,weekly", description="Period list, comma separated"),
    db: Annotated[Session, Depends(get_db)] = None,
) -> MultiPeriodResponse:
    """
    Get multi-period K-line data.

    Returns K-line data for multiple periods in one request.
    """
    period_list = [p.strip() for p in periods.split(",")]
    service = MarketService(db)
    data = service.get_multi_period(stock_code, period_list)
    return MultiPeriodResponse(stockCode=stock_code, periods=data)


@router.get("/realtime", response_model=RealtimeQuote)
async def get_realtime(
    stock_code: str = Query(..., description="Stock code"),
    db: Annotated[Session, Depends(get_db)] = None,
) -> RealtimeQuote:
    """
    Get realtime quote.

    Returns simulated realtime price data.
    """
    service = MarketService(db)
    quote = service.get_realtime_quote(stock_code)
    if not quote:
        raise BusinessError(
            code="STOCK_NOT_FOUND",
            message="股票代码不存在",
            details={"stock_code": stock_code},
        )
    return quote
