"""
User related models: User, Fund
"""

from datetime import datetime
from uuid import uuid4

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class User(Base):
    """用户账户表"""
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    nickname = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = Column(Boolean, default=True)

    # Relationships
    fund = relationship("Fund", back_populates="user", uselist=False)
    positions = relationship("Position", back_populates="user", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="user", cascade="all, delete-orphan")
    trade_logs = relationship("TradeLog", back_populates="user", cascade="all, delete-orphan")
    pattern_marks = relationship("PatternMark", back_populates="user", cascade="all, delete-orphan")
    sr_levels = relationship("SRLevel", back_populates="user", cascade="all, delete-orphan")


class Fund(Base):
    """模拟资金表"""
    __tablename__ = "funds"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    total_balance = Column(Numeric(12, 2), nullable=False)  # 总资产
    available = Column(Numeric(12, 2), nullable=False)  # 可用资金
    frozen = Column(Numeric(12, 2), default=0)  # 冻结资金（挂单占用）
    initial_capital = Column(Numeric(12, 2), nullable=False)  # 初始资金（用于计算收益率）
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="fund")
