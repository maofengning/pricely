"""
Data loader service for loading K-line data from CSV files
"""

import csv
import json
import logging
from collections.abc import Iterator
from datetime import datetime
from decimal import Decimal, InvalidOperation
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import DataLoadError
from app.models.enums import PeriodEnum
from app.models.market import Kline, Stock

logger = logging.getLogger(__name__)

# Data directory
DATA_DIR = Path(__file__).parent.parent.parent / "data"
KLINES_DIR = DATA_DIR / "klines"
STOCKS_FILE = DATA_DIR / "stocks" / "stocks.json"

# Valid periods
VALID_PERIODS = {p.value for p in PeriodEnum}

# Price validation constants
MIN_PRICE = Decimal("0.01")
MAX_PRICE = Decimal("100000.00")


class KlineRecord:
    """Validated K-line record from CSV"""

    __slots__ = ("stock_code", "period", "time", "open", "high", "low", "close", "volume")

    def __init__(
        self,
        stock_code: str,
        period: str,
        time: datetime,
        open_price: Decimal,
        high: Decimal,
        low: Decimal,
        close: Decimal,
        volume: int | None = None,
    ) -> None:
        self.stock_code = stock_code
        self.period = period
        self.time = time
        self.open = open_price
        self.high = high
        self.low = low
        self.close = close
        self.volume = volume

    def to_dict(self) -> dict[str, str | datetime | Decimal]:
        """Convert to dictionary for bulk insert"""
        return {
            "stock_code": self.stock_code,
            "period": self.period,
            "time": self.time,
            "open": self.open,
            "high": self.high,
            "low": self.low,
            "close": self.close,
        }


def validate_price(value: str, field_name: str) -> Decimal:
    """Validate and convert price string to Decimal"""
    try:
        price = Decimal(value.strip())
    except InvalidOperation as e:
        raise DataLoadError(
            f"Invalid {field_name} value: {value}",
            details={"field": field_name, "value": value},
        ) from e

    if price < MIN_PRICE or price > MAX_PRICE:
        raise DataLoadError(
            f"{field_name} out of valid range [{MIN_PRICE}, {MAX_PRICE}]",
            details={"field": field_name, "value": str(price)},
        )

    return price


def validate_period(period: str) -> str:
    """Validate period string"""
    period = period.strip().lower()
    if period not in VALID_PERIODS:
        raise DataLoadError(
            f"Invalid period: {period}. Must be one of {VALID_PERIODS}",
            details={"period": period, "valid_periods": list(VALID_PERIODS)},
        )
    return period


def validate_timestamp(ts_str: str) -> datetime:
    """Validate and parse timestamp string"""
    ts_str = ts_str.strip()

    # Try common timestamp formats
    formats = [
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%dT%H:%M:%SZ",
        "%Y-%m-%d",
        "%Y/%m/%d %H:%M:%S",
        "%Y/%m/%d",
    ]

    for fmt in formats:
        try:
            return datetime.strptime(ts_str, fmt)
        except ValueError:
            continue

    raise DataLoadError(
        f"Invalid timestamp format: {ts_str}",
        details={
            "value": ts_str,
            "expected_formats": formats,
        },
    )


def validate_ohlc_consistency(
    open_price: Decimal,
    high: Decimal,
    low: Decimal,
    close: Decimal,
) -> None:
    """Validate OHLC price consistency"""
    if high < open_price or high < close:
        raise DataLoadError(
            "High price must be >= open and close",
            details={
                "high": str(high),
                "open": str(open_price),
                "close": str(close),
            },
        )

    if low > open_price or low > close:
        raise DataLoadError(
            "Low price must be <= open and close",
            details={
                "low": str(low),
                "open": str(open_price),
                "close": str(close),
            },
        )


def parse_csv_row(row: dict[str, str], line_num: int) -> KlineRecord:
    """Parse and validate a CSV row into KlineRecord"""
    try:
        stock_code = row["stock_code"].strip()
        if not stock_code:
            raise DataLoadError(
                "Missing stock_code",
                details={"line": line_num},
            )

        period = validate_period(row.get("period", "daily"))
        time = validate_timestamp(row["time"])
        open_price = validate_price(row["open"], "open")
        high = validate_price(row["high"], "high")
        low = validate_price(row["low"], "low")
        close = validate_price(row["close"], "close")

        # Validate OHLC consistency
        validate_ohlc_consistency(open_price, high, low, close)

        # Volume is optional
        volume: int | None = None
        if "volume" in row and row["volume"].strip():
            try:
                volume = int(row["volume"].strip())
            except ValueError:
                logger.warning(
                    f"Line {line_num}: Invalid volume value '{row['volume']}', ignoring"
                )

        return KlineRecord(
            stock_code=stock_code,
            period=period,
            time=time,
            open_price=open_price,
            high=high,
            low=low,
            close=close,
            volume=volume,
        )

    except KeyError as e:
        raise DataLoadError(
            f"Missing required column: {e}",
            details={"line": line_num, "missing_field": str(e)},
        ) from e


