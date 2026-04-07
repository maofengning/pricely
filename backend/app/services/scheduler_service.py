"""
Scheduler service for scheduled report generation

Uses APScheduler for cron-based scheduling:
- Daily report: Every day at 0:05 AM
- Weekly report: Every Monday at 0:05 AM
- Monthly report: Every 1st of month at 0:05 AM
"""

from typing import Any

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from loguru import logger

from app.core.database import SessionLocal
from app.models.enums import ReportPeriodEnum
from app.services.report_service import ReportService


class SchedulerService:
    """Service for managing scheduled report generation"""

    def __init__(self) -> None:
        self.scheduler = BackgroundScheduler()
        self._initialized = False

    def _generate_daily_reports(self) -> None:
        """Generate daily reports for all users"""
        logger.info("Starting daily report generation job")
        db = SessionLocal()
        try:
            service = ReportService(db)
            period_date = service.get_period_date_for_report(ReportPeriodEnum.DAILY)
            service.generate_reports_for_all_users(ReportPeriodEnum.DAILY, period_date)
        except Exception as e:
            logger.error(f"Daily report generation failed: {e}")
        finally:
            db.close()
        logger.info("Daily report generation job completed")

    def _generate_weekly_reports(self) -> None:
        """Generate weekly reports for all users"""
        logger.info("Starting weekly report generation job")
        db = SessionLocal()
        try:
            service = ReportService(db)
            period_date = service.get_period_date_for_report(ReportPeriodEnum.WEEKLY)
            service.generate_reports_for_all_users(ReportPeriodEnum.WEEKLY, period_date)
        except Exception as e:
            logger.error(f"Weekly report generation failed: {e}")
        finally:
            db.close()
        logger.info("Weekly report generation job completed")

    def _generate_monthly_reports(self) -> None:
        """Generate monthly reports for all users"""
        logger.info("Starting monthly report generation job")
        db = SessionLocal()
        try:
            service = ReportService(db)
            period_date = service.get_period_date_for_report(ReportPeriodEnum.MONTHLY)
            service.generate_reports_for_all_users(ReportPeriodEnum.MONTHLY, period_date)
        except Exception as e:
            logger.error(f"Monthly report generation failed: {e}")
        finally:
            db.close()
        logger.info("Monthly report generation job completed")

    def setup_jobs(self) -> None:
        """Setup all scheduled jobs"""
        if self._initialized:
            logger.warning("Scheduler already initialized, skipping setup")
            return

        # Daily report: Every day at 0:05 AM
        self.scheduler.add_job(
            self._generate_daily_reports,
            CronTrigger(hour=0, minute=5),
            id="daily_report",
            name="Daily Trade Report Generation",
            replace_existing=True,
        )
        logger.info("Added daily report job: runs at 0:05 AM every day")

        # Weekly report: Every Monday at 0:05 AM
        self.scheduler.add_job(
            self._generate_weekly_reports,
            CronTrigger(day_of_week="mon", hour=0, minute=5),
            id="weekly_report",
            name="Weekly Trade Report Generation",
            replace_existing=True,
        )
        logger.info("Added weekly report job: runs at 0:05 AM every Monday")

        # Monthly report: Every 1st of month at 0:05 AM
        self.scheduler.add_job(
            self._generate_monthly_reports,
            CronTrigger(day=1, hour=0, minute=5),
            id="monthly_report",
            name="Monthly Trade Report Generation",
            replace_existing=True,
        )
        logger.info("Added monthly report job: runs at 0:05 AM on 1st of each month")

        self._initialized = True

    def start(self) -> None:
        """Start the scheduler"""
        if not self._initialized:
            self.setup_jobs()

        self.scheduler.start()
        logger.info("Scheduler started")

    def stop(self) -> None:
        """Stop the scheduler"""
        if self.scheduler.running:
            self.scheduler.shutdown()
            logger.info("Scheduler stopped")

    def get_jobs(self) -> list[dict[str, Any]]:
        """Get all scheduled jobs info"""
        jobs: list[dict[str, Any]] = []
        for job in self.scheduler.get_jobs():
            jobs.append({
                "id": job.id,
                "name": job.name,
                "next_run": str(job.next_run_time) if job.next_run_time else None,
                "trigger": str(job.trigger),
            })
        return jobs


# Global scheduler instance
scheduler_service = SchedulerService()
