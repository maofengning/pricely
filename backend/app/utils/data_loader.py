#!/usr/bin/env python
"""
Data loader CLI tool for loading K-line data from CSV files.

Usage:
    python -m app.utils.data_loader --help
    python -m app.utils.data_loader --load
    python -m app.utils.data_loader --load --file <path>
    python -m app.utils.data_loader --load-stocks
"""

import argparse
import asyncio
import json
import random
import sys
from datetime import datetime, timedelta
from decimal import Decimal
from pathlib import Path
from typing import Any

from loguru import logger

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from app.core.database import AsyncSessionLocal, SessionLocal
from app.core.logging import setup_logging
from app.models.market import Kline, Stock

# Data directories
DATA_DIR = Path(__file__).parent.parent.parent / "data"
KLINES_DIR = DATA_DIR / "klines"
STOCKS_FILE = DATA_DIR / "stocks" / "stocks.json"

# Log format
LOG_FORMAT = (
    "<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | "
    "<level>{message}</level>"
)


def setup_cli_logging(verbose: bool = False) -> None:
    """Setup logging for CLI"""
    setup_logging()
    logger.remove()
    level = "DEBUG" if verbose else "INFO"
    logger.add(sys.stdout, format=LOG_FORMAT, level=level, colorize=True)


async def async_load_stocks() -> int:
    """Load stocks from JSON file using async session"""
    from sqlalchemy import select

    if not STOCKS_FILE.exists():
        logger.warning(f"Stocks file not found: {STOCKS_FILE}")
        return 0

    logger.info(f"Loading stocks from: {STOCKS_FILE}")

    with open(STOCKS_FILE, encoding="utf-8") as f:
        stocks_data = json.load(f)

    async with AsyncSessionLocal() as db:
        count = 0
        for stock in stocks_data:
            result = await db.execute(select(Stock).where(Stock.code == stock["code"]))
            existing = result.scalar_one_or_none()

            if existing:
                continue

            db_stock = Stock(
                code=stock["code"],
                name=stock["name"],
                exchange=stock.get("exchange"),
            )
            db.add(db_stock)
            count += 1

        await db.commit()
        logger.info(f"Successfully loaded {count} stocks")
        return count


async def async_load_klines_from_csv(
    file_path: Path | None = None,
    batch_size: int = 1000,
) -> dict[str, dict[str, int]]:
    """Load K-lines from CSV file(s) using async session"""
    from sqlalchemy import select
    from sqlalchemy.dialects.postgresql import insert

    from app.core.exceptions import DataLoadError
    from app.services.data_load_service import read_csv_file

    if file_path and not file_path.exists():
        raise DataLoadError(
            f"CSV file not found: {file_path}",
            details={"file": str(file_path)},
        )

    if file_path is None:
        if not KLINES_DIR.exists():
            logger.warning(f"K-lines directory not found: {KLINES_DIR}")
            return {}
        csv_files = list(KLINES_DIR.glob("*.csv"))
        if not csv_files:
            logger.warning(f"No CSV files found in: {KLINES_DIR}")
            return {}
    else:
        csv_files = [file_path]

    results: dict[str, dict[str, int]] = {}

    async with AsyncSessionLocal() as db:
        for csv_file in csv_files:
            logger.info(f"Processing: {csv_file.name}")
            stats: dict[str, int] = {"loaded": 0, "skipped": 0, "errors": 0}
            batch: list[dict[str, Any]] = []

            try:
                for record in read_csv_file(csv_file):
                    # Check for duplicate
                    result = await db.execute(
                        select(Kline).where(
                            Kline.stock_code == record.stock_code,
                            Kline.period == record.period,
                            Kline.time == record.time,
                        )
                    )
                    if result.scalar_one_or_none():
                        stats["skipped"] += 1
                        continue

                    batch.append(record.to_dict())

                    if len(batch) >= batch_size:
                        stmt = insert(Kline).values(batch).on_conflict_do_nothing(
                            constraint="ix_klines_stock_period_time"
                        )
                        await db.execute(stmt)
                        stats["loaded"] += len(batch)
                        logger.info(f"Loaded batch of {len(batch)} records")
                        batch = []

                # Insert remaining records
                if batch:
                    stmt = insert(Kline).values(batch).on_conflict_do_nothing(
                        constraint="ix_klines_stock_period_time"
                    )
                    await db.execute(stmt)
                    stats["loaded"] += len(batch)
                    logger.info(f"Loaded final batch of {len(batch)} records")

                await db.commit()
                results[csv_file.name] = stats
                logger.info(f"File complete: {stats}")

            except DataLoadError as e:
                logger.error(f"Failed to load {csv_file.name}: {e.message}")
                results[csv_file.name] = {"loaded": 0, "skipped": 0, "errors": 1}

    return results


