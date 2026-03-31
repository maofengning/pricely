"""
Data loader script for preset data
"""

import json
import csv
import random
from datetime import datetime, timedelta
from decimal import Decimal
from pathlib import Path

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models import Stock, Kline
from app.models.enums import PeriodEnum


DATA_DIR = Path(__file__).parent.parent / "data"


def load_stocks(db: Session) -> int:
    """Load stocks from JSON file"""
    stocks_file = DATA_DIR / "stocks" / "stocks.json"

    if not stocks_file.exists():
        print(f"Stocks file not found: {stocks_file}")
        return 0

    with open(stocks_file, "r", encoding="utf-8") as f:
        stocks_data = json.load(f)

    count = 0
    for stock in stocks_data:
        existing = db.query(Stock).filter(Stock.code == stock["code"]).first()
        if existing:
            continue

        db_stock = Stock(
            code=stock["code"],
            name=stock["name"],
            exchange=stock.get("exchange"),
        )
        db.add(db_stock)
        count += 1

    db.commit()
    print(f"Loaded {count} stocks")
    return count


def generate_mock_klines(
    stock_code: str,
    base_price: Decimal,
    days: int = 365,
    period: str = "daily"
) -> list[dict]:
    """Generate mock K-line data for a stock"""
    klines = []
    current_price = float(base_price)
    start_date = datetime.now() - timedelta(days=days)

    # Determine interval based on period
    if period == "daily":
        interval = timedelta(days=1)
    elif period == "weekly":
        interval = timedelta(weeks=1)
    elif period == "monthly":
        interval = timedelta(days=30)
    elif period == "60min":
        interval = timedelta(hours=1)
        days = days * 6  # 6 hours per day (trading hours)
    elif period == "15min":
        interval = timedelta(minutes=15)
        days = days * 24  # 24 15-min bars per day
    elif period == "5min":
        interval = timedelta(minutes=5)
        days = days * 72  # 72 5-min bars per day
    elif period == "1min":
        interval = timedelta(minutes=1)
        days = days * 360  # 360 1-min bars per day

    current_time = start_date

    for _ in range(days):
        # Random price movement (±3% daily, scaled for period)
        volatility = 0.03 if period in ["daily", "weekly", "monthly"] else 0.001
        change = random.uniform(-volatility, volatility)
        open_price = current_price
        close_price = current_price * (1 + change)

        # High and low within the range
        high_price = max(open_price, close_price) * (1 + random.uniform(0, 0.01))
        low_price = min(open_price, close_price) * (1 - random.uniform(0, 0.01))

        klines.append({
            "stock_code": stock_code,
            "period": period,
            "time": current_time,
            "open": Decimal(str(round(open_price, 4))),
            "high": Decimal(str(round(high_price, 4))),
            "low": Decimal(str(round(low_price, 4))),
            "close": Decimal(str(round(close_price, 4))),
        })

        current_price = close_price
        current_time += interval

    return klines


def load_klines(db: Session) -> int:
    """Load or generate K-line data"""
    stocks = db.query(Stock).all()
    periods = ["daily", "weekly"]  # MVP: only daily and weekly for simplicity

    count = 0
    for stock in stocks:
        # Use different base prices for different stocks
        base_price = Decimal(str(random.uniform(10, 100)))

        for period in periods:
            # Check if data already exists
            existing = db.query(Kline).filter(
                Kline.stock_code == stock.code,
                Kline.period == period
            ).first()

            if existing:
                continue

            klines_data = generate_mock_klines(
                stock.code,
                base_price,
                days=365,
                period=period
            )

            for kline in klines_data:
                db_kline = Kline(**kline)
                db.add(db_kline)
                count += 1

        db.commit()
        print(f"Generated K-lines for {stock.code}: {stock.name}")

    print(f"Total K-lines generated: {count}")
    return count


def init_data():
    """Initialize all preset data"""
    db = SessionLocal()
    try:
        print("Starting data initialization...")

        # Load stocks
        stocks_count = load_stocks(db)

        # Generate K-lines
        klines_count = load_klines(db)

        print(f"\nData initialization complete:")
        print(f"  Stocks: {stocks_count}")
        print(f"  K-lines: {klines_count}")

    except Exception as e:
        print(f"Error during data initialization: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    init_data()