"""
Trade log service
"""

from datetime import datetime
from uuid import UUID

from sqlalchemy.orm import Session

from app.core.exceptions import BusinessError
from app.models.log import TradeLog
from app.schemas.log import TradeLogCreate, TradeLogUpdate


class LogService:
    """Trade log service class"""

    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, log_id: UUID, user_id: UUID) -> TradeLog | None:
        """Get a trade log by ID and user ID"""
        return (
            self.db.query(TradeLog)
            .filter(TradeLog.id == log_id, TradeLog.user_id == user_id)
            .first()
        )

    def create_log(self, user_id: UUID, data: TradeLogCreate) -> TradeLog:
        """Create a new trade log"""
        log = TradeLog(
            user_id=user_id,
            stock_code=data.stockCode,
            stock_name=data.stockName,
            period=data.period,
            pattern_type=data.patternType,
            entry_price=data.entryPrice,
            stop_loss=data.stopLoss,
            take_profit=data.takeProfit,
            exit_price=data.exitPrice,
            quantity=data.quantity,
            profit_loss=data.profitLoss,
            notes=data.notes,
            tags=data.tags,
            trade_time=data.tradeTime,
        )
        self.db.add(log)
        self.db.commit()
        self.db.refresh(log)
        return log

    def list_logs(
        self,
        user_id: UUID,
        stock_code: str | None = None,
        tags: list[str] | None = None,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[TradeLog], int]:
        """
        List trade logs with filtering.

        Args:
            user_id: User ID
            stock_code: Filter by stock code
            tags: Filter by tags (logs must contain ALL specified tags)
            start_date: Filter by start date
            end_date: Filter by end date
            page: Page number (1-indexed)
            page_size: Number of items per page

        Returns:
            Tuple of (list of logs, total count)
        """
        query = self.db.query(TradeLog).filter(TradeLog.user_id == user_id)

        # Filter by stock code
        if stock_code:
            query = query.filter(TradeLog.stock_code == stock_code)

        # Filter by tags (logs must contain ALL specified tags)
        if tags:
            # Use @> operator for array contains in PostgreSQL
            # This checks if the tags column contains all the specified tags
            query = query.filter(TradeLog.tags.contains(tags))

        # Filter by date range
        if start_date:
            query = query.filter(TradeLog.trade_time >= start_date)
        if end_date:
            query = query.filter(TradeLog.trade_time <= end_date)

        # Get total count before pagination
        total = query.count()

        # Order by created_at descending and paginate
        offset = (page - 1) * page_size
        logs = query.order_by(TradeLog.created_at.desc()).offset(offset).limit(page_size).all()

        return logs, total

    def update_log(self, log_id: UUID, user_id: UUID, data: TradeLogUpdate) -> TradeLog:
        """Update a trade log"""
        log = self.get_by_id(log_id, user_id)
        if not log:
            raise BusinessError(
                code="LOG_NOT_FOUND",
                message="日志不存在",
                details={"log_id": str(log_id)},
            )

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(log, field, value)

        self.db.commit()
        self.db.refresh(log)
        return log

    def delete_log(self, log_id: UUID, user_id: UUID) -> bool:
        """Delete a trade log"""
        log = self.get_by_id(log_id, user_id)
        if not log:
            raise BusinessError(
                code="LOG_NOT_FOUND",
                message="日志不存在",
                details={"log_id": str(log_id)},
            )

        self.db.delete(log)
        self.db.commit()
        return True
