"""
Data loading API routes
"""

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_async_db
from app.models.market import Kline, Stock
from app.schemas.common import SuccessResponse
from app.services.data_load_service import (
    KLINES_DIR,
    STOCKS_FILE,
    load_all_klines,
    load_klines_from_csv,
    load_stocks_from_json,
)

router = APIRouter(prefix="/data", tags=["Data Loading"])


class DataLoadResponse(BaseModel):
    """Data load response"""

    stocksLoaded: int = 0
    klinesLoaded: int = 0
    klinesSkipped: int = 0
    klinesErrors: int = 0
    filesProcessed: int = 0


class FileLoadResponse(BaseModel):
    """Single file load response"""

    file: str
    loaded: int = 0
    skipped: int = 0
    errors: int = 0


@router.post("/stocks", response_model=SuccessResponse)
async def load_stocks_endpoint(
    db: AsyncSession = Depends(get_async_db),
) -> SuccessResponse:
    """Load stocks from JSON file"""
    try:
        count = await load_stocks_from_json(db, STOCKS_FILE)
        return SuccessResponse(
            success=True,
            message=f"Loaded {count} stocks successfully",
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "code": "DATA_LOAD_ERROR",
                "message": f"Failed to load stocks: {str(e)}",
            },
        ) from e


@router.post("/klines", response_model=DataLoadResponse)
async def load_klines_endpoint(
    db: AsyncSession = Depends(get_async_db),
    batch_size: int = Query(default=1000, description="Batch size for bulk insert"),
) -> DataLoadResponse:
    """Load K-lines from all CSV files in the data directory"""
    try:
        results = await load_all_klines(db, KLINES_DIR, batch_size)

        # Summarize results
        total_loaded = sum(r.get("loaded", 0) for r in results.values())
        total_skipped = sum(r.get("skipped", 0) for r in results.values())
        total_errors = sum(r.get("errors", 0) for r in results.values())

        return DataLoadResponse(
            klinesLoaded=total_loaded,
            klinesSkipped=total_skipped,
            klinesErrors=total_errors,
            filesProcessed=len(results),
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "code": "DATA_LOAD_ERROR",
                "message": f"Failed to load K-lines: {str(e)}",
            },
        ) from e


@router.post("/klines/file", response_model=FileLoadResponse)
async def load_klines_file_endpoint(
    db: AsyncSession = Depends(get_async_db),
    file_path: str = Query(description="Path to CSV file relative to data/klines/"),
    batch_size: int = Query(default=1000, description="Batch size for bulk insert"),
) -> FileLoadResponse:
    """Load K-lines from a specific CSV file"""
    try:
        # Resolve file path
        full_path = KLINES_DIR / file_path
        if not full_path.exists():
            raise HTTPException(
                status_code=404,
                detail={
                    "code": "FILE_NOT_FOUND",
                    "message": f"CSV file not found: {file_path}",
                },
            )

        stats = await load_klines_from_csv(db, full_path, batch_size)

        return FileLoadResponse(
            file=file_path,
            loaded=stats.get("loaded", 0),
            skipped=stats.get("skipped", 0),
            errors=stats.get("errors", 0),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "code": "DATA_LOAD_ERROR",
                "message": f"Failed to load K-lines: {str(e)}",
            },
        ) from e


@router.post("/init", response_model=DataLoadResponse)
async def init_data_endpoint(
    db: AsyncSession = Depends(get_async_db),
) -> DataLoadResponse:
    """Initialize all data from files (stocks + K-lines)"""
    try:
        # Load stocks
        stocks_count = await load_stocks_from_json(db)

        # Load K-lines
        results = await load_all_klines(db)

        # Summarize
        total_loaded = sum(r.get("loaded", 0) for r in results.values())
        total_skipped = sum(r.get("skipped", 0) for r in results.values())
        total_errors = sum(r.get("errors", 0) for r in results.values())

        return DataLoadResponse(
            stocksLoaded=stocks_count,
            klinesLoaded=total_loaded,
            klinesSkipped=total_skipped,
            klinesErrors=total_errors,
            filesProcessed=len(results),
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "code": "DATA_LOAD_ERROR",
                "message": f"Failed to initialize data: {str(e)}",
            },
        ) from e


@router.get("/status")
async def get_data_status(
    db: AsyncSession = Depends(get_async_db),
) -> dict[str, Any]:
    """Get current data status in database"""
    # Count stocks
    stocks_result = await db.execute(select(func.count(Stock.id)))
    stocks_count = stocks_result.scalar() or 0

    # Count klines by period
    klines_by_period: dict[str, int] = {}
    periods = ["1min", "5min", "15min", "60min", "daily", "weekly", "monthly"]

    for period in periods:
        result = await db.execute(
            select(func.count(Kline.id)).where(Kline.period == period)
        )
        count = result.scalar() or 0
        if count > 0:
            klines_by_period[period] = count

    # Check data directory
    csv_files: list[dict[str, float | str]] = []
    if KLINES_DIR.exists():
        for csv_file in KLINES_DIR.glob("*.csv"):
            csv_files.append({
                "name": csv_file.name,
                "size_kb": csv_file.stat().st_size / 1024,
            })

    return {
        "stocks": stocks_count,
        "klinesByPeriod": klines_by_period,
        "csvFiles": csv_files[:20],  # Limit to 20 files
        "dataDirectory": str(KLINES_DIR),
    }
