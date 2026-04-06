"""
Compliance service for risk warning management
"""

from datetime import datetime
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.compliance import ComplianceRecord
from app.models.enums import WarningTypeEnum
from app.schemas.compliance import (
    ComplianceConfirmRequest,
    ComplianceStatusResponse,
    RiskWarningResponse,
)


class ComplianceService:
    """Compliance service class for risk warning management"""

    # Risk warning content configuration
    RISK_WARNINGS: dict[str, dict[str, str]] = {
        WarningTypeEnum.HOMEPAGE.value: {
            "title": "风险提示",
            "content": "本平台仅提供模拟交易服务，不涉及任何实盘交易。模拟交易结果不代表实盘收益，投资有风险，入市需谨慎。",
            "scene": WarningTypeEnum.HOMEPAGE.value,
        },
        WarningTypeEnum.TRADE_PAGE.value: {
            "title": "模拟交易风险提示",
            "content": "您即将进入模拟交易页面。请注意：\n1. 本平台仅提供模拟交易，不涉及真实资金。\n2. 模拟交易结果不代表实盘收益。\n3. 所有交易决策由您自行做出，本平台不提供任何投资建议。\n4. 请勿根据模拟交易结果进行实盘操作。",
            "scene": WarningTypeEnum.TRADE_PAGE.value,
        },
    }

    def __init__(self, db: Session | None) -> None:
        self.db = db

    def get_risk_warning(self, scene: str) -> RiskWarningResponse:
        """Get risk warning content by scene"""
        warning = self.RISK_WARNINGS.get(scene, self.RISK_WARNINGS[WarningTypeEnum.HOMEPAGE.value])
        return RiskWarningResponse(**warning)

    def confirm_warning(self, user_id: UUID, request: ComplianceConfirmRequest) -> ComplianceRecord:
        """Record user's confirmation of risk warning"""
        if self.db is None:
            raise ValueError("Database session is required for confirm_warning")

        # Check if already confirmed
        existing = (
            self.db.query(ComplianceRecord)
            .filter(
                ComplianceRecord.user_id == user_id,
                ComplianceRecord.warning_type == request.warning_type,
            )
            .first()
        )

        if existing:
            # Update confirmation time only (created_at should remain the original creation time)
            existing.confirmed_at = datetime.utcnow()  # type: ignore[assignment]
            self.db.commit()
            self.db.refresh(existing)
            return existing

        # Create new confirmation record
        record = ComplianceRecord(
            user_id=user_id,
            warning_type=request.warning_type,
            confirmed_at=datetime.utcnow(),
        )
        self.db.add(record)
        self.db.commit()
        self.db.refresh(record)
        return record

    def get_confirmation_status(self, user_id: UUID, warning_type: str | None = None) -> ComplianceStatusResponse:
        """Get user's confirmation status for risk warnings"""
        if self.db is None:
            raise ValueError("Database session is required for get_confirmation_status")

        query = self.db.query(ComplianceRecord).filter(ComplianceRecord.user_id == user_id)

        if warning_type:
            records = query.filter(ComplianceRecord.warning_type == warning_type).all()
        else:
            records = query.all()

        # Build confirmation status dict
        confirmed_types: dict[str, datetime] = {record.warning_type: record.confirmed_at for record in records}  # type: ignore[misc]

        return ComplianceStatusResponse(
            user_id=user_id,
            homepage_confirmed=confirmed_types.get(WarningTypeEnum.HOMEPAGE.value),
            trade_page_confirmed=confirmed_types.get(WarningTypeEnum.TRADE_PAGE.value),
        )

    def has_confirmed(self, user_id: UUID, warning_type: str) -> bool:
        """Check if user has confirmed a specific warning type"""
        if self.db is None:
            raise ValueError("Database session is required for has_confirmed")

        record = (
            self.db.query(ComplianceRecord)
            .filter(
                ComplianceRecord.user_id == user_id,
                ComplianceRecord.warning_type == warning_type,
            )
            .first()
        )
        return record is not None
