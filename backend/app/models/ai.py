"""
AI support/resistance detection models
"""

from datetime import datetime
from uuid import uuid4

from sqlalchemy import Boolean, Column, DateTime, Enum, ForeignKey, Integer, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.enums import LevelTypeEnum, PeriodEnum


class SRLevel(Base):
    """支撑阻力识别结果表"""
    __tablename__ = "sr_levels"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    stock_code = Column(String(10), nullable=False, index=True)
    period = Column(Enum(PeriodEnum), nullable=False)
    level_type = Column(Enum(LevelTypeEnum), nullable=False)
    level_price = Column(Numeric(10, 4), nullable=False)  # 支撑/阻力价位
    strength = Column(Integer)  # 强度评分（1-10）
    is_ai_detected = Column(Boolean, default=True)  # AI自动识别
    is_user_corrected = Column(Boolean, default=False)  # 用户手动修正
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), index=True)  # NULL if AI detected
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="sr_levels")


class IntLevel(Base):
    """整数关口标注表"""
    __tablename__ = "int_levels"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    stock_code = Column(String(10), nullable=False, index=True)
    period = Column(Enum(PeriodEnum), nullable=False)
    level_price = Column(Numeric(10, 4), nullable=False)  # 整数关口价格
    level_type = Column(Enum(LevelTypeEnum), nullable=False)
    touches_count = Column(Integer, default=0)  # 该价位触及次数
    created_at = Column(DateTime, default=datetime.utcnow)
