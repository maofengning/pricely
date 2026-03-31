"""
Trade log model
"""

from datetime import datetime
from uuid import uuid4

from sqlalchemy import Column, String, Integer, DateTime, Numeric, ForeignKey, Enum, Text, ARRAY
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.enums import PeriodEnum, PatternEnum


class TradeLog(Base):
    """交易日志表"""
    __tablename__ = "trade_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    stock_code = Column(String(10), nullable=False, index=True)
    stock_name = Column(String(50))
    period = Column(Enum(PeriodEnum), nullable=False)  # K线周期
    pattern_type = Column(Enum(PatternEnum))  # 形态类型
    entry_price = Column(Numeric(10, 4), nullable=False)  # 入场价
    stop_loss = Column(Numeric(10, 4))  # 止损价
    take_profit = Column(Numeric(10, 4))  # 止盈价
    exit_price = Column(Numeric(10, 4))  # 出场价（实际）
    quantity = Column(Integer, nullable=False)
    profit_loss = Column(Numeric(12, 2))  # 盈亏金额
    notes = Column(Text)  # 备注分析
    tags = Column(ARRAY(String))  # 分类标签
    trade_time = Column(DateTime)  # 交易时间
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="trade_logs")