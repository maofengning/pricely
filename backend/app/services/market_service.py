"""
Market data service
"""

import random
from datetime import datetime
from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.market import Kline, Stock
from app.schemas.market import KlineData, RealtimeQuote, StockResponse


class MarketService:
    """Market data service class"""

    def __init__(self, db: Session):
        self.db = db
        self._price_cache: dict[str, Decimal] = {}

    def get_stocks(self, keyword: str | None = None) -> list[StockResponse]:
        """Get stock list"""
        query = self.db.query(Stock)

        if keyword:
            query = query.filter(
                (Stock.code.contains(keyword)) | (Stock.name.contains(keyword))
            )

        stocks = query.limit(50).all()
        return [StockResponse.model_validate(s) for s in stocks]

    def get_kline(
        self,
        stock_code: str,
        period: str = "daily",
        start: datetime | None = None,
        end: datetime | None = None,
    ) -> list[KlineData]:
        """Get single period K-line data"""
        query = self.db.query(Kline).filter(
            Kline.stock_code == stock_code,
            Kline.period == period,
        )

        if start:
            query = query.filter(Kline.time >= start)
        if end:
            query = query.filter(Kline.time <= end)

        klines = query.order_by(Kline.time).all()
        return [
            KlineData(
                time=k.time,
                open=k.open,
                high=k.high,
                low=k.low,
                close=k.close,
            )
            for k in klines
        ]

    def get_multi_period(
        self,
        stock_code: str,
        periods: list[str] = None,
    ) -> dict[str, list[KlineData]]:
        """Get multi-period K-line data"""
        if periods is None:
            periods = ["daily", "weekly"]

        result = {}
        for period in periods:
            result[period] = self.get_kline(stock_code, period)

        return result

    def get_realtime_quote(self, stock_code: str) -> RealtimeQuote | None:
        """Get realtime quote (simulated)"""
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
