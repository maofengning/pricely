"""
AI Support/Resistance detection service
"""

from decimal import Decimal
from typing import List, Optional
from datetime import datetime

from sqlalchemy.orm import Session

from app.models.ai import SRLevel, IntLevel
from app.models.market import Kline
from app.models.enums import LevelTypeEnum, PeriodEnum


class AIDetectionService:
    """AI detection service for support/resistance levels"""

    def __init__(self, db: Session):
        self.db = db

    def find_swing_points(self, klines: List[Kline], window: int = 5) -> List[dict]:
        """
        Identify swing high/low points
        A swing high is when the current high is higher than the surrounding highs
        A swing low is when the current low is lower than the surrounding lows
        """
        swing_points = []

        for i in range(window, len(klines) - window):
            # Check for swing high
            is_swing_high = True
            for j in range(i - window, i + window + 1):
                if j != i and klines[j].high >= klines[i].high:
                    is_swing_high = False
                    break

            if is_swing_high:
                swing_points.append({
                    'level_type': LevelTypeEnum.SWING_HIGH,
                    'price': klines[i].high,
                    'time': klines[i].time,
                    'strength': min(10, window),
                })

            # Check for swing low
            is_swing_low = True
            for j in range(i - window, i + window + 1):
                if j != i and klines[j].low <= klines[i].low:
                    is_swing_low = False
                    break

            if is_swing_low:
                swing_points.append({
                    'level_type': LevelTypeEnum.SWING_LOW,
                    'price': klines[i].low,
                    'time': klines[i].time,
                    'strength': min(10, window),
                })

        return swing_points

    def find_horizontal_levels(self, klines: List[Kline], tolerance: float = 0.02) -> List[dict]:
        """
        Find horizontal support/resistance levels
        Levels where price has touched multiple times
        """
        levels = []
        price_touches: dict[float, int] = {}

        for kline in klines:
            # Round price to significant levels
            for price in [kline.high, kline.low]:
                # Cluster prices within tolerance
                found = False
                for level_price in price_touches.keys():
                    if abs(float(price) - level_price) / level_price <= tolerance:
                        price_touches[level_price] += 1
                        found = True
                        break

                if not found:
                    price_touches[float(price)] = 1

        # Convert to levels with multiple touches
        for price, touches in price_touches.items():
            if touches >= 2:  # At least 2 touches
                # Determine if support or resistance
                current_price = float(klines[-1].close) if klines else price
                level_type = LevelTypeEnum.SUPPORT if price < current_price else LevelTypeEnum.RESISTANCE

                levels.append({
                    'level_type': level_type,
                    'price': Decimal(str(price)),
                    'strength': min(10, touches * 2),
                })

        return levels

    def find_integer_levels(self, klines: List[Kline]) -> List[dict]:
        """
        Find integer level support/resistance (10, 15, 20, etc.)
        """
        levels = []
        integer_levels: dict[float, int] = {}

        for kline in klines:
            # Check for integer levels near high and low
            for price in [float(kline.high), float(kline.low)]:
                # Find nearest integer level (multiples of 5 or 10)
                int_level = round(price / 5) * 5

                if int_level > 0:
                    if int_level not in integer_levels:
                        integer_levels[int_level] = 0
                    integer_levels[int_level] += 1

        # Convert to levels
        for price, touches in integer_levels.items():
            if touches >= 2:
                current_price = float(klines[-1].close) if klines else price
                level_type = LevelTypeEnum.SUPPORT if price < current_price else LevelTypeEnum.RESISTANCE

                levels.append({
                    'level_type': level_type,
                    'price': Decimal(str(price)),
                    'strength': min(10, touches),
                })

        return levels

    def detect_support_resistance(
        self,
        stock_code: str,
        period: PeriodEnum,
        window: int = 5,
    ) -> List[SRLevel]:
        """
        Main method to detect support/resistance levels
        """
        # Get K-line data
        klines = (
            self.db.query(Kline)
            .filter(Kline.stock_code == stock_code, Kline.period == period.value)
            .order_by(Kline.time.desc())
            .limit(200)
            .all()
        )

        if not klines:
            return []

        klines = list(reversed(klines))  # Sort by time ascending

        levels = []

        # Find swing points
        swing_points = self.find_swing_points(klines, window)
        for sp in swing_points:
            levels.append(SRLevel(
                stock_code=stock_code,
                period=period,
                level_type=sp['level_type'],
                level_price=sp['price'],
                strength=sp['strength'],
                is_ai_detected=True,
                is_user_corrected=False,
            ))

        # Find horizontal levels
        horizontal_levels = self.find_horizontal_levels(klines)
        for hl in horizontal_levels:
            levels.append(SRLevel(
                stock_code=stock_code,
                period=period,
                level_type=hl['level_type'],
                level_price=hl['price'],
                strength=hl['strength'],
                is_ai_detected=True,
                is_user_corrected=False,
            ))

        # Find integer levels
        int_levels = self.find_integer_levels(klines)
        for il in int_levels:
            # Also create IntLevel records
            int_level = IntLevel(
                stock_code=stock_code,
                period=period,
                level_price=il['price'],
                level_type=il['level_type'],
                touches_count=il['strength'],
            )
            self.db.add(int_level)

            levels.append(SRLevel(
                stock_code=stock_code,
                period=period,
                level_type=il['level_type'],
                level_price=il['price'],
                strength=il['strength'],
                is_ai_detected=True,
                is_user_corrected=False,
            ))

        # Save to database
        for level in levels:
            self.db.add(level)

        self.db.commit()

        return levels

    def get_integer_levels(self, stock_code: str, period: PeriodEnum) -> List[IntLevel]:
        """Get integer levels for a stock"""
        return (
            self.db.query(IntLevel)
            .filter(IntLevel.stock_code == stock_code, IntLevel.period == period)
            .order_by(IntLevel.touches_count.desc())
            .limit(10)
            .all()
        )

    def correct_level(
        self,
        level_id: str,
        corrected_price: Optional[Decimal] = None,
        action: str = "update",
        user_id: Optional[str] = None,
    ) -> Optional[SRLevel]:
        """User correction for detected level"""
        from uuid import UUID

        level = self.db.query(SRLevel).filter(SRLevel.id == UUID(level_id)).first()
        if not level:
            return None

        if action == "update" and corrected_price:
            level.level_price = corrected_price
            level.is_user_corrected = True
            if user_id:
                level.user_id = UUID(user_id)
        elif action == "delete":
            self.db.delete(level)
            self.db.commit()
            return None

        self.db.commit()
        return level