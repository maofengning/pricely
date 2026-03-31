"""
Market data models for K-line data
"""

from datetime import datetime
from uuid import uuid4

from sqlalchemy import Column, String, DateTime, Numeric, Index
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base
from app.models.enums import PeriodEnum


class Stock(Base):
    """股票列表表"""
    __tablename__ = "stocks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    code = Column(String(10), unique=True, nullable=False, index=True)
    name = Column(String(50), nullable=False)
    exchange = Column(String(10))  # 交易所: SH, SZ
    created_at = Column(DateTime, default=datetime.utcnow)


class Kline(Base):
    """K线数据表"""
    __tablename__ = "klines"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    stock_code = Column(String(10), nullable=False, index=True)
    period = Column(String(10), nullable=False, index=True)  # 1min, 5min, etc.
    time = Column(DateTime, nullable=False, index=True)
    open = Column(Numeric(10, 4), nullable=False)
    high = Column(Numeric(10, 4), nullable=False)
    low = Column(Numeric(10, 4), nullable=False)
    close = Column(Numeric(10, 4), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Composite index for unique constraint
    __table_args__ = (
        Index("ix_klines_stock_period_time", "stock_code", "period", "time"),
    )