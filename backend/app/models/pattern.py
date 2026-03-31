"""
Pattern marking model
"""

from datetime import datetime
from uuid import uuid4

from sqlalchemy import Column, String, DateTime, Numeric, ForeignKey, Enum, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.enums import PeriodEnum, PatternEnum


class PatternMark(Base):
    """形态标注表"""
    __tablename__ = "pattern_marks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    stock_code = Column(String(10), nullable=False, index=True)
    period = Column(Enum(PeriodEnum), nullable=False)  # 关联K线周期
    pattern_type = Column(Enum(PatternEnum), nullable=False)  # 形态类型
    start_time = Column(DateTime, nullable=False)  # 形态起始K线时间
    end_time = Column(DateTime, nullable=False)  # 形态结束K线时间
    start_price = Column(Numeric(10, 4))  # 形态起始价格
    end_price = Column(Numeric(10, 4))  # 形态结束价格
    description = Column(Text)  # 形态描述
    is_valid = Column(Boolean, default=True)  # 形态有效性标记
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="pattern_marks")