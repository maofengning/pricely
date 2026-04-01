"""
Trade related models: Position, Order, TradeReport
"""

from datetime import datetime
from uuid import uuid4

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.enums import OrderModeEnum, OrderStatusEnum, OrderTypeEnum, ReportPeriodEnum


class Position(Base):
    """模拟持仓表"""
    __tablename__ = "positions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    stock_code = Column(String(10), nullable=False, index=True)
    stock_name = Column(String(50))
    quantity = Column(Integer, nullable=False)
    avg_cost = Column(Numeric(10, 4), nullable=False)  # 平均成本价
    current_price = Column(Numeric(10, 4))  # 当前价格（实时更新）
    profit_loss = Column(Numeric(12, 2))  # 盈亏金额
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="positions")


class Order(Base):
    """模拟订单表"""
    __tablename__ = "orders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    stock_code = Column(String(10), nullable=False, index=True)
    stock_name = Column(String(50))
    order_type = Column(Enum(OrderTypeEnum), nullable=False)  # buy/sell
    order_mode = Column(Enum(OrderModeEnum), nullable=False)  # market/limit
    limit_price = Column(Numeric(10, 4))  # 限价单价格
    quantity = Column(Integer, nullable=False)
    filled_price = Column(Numeric(10, 4))  # 成交价
    filled_at = Column(DateTime)  # 成交时间
    status = Column(Enum(OrderStatusEnum), default=OrderStatusEnum.PENDING)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="orders")


class TradeReport(Base):
    """模拟交易报表汇总表"""
    __tablename__ = "trade_reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    period_type = Column(Enum(ReportPeriodEnum), nullable=False)
    period_date = Column(DateTime, nullable=False)  # 统计周期起始日期
    trade_count = Column(Integer, default=0)  # 交易次数
    win_count = Column(Integer, default=0)  # 盈利次数
    loss_count = Column(Integer, default=0)  # 亏损次数
    win_rate = Column(Numeric(5, 2))  # 胜率 %
    total_profit = Column(Numeric(12, 2), default=0)  # 总盈利
    total_loss = Column(Numeric(12, 2), default=0)  # 总亏损
    net_profit = Column(Numeric(12, 2), default=0)  # 净盈亏
    max_drawdown = Column(Numeric(12, 2), default=0)  # 最大回撤
    created_at = Column(DateTime, default=datetime.utcnow)