def read_csv_file(file_path: Path) -> Iterator[KlineRecord]:
    """Read and parse CSV file, yielding validated records"""
    if not file_path.exists():
        raise DataLoadError(
            f"CSV file not found: {file_path}",
            details={"file": str(file_path)},
        )

    logger.info(f"Reading CSV file: {file_path}")

    with open(file_path, encoding="utf-8") as f:
        reader = csv.DictReader(f)

        # Validate required columns
        required_columns = {"stock_code", "time", "open", "high", "low", "close"}
        if reader.fieldnames is None:
            raise DataLoadError(
                "CSV file has no header row",
                details={"file": str(file_path)},
            )

        missing_columns = required_columns - set(reader.fieldnames)
        if missing_columns:
            raise DataLoadError(
                f"Missing required columns: {missing_columns}",
                details={
                    "file": str(file_path),
                    "missing_columns": list(missing_columns),
                    "found_columns": reader.fieldnames,
                },
            )

        line_num = 1  # Header is line 1
        for row in reader:
            line_num += 1
            try:
                yield parse_csv_row(row, line_num)
            except DataLoadError as e:
                logger.error(f"Line {line_num}: {e.message}")
                raise


async def load_stocks_from_json(
    db: AsyncSession, file_path: Path | None = None
) -> int:
    """Load stocks from JSON file into database"""
    if file_path is None:
        file_path = STOCKS_FILE

    if not file_path.exists():
        logger.warning(f"Stocks file not found: {file_path}")
        return 0

    logger.info(f"Loading stocks from: {file_path}")

    with open(file_path, encoding="utf-8") as f:
        stocks_data = json.load(f)

    count = 0
    for stock in stocks_data:
        # Check if stock already exists
        result = await db.execute(
            select(Stock).where(Stock.code == stock["code"])
        )
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
    logger.info(f"Loaded {count} new stocks")
    return count


async def load_klines_from_csv(
    db: AsyncSession,
    file_path: Path,
    batch_size: int = 1000,
    skip_duplicates: bool = True,
) -> dict[str, int]:
    """
    Load K-lines from CSV file into database with bulk insert optimization.

    Args:
        db: Async database session
        file_path: Path to CSV file
        batch_size: Number of records to insert per batch
        skip_duplicates: Skip records that already exist

    Returns:
        Dictionary with counts: {"loaded": n, "skipped": m, "errors": e}
    """
    stats: dict[str, int] = {"loaded": 0, "skipped": 0, "errors": 0}
    batch: list[dict[str, str | datetime | Decimal]] = []

    for record in read_csv_file(file_path):
        # Check for duplicate if skip_duplicates is True
        if skip_duplicates:
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

        # Bulk insert when batch is full
        if len(batch) >= batch_size:
            try:
                await _bulk_insert_klines(db, batch)
                stats["loaded"] += len(batch)
                logger.info(
                    f"Loaded batch of {len(batch)} records, total: {stats['loaded']}"
                )
            except Exception as e:
                logger.error(f"Batch insert failed: {e}")
                stats["errors"] += len(batch)
            finally:
                batch = []

    # Insert remaining records
    if batch:
        try:
            await _bulk_insert_klines(db, batch)
            stats["loaded"] += len(batch)
            logger.info(f"Loaded final batch of {len(batch)} records")
        except Exception as e:
            logger.error(f"Final batch insert failed: {e}")
            stats["errors"] += len(batch)

    await db.commit()
    logger.info(f"CSV load complete: {stats}")
    return stats


async def _bulk_insert_klines(
    db: AsyncSession, records: list[dict[str, str | datetime | Decimal]]
) -> None:
    """Bulk insert K-line records using PostgreSQL insert with on_conflict_do_nothing"""
    stmt = insert(Kline).values(records).on_conflict_do_nothing(
        constraint="ix_klines_stock_period_time"
    )
    await db.execute(stmt)


async def load_all_klines(
    db: AsyncSession,
    klines_dir: Path | None = None,
    batch_size: int = 1000,
) -> dict[str, dict[str, int]]:
    """
    Load all K-line CSV files from directory.

    Args:
        db: Async database session
        klines_dir: Directory containing CSV files (default: backend/data/klines/)
        batch_size: Number of records to insert per batch

    Returns:
        Dictionary mapping filename to load stats
    """
    if klines_dir is None:
        klines_dir = KLINES_DIR

    if not klines_dir.exists():
        logger.warning(f"K-lines directory not found: {klines_dir}")
        return {}

    results: dict[str, dict[str, int]] = {}
    csv_files = list(klines_dir.glob("*.csv"))

    if not csv_files:
        logger.warning(f"No CSV files found in: {klines_dir}")
        return {}

    logger.info(f"Found {len(csv_files)} CSV files to process")

    for csv_file in csv_files:
        logger.info(f"Processing: {csv_file.name}")
        try:
            stats = await load_klines_from_csv(db, csv_file, batch_size)
            results[csv_file.name] = stats
        except DataLoadError as e:
            logger.error(f"Failed to load {csv_file.name}: {e.message}")
            results[csv_file.name] = {"loaded": 0, "skipped": 0, "errors": 1}

    return results


async def init_data_from_files(db: AsyncSession) -> dict[str, int]:
    """
    Initialize all data from files.

    Returns:
        Summary of loaded data
    """
    logger.info("Starting data initialization from files...")

    # Load stocks
    stocks_count = await load_stocks_from_json(db)

    # Load K-lines
    kline_results = await load_all_klines(db)

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

    logger.info(f"Data initialization complete: {summary}")
    return summary
