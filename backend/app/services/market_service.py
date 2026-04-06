"""
Market data service
"""

import random
from datetime import datetime
from decimal import Decimal

from sqlalchemy.orm import Session

from app.core.exceptions import BusinessError
from app.models.market import Kline, Stock
from app.schemas.market import KlineData, RealtimeQuote, StockDetailResponse, StockResponse


class MarketService:
    """Market data service class"""

    def __init__(self, db: Session):
        self.db = db
        self._price_cache: dict[str, Decimal] = {}

    def get_stocks(
        self,
        keyword: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[StockResponse], int]:
        """
        Get paginated stock list.

        Args:
            keyword: Search keyword for code or name
            page: Page number (1-indexed)
            page_size: Number of records per page

        Returns:
            Tuple of (stock list, total count)
        """
        query = self.db.query(Stock)

        if keyword:
            query = query.filter(
                (Stock.code.contains(keyword)) | (Stock.name.contains(keyword))
            )

        # Get total count
        total = query.count()

        # Apply pagination
        offset = (page - 1) * page_size
        stocks = query.offset(offset).limit(page_size).all()

        return [StockResponse.model_validate(s) for s in stocks], total

    def get_stock_by_code(self, stock_code: str) -> StockDetailResponse:
        """
        Get stock detail by code.

        Args:
            stock_code: Stock code

        Returns:
            Stock detail with latest price information

        Raises:
            BusinessError: If stock not found
        """
        stock = self.db.query(Stock).filter(Stock.code == stock_code).first()

        if not stock:
            raise BusinessError(
                code="STOCK_NOT_FOUND",
                message="股票代码不存在",
                details={"stock_code": stock_code},
            )

        # Get latest K-line data for price information
        latest_kline = (
            self.db.query(Kline)
            .filter(Kline.stock_code == stock_code, Kline.period == "daily")
            .order_by(Kline.time.desc())
            .first()
        )

        return StockDetailResponse(
            code=stock.code,
            name=stock.name,
            exchange=stock.exchange,
            latestPrice=latest_kline.close if latest_kline else None,
            latestTime=latest_kline.time if latest_kline else None,
        )

    def get_kline(
        self,
        stock_code: str,
        period: str = "daily",
        start: datetime | None = None,
        end: datetime | None = None,
        page: int = 1,
        page_size: int = 100,
    ) -> tuple[list[KlineData], int]:
        """
        Get single period K-line data with pagination.

        Args:
            stock_code: Stock code
            period: K-line period (1min, 5min, 15min, 30min, 60min, daily, weekly, monthly)
            start: Start datetime
            end: End datetime
            page: Page number (1-indexed)
            page_size: Number of records per page

        Returns:
            Tuple of (kline data list, total count)
        """
        # Validate period
        valid_periods = ["1min", "5min", "15min", "30min", "60min", "daily", "weekly", "monthly"]
        if period not in valid_periods:
            raise BusinessError(
                code="INVALID_PERIOD",
                message="无效的K线周期",
                details={"period": period, "valid_periods": valid_periods},
            )

        query = self.db.query(Kline).filter(
            Kline.stock_code == stock_code,
            Kline.period == period,
        )

        if start:
            query = query.filter(Kline.time >= start)
        if end:
            query = query.filter(Kline.time <= end)

        # Get total count
        total = query.count()

        # Apply pagination
        offset = (page - 1) * page_size
        klines = query.order_by(Kline.time).offset(offset).limit(page_size).all()

        return [
            KlineData(
                time=k.time,
                open=k.open,
                high=k.high,
                low=k.low,
                close=k.close,
            )
            for k in klines
        ], total

    def get_multi_period(
        self,
        stock_code: str,
        periods: list[str] | None = None,
    ) -> dict[str, list[KlineData]]:
        """Get multi-period K-line data"""
        if periods is None:
            periods = ["daily", "weekly"]

        result = {}
        for period in periods:
            data, _ = self.get_kline(stock_code, period)
            result[period] = data

        return result

    def get_realtime_quote(self, stock_code: str) -> RealtimeQuote | None:
        """Get realtime quote (simulated)"""
        # Check if stock exists
        stock = self.db.query(Stock).filter(Stock.code == stock_code).first()
        if not stock:
            return None

        # Get latest K-line data for base price
        latest = (
            self.db.query(Kline)
            .filter(Kline.stock_code == stock_code, Kline.period == "daily")
            .order_by(Kline.time.desc())
            .first()
        )

        if not latest:
            return None

        # Simulate realtime price (±0.5% random fluctuation)
        base_price = float(latest.close)
        fluctuation = random.uniform(-0.005, 0.005)
        current_price = base_price * (1 + fluctuation)
        change = current_price - base_price
        change_pct = (change / base_price) * 100

        return RealtimeQuote(
            stockCode=stock_code,
            price=Decimal(str(round(current_price, 4))),
            change=Decimal(str(round(change, 4))),
            changePct=Decimal(str(round(change_pct, 2))),
            time=datetime.now(),
        )

    def simulate_realtime_price(self, base_price: Decimal) -> Decimal:
        """Simulate realtime price fluctuation"""
        fluctuation = random.uniform(-0.005, 0.005)
        return Decimal(str(round(float(base_price) * (1 + fluctuation), 4)))