async def async_init_all() -> dict[str, int]:
    """Initialize all data from files"""
    logger.info("Starting data initialization from files...")

    # Load stocks
    stocks_count = await async_load_stocks()

    # Load K-lines
    kline_results = await async_load_klines_from_csv()

    # Summarize K-line stats
    total_loaded = sum(r.get("loaded", 0) for r in kline_results.values())
    total_skipped = sum(r.get("skipped", 0) for r in kline_results.values())
    total_errors = sum(r.get("errors", 0) for r in kline_results.values())

    summary: dict[str, int] = {
        "stocks": stocks_count,
        "klines_loaded": total_loaded,
        "klines_skipped": total_skipped,
        "klines_errors": total_errors,
        "files_processed": len(kline_results),
    }

    logger.info(f"Initialization complete: {json.dumps(summary, indent=2)}")
    return summary


def generate_sample_csv(output_path: Path | None = None) -> None:
    """Generate a sample CSV file for reference"""
    if output_path is None:
        output_path = KLINES_DIR / "sample_klines.csv"

    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Generate sample data
    stock_codes = ["600000", "600036", "000001", "000002"]

    with open(output_path, "w", encoding="utf-8", newline="") as f:
        # Header
        f.write("stock_code,period,time,open,high,low,close,volume\n")

        # Sample data
        base_time = datetime.now() - timedelta(days=30)
        for stock_code in stock_codes[:2]:  # Just 2 stocks for sample
            current_time = base_time
            base_price = Decimal(str(random.uniform(10, 100)))

            for _ in range(10):
                current_time += timedelta(days=1)
                open_price = base_price * Decimal(
                    str(1 + random.uniform(-0.02, 0.02))
                )
                close_price = base_price * Decimal(
                    str(1 + random.uniform(-0.02, 0.02))
                )
                high_price = max(open_price, close_price) * Decimal(
                    str(1 + random.uniform(0, 0.01))
                )
                low_price = min(open_price, close_price) * Decimal(
                    str(1 - random.uniform(0, 0.01))
                )
                volume = random.randint(100000, 1000000)

                f.write(
                    f"{stock_code},daily,"
                    f"{current_time.strftime('%Y-%m-%d %H:%M:%S')},"
                    f"{open_price:.4f},{high_price:.4f},"
                    f"{low_price:.4f},{close_price:.4f},"
                    f"{volume}\n"
                )

                base_price = close_price

    logger.info(f"Sample CSV generated: {output_path}")
    logger.info(
        """
CSV Format:
  stock_code - Stock code (e.g., 600000, 000001)
  period - K-line period (1min, 5min, 15min, 30min, 60min, daily, weekly, monthly)
  time - Timestamp (YYYY-MM-DD HH:MM:SS or YYYY-MM-DD)
  open - Opening price
  high - Highest price
  low - Lowest price
  close - Closing price
  volume - Trading volume (optional)
"""
    )


def check_data_directory() -> None:
    """Check data directory and show summary"""
    logger.info("Checking data directory...")

    # Check stocks file
    if STOCKS_FILE.exists():
        with open(STOCKS_FILE, encoding="utf-8") as f:
            stocks = json.load(f)
        logger.info(f"Stocks file: {STOCKS_FILE} ({len(stocks)} stocks)")
    else:
        logger.warning(f"Stocks file not found: {STOCKS_FILE}")

    # Check K-lines directory
    if KLINES_DIR.exists():
        csv_files = list(KLINES_DIR.glob("*.csv"))
        logger.info(f"K-lines directory: {KLINES_DIR}")
        logger.info(f"Found {len(csv_files)} CSV files")

        for csv_file in csv_files[:10]:  # Show first 10
            size_kb = csv_file.stat().st_size / 1024
            logger.info(f"  - {csv_file.name} ({size_kb:.1f} KB)")

        if len(csv_files) > 10:
            logger.info(f"  ... and {len(csv_files) - 10} more files")
    else:
        logger.warning(f"K-lines directory not found: {KLINES_DIR}")
        logger.info("Creating directory...")
        KLINES_DIR.mkdir(parents=True, exist_ok=True)

    logger.info("")
    logger.info("CSV Format Required:")
    logger.info("  stock_code,period,time,open,high,low,close,volume")
    logger.info("  600000,daily,2024-01-01 09:30:00,10.5,10.8,10.4,10.7,1234567")


