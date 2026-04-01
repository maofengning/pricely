"""
Compliance schemas for API request/response
"""

from pydantic import BaseModel


class RiskWarningResponse(BaseModel):
    """Risk warning response"""
    title: str
    content: str
    scene: str  # homepage, trade_page
