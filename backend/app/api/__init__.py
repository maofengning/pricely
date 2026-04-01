"""
API routes package
"""

from fastapi import APIRouter

from app.api.ai import router as ai_router
from app.api.auth import router as auth_router
from app.api.compliance import router as compliance_router
from app.api.log import router as log_router
from app.api.market import router as market_router
from app.api.pattern import router as pattern_router
from app.api.trade import router as trade_router

api_router = APIRouter()

# Include all routers
api_router.include_router(auth_router)
api_router.include_router(market_router)
api_router.include_router(ai_router)
api_router.include_router(pattern_router)
api_router.include_router(trade_router)
api_router.include_router(log_router)
api_router.include_router(compliance_router)


__all__ = ["api_router"]
