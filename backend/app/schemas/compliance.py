"""
Compliance schemas for API request/response
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class RiskWarningResponse(BaseModel):
    """Risk warning response"""
    title: str
    content: str
    scene: str  # homepage, trade_page


class ComplianceConfirmRequest(BaseModel):
    """User confirmation request for risk warning"""
    warning_type: str = Field(..., description="Warning type: homepage or trade_page")


class ComplianceRecordResponse(BaseModel):
    """Compliance record response"""
    id: UUID
    user_id: UUID
    warning_type: str
    confirmed_at: datetime

    class Config:
        from_attributes = True


class ComplianceStatusResponse(BaseModel):
    """User compliance status response"""
    user_id: UUID
    homepage_confirmed: datetime | None = None
    trade_page_confirmed: datetime | None = None
