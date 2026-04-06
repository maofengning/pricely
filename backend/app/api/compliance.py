"""
Compliance API routes
"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.core.database import get_db
from app.models.enums import WarningTypeEnum
from app.models.user import User
from app.schemas.compliance import (
    ComplianceConfirmRequest,
    ComplianceRecordResponse,
    ComplianceStatusResponse,
    RiskWarningResponse,
)
from app.services.compliance_service import ComplianceService

router = APIRouter(prefix="/compliance", tags=["Compliance"])


@router.get("/warning", response_model=RiskWarningResponse)
async def get_risk_warning(
    scene: str = Query(default="homepage", description="Warning scene: homepage or trade_page"),
) -> RiskWarningResponse:
    """Get risk warning content"""
    service = ComplianceService(None)  # No DB needed for warning content
    return service.get_risk_warning(scene)


@router.post("/confirm", response_model=ComplianceRecordResponse)
async def confirm_risk_warning(
    request: ComplianceConfirmRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> ComplianceRecordResponse:
    """Record user's confirmation of risk warning"""
    # Validate warning type
    if request.warning_type not in [e.value for e in WarningTypeEnum]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "INVALID_WARNING_TYPE",
                "message": "Invalid warning type",
                "details": {"valid_types": [e.value for e in WarningTypeEnum]},
            },
        )

    service = ComplianceService(db)
    record = service.confirm_warning(current_user.id, request)  # type: ignore[arg-type]
    return ComplianceRecordResponse.model_validate(record)


@router.get("/status", response_model=ComplianceStatusResponse)
async def get_confirmation_status(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
    warning_type: str | None = Query(default=None, description="Filter by warning type"),
) -> ComplianceStatusResponse:
    """Get user's confirmation status for risk warnings"""
    service = ComplianceService(db)
    return service.get_confirmation_status(current_user.id, warning_type)  # type: ignore[arg-type]
