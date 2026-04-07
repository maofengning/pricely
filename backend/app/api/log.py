"""
Trade log API routes
"""

from datetime import datetime
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.core.database import get_db
from app.core.exceptions import BusinessError
from app.models.user import User
from app.schemas.log import (
    TradeLogCreate,
    TradeLogListResponse,
    TradeLogResponse,
    TradeLogUpdate,
)
from app.services.log_service import LogService

router = APIRouter(prefix="/logs", tags=["Trade Log"])


@router.post("", response_model=TradeLogResponse)
async def create_log(
    data: TradeLogCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> TradeLogResponse:
    """Create a trade log"""
    log_service = LogService(db)
    log = log_service.create_log(UUID(str(current_user.id)), data)
    return TradeLogResponse.model_validate(log)


@router.get("", response_model=TradeLogListResponse)
async def list_logs(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    stock_code: str | None = Query(
        None, alias="stockCode", description="Filter by stock code"
    ),
    tags: list[str] | None = Query(
        None, alias="tags", description="Filter by tags (must contain all)"
    ),
    start_date: datetime | None = Query(
        None, alias="startDate", description="Filter by start date"
    ),
    end_date: datetime | None = Query(
        None, alias="endDate", description="Filter by end date"
    ),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Page size"),
) -> TradeLogListResponse:
    """
    List trade logs with filtering support.

    - **stockCode**: Filter by stock code
    - **tags**: Filter by tags (logs must contain ALL specified tags)
    - **startDate**: Filter by start date (trade_time >= startDate)
    - **endDate**: Filter by end date (trade_time <= endDate)
    - **page**: Page number (1-indexed)
    - **pageSize**: Number of items per page
    """
    log_service = LogService(db)
    logs, total = log_service.list_logs(
        user_id=UUID(str(current_user.id)),
        stock_code=stock_code,
        tags=tags,
        start_date=start_date,
        end_date=end_date,
        page=page,
        page_size=page_size,
    )
    return TradeLogListResponse(
        items=[TradeLogResponse.model_validate(log) for log in logs],
        total=total,
        page=page,
        pageSize=page_size,
    )


@router.get("/{log_id}", response_model=TradeLogResponse)
async def get_log(
    log_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> TradeLogResponse:
    """Get a trade log by ID"""
    log_service = LogService(db)
    log = log_service.get_by_id(log_id, UUID(str(current_user.id)))
    if not log:
        raise BusinessError(
            code="LOG_NOT_FOUND",
            message="日志不存在",
            details={"log_id": str(log_id)},
        )
    return TradeLogResponse.model_validate(log)


@router.put("/{log_id}", response_model=TradeLogResponse)
async def update_log(
    log_id: UUID,
    data: TradeLogUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> TradeLogResponse:
    """Update a trade log"""
    log_service = LogService(db)
    log = log_service.update_log(log_id, UUID(str(current_user.id)), data)
    return TradeLogResponse.model_validate(log)


@router.delete("/{log_id}")
async def delete_log(
    log_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> dict[str, bool]:
    """Delete a trade log"""
    log_service = LogService(db)
    log_service.delete_log(log_id, UUID(str(current_user.id)))
    return {"success": True}
