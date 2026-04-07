"""
Report service for trade report generation

Calculates win rate, profit/loss ratio, and max drawdown from trade logs.
"""

from datetime import datetime, timedelta
from decimal import Decimal
from uuid import UUID

from loguru import logger
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.enums import ReportPeriodEnum
from app.models.log import TradeLog
from app.models.trade import TradeReport
from app.models.user import User


class ReportService:
    """Service for trade report generation"""

    def __init__(self, db: Session):
        self.db = db

    def calculate_win_rate(self, win_count: int, total_count: int) -> Decimal:
        """Calculate win rate percentage"""
        if total_count == 0:
            return Decimal("0.00")
        return Decimal(win_count * 100 / total_count).quantize(Decimal("0.01"))

    def calculate_profit_loss_ratio(self, avg_win: Decimal, avg_loss: Decimal) -> Decimal:
        """Calculate profit/loss ratio (盈亏比)"""
        if avg_loss == 0:
            return Decimal("0.00")
        return (avg_win / abs(avg_loss)).quantize(Decimal("0.01"))

    def calculate_max_drawdown(self, trade_logs: list[TradeLog]) -> Decimal:
        """
        Calculate maximum drawdown from trade logs.

        Max drawdown is the maximum peak-to-trough decline in cumulative profit/loss.
        """
        if not trade_logs:
            return Decimal("0.00")

        # Sort by trade time
        sorted_logs = sorted(
            [log for log in trade_logs if log.profit_loss is not None and log.trade_time],
            key=lambda x: x.trade_time,
        )

        if not sorted_logs:
            return Decimal("0.00")

        cumulative = Decimal("0.00")
        peak = Decimal("0.00")
        max_drawdown = Decimal("0.00")

        for log in sorted_logs:
            if log.profit_loss is not None:
                cumulative += log.profit_loss
                # Update peak if cumulative is higher
                if cumulative > peak:
                    peak = cumulative
                # Calculate drawdown from peak
                drawdown = peak - cumulative
                if drawdown > max_drawdown:
                    max_drawdown = drawdown

        return max_drawdown.quantize(Decimal("0.01"))

    def get_trade_logs_for_period(
        self,
        user_id: UUID,
        start_date: datetime,
        end_date: datetime,
    ) -> list[TradeLog]:
        """Get trade logs for a specific period"""
        result = self.db.execute(
            select(TradeLog)
            .where(TradeLog.user_id == user_id)
            .where(TradeLog.trade_time >= start_date)
            .where(TradeLog.trade_time < end_date)
            .where(TradeLog.profit_loss.isnot(None))
            .order_by(TradeLog.trade_time)
        )
        return list(result.scalars().all())

    def generate_report(
        self,
        user_id: UUID,
        period_type: ReportPeriodEnum,
        period_date: datetime,
    ) -> TradeReport:
        """
        Generate a trade report for a specific period.

        Args:
            user_id: User UUID
            period_type: Report period type (daily/weekly/monthly)
            period_date: Start date of the period

        Returns:
            TradeReport instance
        """
        # Calculate period boundaries
        if period_type == ReportPeriodEnum.DAILY:
            start_date = period_date
            end_date = period_date + timedelta(days=1)
        elif period_type == ReportPeriodEnum.WEEKLY:
            # Week starts on Monday
            start_date = period_date
            end_date = period_date + timedelta(days=7)
        else:  # MONTHLY
            # Month starts on 1st
            start_date = period_date
            # Calculate end of month
            next_month = period_date.replace(day=1) + timedelta(days=32)
            end_date = next_month.replace(day=1)

        logger.info(
            f"Generating report for user={user_id}, period={period_type.value}, "
            f"start={start_date}, end={end_date}"
        )

        # Get trade logs for the period
        trade_logs = self.get_trade_logs_for_period(user_id, start_date, end_date)

        # Calculate metrics
        trade_count = len(trade_logs)
        win_count = 0
        loss_count = 0
        total_profit = Decimal("0.00")
        total_loss = Decimal("0.00")

        for log in trade_logs:
            if log.profit_loss is not None:
                if log.profit_loss > 0:
                    win_count += 1
                    total_profit += log.profit_loss
                elif log.profit_loss < 0:
                    loss_count += 1
                    total_loss += abs(log.profit_loss)

        win_rate = self.calculate_win_rate(win_count, trade_count)
        net_profit = total_profit - total_loss
        max_drawdown = self.calculate_max_drawdown(trade_logs)

        # Check if report already exists
        existing_report = self.db.execute(
            select(TradeReport)
            .where(TradeReport.user_id == user_id)
            .where(TradeReport.period_type == period_type)
            .where(TradeReport.period_date == start_date)
        ).scalar_one_or_none()

        if existing_report:
            # Update existing report
            existing_report.trade_count = trade_count
            existing_report.win_count = win_count
            existing_report.loss_count = loss_count
            existing_report.win_rate = win_rate
            existing_report.total_profit = total_profit
            existing_report.total_loss = total_loss
            existing_report.net_profit = net_profit
            existing_report.max_drawdown = max_drawdown
            existing_report.created_at = datetime.utcnow()
            report = existing_report
            logger.info(f"Updated existing report: id={report.id}")
        else:
            # Create new report
            report = TradeReport(
                user_id=user_id,
                period_type=period_type,
                period_date=start_date,
                trade_count=trade_count,
                win_count=win_count,
                loss_count=loss_count,
                win_rate=win_rate,
                total_profit=total_profit,
                total_loss=total_loss,
                net_profit=net_profit,
                max_drawdown=max_drawdown,
            )
            self.db.add(report)
            logger.info(f"Created new report: id={report.id}")

        self.db.commit()
        self.db.refresh(report)

        logger.info(
            f"Report generated: trade_count={trade_count}, win_rate={win_rate}%, "
            f"net_profit={net_profit}, max_drawdown={max_drawdown}"
        )

        return report

    def generate_reports_for_all_users(
        self,
        period_type: ReportPeriodEnum,
        period_date: datetime,
    ) -> list[TradeReport]:
        """
        Generate reports for all active users.

        Args:
            period_type: Report period type
            period_date: Start date of the period

        Returns:
            List of generated TradeReport instances
        """
        # Get all active users
        result = self.db.execute(
            select(User).where(User.is_active.is_(True))
        )
        users = list(result.scalars().all())

        reports = []
        for user in users:
            try:
                report = self.generate_report(UUID(str(user.id)), period_type, period_date)
                reports.append(report)
            except Exception as e:
                logger.error(f"Failed to generate report for user={user.id}: {e}")

        logger.info(f"Generated {len(reports)} reports for {len(users)} users")
        return reports

    def get_period_date_for_report(self, period_type: ReportPeriodEnum) -> datetime:
        """
        Get the period start date for report generation.

        For daily: yesterday (report is generated at 0:05 for previous day)
        For weekly: previous Monday
        For monthly: previous month's 1st
        """
        now = datetime.utcnow()

        if period_type == ReportPeriodEnum.DAILY:
            # Yesterday's date
            return (now - timedelta(days=1)).replace(
                hour=0, minute=0, second=0, microsecond=0
            )
        elif period_type == ReportPeriodEnum.WEEKLY:
            # Previous Monday (if today is Monday, use last Monday)
            days_since_monday = now.weekday()
            if days_since_monday == 0:  # Today is Monday
                days_since_monday = 7
            previous_monday = now - timedelta(days=days_since_monday)
            return previous_monday.replace(
                hour=0, minute=0, second=0, microsecond=0
            )
        else:  # MONTHLY
            # Previous month's 1st
            first_of_current_month = now.replace(
                day=1, hour=0, minute=0, second=0, microsecond=0
            )
            previous_month = first_of_current_month - timedelta(days=1)
            return previous_month.replace(
                day=1, hour=0, minute=0, second=0, microsecond=0
            )