def main() -> None:
    """Main entry point for CLI"""
    parser = argparse.ArgumentParser(
        description="Data loader for K-line data",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Load all data (stocks + K-lines)
  python -m app.utils.data_loader --load

  # Load only stocks
  python -m app.utils.data_loader --load-stocks

  # Load K-lines from specific file
  python -m app.utils.data_loader --load-klines --file data/klines/my_data.csv

  # Load all K-line CSV files
  python -m app.utils.data_loader --load-klines

  # Generate sample CSV file
  python -m app.utils.data_loader --sample

  # Check data directory
  python -m app.utils.data_loader --check
""",
    )

    # Action arguments
    action_group = parser.add_mutually_exclusive_group()
    action_group.add_argument(
        "--load",
        action="store_true",
        help="Load all data (stocks + K-lines)",
    )
    action_group.add_argument(
        "--load-stocks",
        action="store_true",
        help="Load only stock list from JSON",
    )
    action_group.add_argument(
        "--load-klines",
        action="store_true",
        help="Load K-line data from CSV files",
    )
    action_group.add_argument(
        "--sample",
        action="store_true",
        help="Generate a sample CSV file",
    )
    action_group.add_argument(
        "--check",
        action="store_true",
        help="Check data directory and show summary",
    )

    # Optional arguments
    parser.add_argument(
        "--file",
        type=Path,
        help="Specific CSV file to load (use with --load-klines)",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=1000,
        help="Batch size for bulk insert (default: 1000)",
    )
    parser.add_argument(
        "-v",
        "--verbose",
        action="store_true",
        help="Enable verbose logging",
    )

    args = parser.parse_args()

    # Setup logging
    setup_cli_logging(args.verbose)

    # Handle actions
    if args.sample:
        generate_sample_csv()
        return

    if args.check:
        check_data_directory()
        return

    if args.load:
        asyncio.run(async_init_all())
        return

    if args.load_stocks:
        asyncio.run(async_load_stocks())
        return

    if args.load_klines:
        asyncio.run(async_load_klines_from_csv(args.file, args.batch_size))
        return

    # No action specified, show help
    parser.print_help()


# Legacy synchronous functions for backward compatibility
def load_stocks(db: Any) -> int:
    """Legacy: Load stocks from JSON file"""
    if not STOCKS_FILE.exists():
        logger.warning(f"Stocks file not found: {STOCKS_FILE}")
        return 0

    with open(STOCKS_FILE, encoding="utf-8") as f:
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
    logger.info(f"Loaded {count} stocks")
    return count


def load_klines(db: Any) -> int:
    """Legacy: Generate mock K-line data (deprecated, use CSV loading instead)"""
    stocks = db.query(Stock).all()
    periods = ["daily", "weekly"]

    count = 0
    for stock in stocks:
        base_price = Decimal(str(random.uniform(10, 100)))

        for period in periods:
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
        logger.info(f"Generated K-lines for {stock.code}: {stock.name}")

    logger.info(f"Total K-lines generated: {count}")
    return count


def generate_mock_klines(
    stock_code: str,
    base_price: Decimal,
    days: int = 365,
    period: str = "daily"
) -> list[dict[str, Any]]:
    """Generate mock K-line data for a stock (legacy function)"""
    klines: list[dict[str, Any]] = []
    current_price = float(base_price)
    start_date = datetime.now() - timedelta(days=days)

    # Determine interval based on period
    intervals: dict[str, timedelta] = {
        "daily": timedelta(days=1),
        "weekly": timedelta(weeks=1),
        "monthly": timedelta(days=30),
        "60min": timedelta(hours=1),
        "15min": timedelta(minutes=15),
        "5min": timedelta(minutes=5),
        "1min": timedelta(minutes=1),
    }
    interval = intervals.get(period, timedelta(days=1))

    # Scale days for smaller periods
    day_multipliers: dict[str, int] = {
        "60min": 6,
        "15min": 24,
        "5min": 72,
        "1min": 360,
    }
    days = days * day_multipliers.get(period, 1)

    current_time = start_date

    for _ in range(days):
        volatility = 0.03 if period in ["daily", "weekly", "monthly"] else 0.001
        change = random.uniform(-volatility, volatility)
        open_price = current_price
        close_price = current_price * (1 + change)

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


def init_data() -> None:
    """Legacy: Initialize all preset data"""
    db = SessionLocal()
    try:
        logger.info("Starting data initialization...")

        stocks_count = load_stocks(db)
        klines_count = load_klines(db)

        logger.info("Data initialization complete:")
        logger.info(f"  Stocks: {stocks_count}")
        logger.info(f"  K-lines: {klines_count}")

    except Exception as e:
        logger.error(f"Error during data initialization: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    main()
