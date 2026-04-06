"""
Support/Resistance level detection algorithm

This module implements a rule-based algorithm for detecting support and resistance
levels from K-line data. It uses:
1. Local extrema detection for swing points
2. Price clustering for grouping similar levels
3. Strength scoring based on touches and recency
"""

from dataclasses import dataclass
from decimal import Decimal
from typing import Any

import numpy as np
from loguru import logger
from numpy.typing import NDArray


@dataclass
class SwingPoint:
    """Represents a swing high or swing low point"""

    index: int
    price: float
    time: float  # Timestamp as float for comparison
    point_type: str  # 'high' or 'low'
    strength: int = 5  # Initial strength based on window size


@dataclass
class SRLevel:
    """Represents a support or resistance level"""

    price: float
    level_type: str  # 'support' or 'resistance'
    touches: int
    strength: int  # 1-10 score
    first_touch_time: float
    last_touch_time: float
    sources: list[SwingPoint]  # Swing points that contributed


class SRAlgorithm:
    """
    Support/Resistance detection algorithm

    Uses a combination of:
    - Local extrema detection (swing highs and lows)
    - Price clustering (grouping nearby levels)
    - Touch counting (frequency of price near level)
    """

    def __init__(
        self,
        swing_window: int = 5,
        cluster_tolerance: float = 0.015,
        min_touches: int = 2,
        max_levels: int = 10,
    ) -> None:
        """
        Initialize algorithm parameters

        Args:
            swing_window: Number of candles on each side to determine swing point
            cluster_tolerance: Percentage tolerance for clustering (e.g., 0.015 = 1.5%)
            min_touches: Minimum touches required for a valid level
            max_levels: Maximum number of levels to return per type
        """
        self.swing_window = swing_window
        self.cluster_tolerance = cluster_tolerance
        self.min_touches = min_touches
        self.max_levels = max_levels

    def detect_swing_points(
        self,
        highs: NDArray[np.float64],
        lows: NDArray[np.float64],
        times: NDArray[np.float64] | None = None,
    ) -> list[SwingPoint]:
        """
        Detect local high and low points (swing points)

        A swing high is when the current high is higher than all highs in the window
        A swing low is when the current low is lower than all lows in the window

        Args:
            highs: Array of high prices
            lows: Array of low prices
            times: Array of timestamps (optional, uses indices if not provided)

        Returns:
            List of SwingPoint objects
        """
        n = len(highs)
        if n < 2 * self.swing_window + 1:
            logger.warning(f"Not enough data for swing detection: {n} points")
            return []

        swing_points: list[SwingPoint] = []
        window = self.swing_window

        times_array = np.arange(n, dtype=np.float64) if times is None else times.astype(np.float64)

        for i in range(window, n - window):
            # Check for swing high
            left_highs = highs[i - window:i]
            right_highs = highs[i + 1:i + window + 1]
            current_high = highs[i]

            is_swing_high = (
                np.all(current_high > left_highs)
                and np.all(current_high > right_highs)
            )

            if is_swing_high:
                strength = self._calculate_swing_strength(
                    left_highs, right_highs, current_high
                )
                swing_points.append(
                    SwingPoint(
                        index=i,
                        price=float(current_high),
                        time=float(times_array[i]),
                        point_type="high",
                        strength=strength,
                    )
                )

            # Check for swing low
            left_lows = lows[i - window:i]
            right_lows = lows[i + 1:i + window + 1]
            current_low = lows[i]

            is_swing_low = (
                np.all(current_low < left_lows)
                and np.all(current_low < right_lows)
            )

            if is_swing_low:
                strength = self._calculate_swing_strength(
                    left_lows, right_lows, current_low, is_low=True
                )
                swing_points.append(
                    SwingPoint(
                        index=i,
                        price=float(current_low),
                        time=float(times_array[i]),
                        point_type="low",
                        strength=strength,
                    )
                )

        logger.debug(f"Detected {len(swing_points)} swing points")
        return swing_points

    def _calculate_swing_strength(
        self,
        left_prices: NDArray[np.float64],
        right_prices: NDArray[np.float64],
        current_price: np.float64,
        is_low: bool = False,
    ) -> int:
        """
        Calculate strength of a swing point based on how much it stands out

        Args:
            left_prices: Prices on the left side
            right_prices: Prices on the right side
            current_price: Current swing point price
            is_low: True if calculating for a swing low

        Returns:
            Strength score (1-10)
        """
        if is_low:
            # For swing low, measure how much lower it is
            avg_left = np.mean(left_prices)
            avg_right = np.mean(right_prices)
            diff_left = (avg_left - current_price) / avg_left
            diff_right = (avg_right - current_price) / avg_right
            prominence = (diff_left + diff_right) / 2
        else:
            # For swing high, measure how much higher it is
            avg_left = np.mean(left_prices)
            avg_right = np.mean(right_prices)
            diff_left = (current_price - avg_left) / avg_left
            diff_right = (current_price - avg_right) / avg_right
            prominence = (diff_left + diff_right) / 2

        # Scale prominence to 1-10 (prominence of 5% gives max strength)
        strength = min(10, max(1, int(prominence * 200)))
        return strength

    def cluster_levels(
        self,
        swing_points: list[SwingPoint],
        closes: NDArray[np.float64],
        times: NDArray[np.float64] | None = None,
    ) -> list[SRLevel]:
        """
        Cluster swing points into support/resistance levels

        Groups swing points that are within tolerance percentage of each other
        and counts touches from K-line closes

        Args:
            swing_points: List of detected swing points
            closes: Array of close prices
            times: Array of timestamps

        Returns:
            List of SRLevel objects
        """
        if not swing_points:
            return []

        n = len(closes)
        times_array = np.arange(n, dtype=np.float64) if times is None else times.astype(np.float64)

        current_price = float(closes[-1])

        # Separate highs and lows
        high_points = [sp for sp in swing_points if sp.point_type == "high"]
        low_points = [sp for sp in swing_points if sp.point_type == "low"]

        # Cluster high points into resistance levels
        resistance_levels = self._cluster_by_price(
            high_points, closes, times_array, current_price, "resistance"
        )

        # Cluster low points into support levels
        support_levels = self._cluster_by_price(
            low_points, closes, times_array, current_price, "support"
        )

        # Combine and sort by strength
        all_levels = support_levels + resistance_levels
        all_levels.sort(key=lambda x: x.strength, reverse=True)

        # Limit number of levels
        support_levels = [
            level for level in all_levels if level.level_type == "support"
        ][:self.max_levels]
        resistance_levels = [
            level for level in all_levels if level.level_type == "resistance"
        ][:self.max_levels]

        logger.debug(
            f"Found {len(support_levels)} support levels, "
            f"{len(resistance_levels)} resistance levels"
        )

        return support_levels + resistance_levels

    def _cluster_by_price(
        self,
        points: list[SwingPoint],
        closes: NDArray[np.float64],
        times: NDArray[np.float64],
        current_price: float,
        level_type: str,
    ) -> list[SRLevel]:
        """
        Cluster swing points by price proximity

        Args:
            points: List of swing points to cluster
            closes: Array of close prices
            times: Array of timestamps
            current_price: Current price for determining level type
            level_type: 'support' or 'resistance'

        Returns:
            List of clustered SRLevel objects
        """
        if not points:
            return []

        # Sort points by price
        sorted_points = sorted(points, key=lambda x: x.price)
        clusters: list[list[SwingPoint]] = []
        current_cluster: list[SwingPoint] = []

        for point in sorted_points:
            if not current_cluster:
                current_cluster.append(point)
            else:
                # Check if point is within tolerance of cluster average
                cluster_avg = np.mean([p.price for p in current_cluster])
                tolerance = cluster_avg * self.cluster_tolerance

                if abs(point.price - cluster_avg) <= tolerance:
                    current_cluster.append(point)
                else:
                    # Start new cluster
                    clusters.append(current_cluster)
                    current_cluster = [point]

        # Add last cluster
        if current_cluster:
            clusters.append(current_cluster)

        # Convert clusters to SRLevels
        levels: list[SRLevel] = []
        for cluster in clusters:
            # Calculate cluster statistics
            cluster_prices = [p.price for p in cluster]
            avg_price = float(np.mean(cluster_prices))

            # Count touches from closes
            touches = self._count_touches(avg_price, closes)

            if touches < self.min_touches:
                continue

            # Determine level type based on current price
            actual_type = "support" if avg_price < current_price else "resistance"

            # Calculate strength
            strength = self._calculate_level_strength(
                cluster, touches, avg_price, current_price
            )

            # Get first and last touch times
            first_touch = min(p.time for p in cluster)
            last_touch = max(p.time for p in cluster)

            levels.append(
                SRLevel(
                    price=avg_price,
                    level_type=actual_type,
                    touches=touches,
                    strength=strength,
                    first_touch_time=first_touch,
                    last_touch_time=last_touch,
                    sources=cluster,
                )
            )

        return levels

    def _count_touches(
        self,
        level_price: float,
        closes: NDArray[np.float64],
    ) -> int:
        """
        Count how many times price touched near a level

        A touch is when close is within tolerance of the level

        Args:
            level_price: The level price
            closes: Array of close prices

        Returns:
            Number of touches
        """
        tolerance = level_price * self.cluster_tolerance
        touches = int(np.sum(np.abs(closes - level_price) <= tolerance))
        return max(touches, len(closes) // 50)  # Minimum touches based on data length

    def _calculate_level_strength(
        self,
        cluster: list[SwingPoint],
        touches: int,
        level_price: float,
        current_price: float,
    ) -> int:
        """
        Calculate strength score for a level (1-10)

        Factors:
        - Number of swing points contributing
        - Number of touches
        - Distance from current price (closer = stronger)
        - Swing point strengths

        Args:
            cluster: List of swing points in the cluster
            touches: Number of price touches
            level_price: The level price
            current_price: Current market price

        Returns:
            Strength score (1-10)
        """
        # Base strength from number of sources
        source_strength = min(3, len(cluster))

        # Touch strength (max 3)
        touch_strength = min(3, touches // 2)

        # Distance factor (closer levels are more relevant)
        distance_pct = abs(level_price - current_price) / current_price
        distance_strength = max(1, 4 - int(distance_pct * 50))  # 0.08% = 4, 0.16% = 1

        # Swing point average strength (max 2)
        avg_swing_strength = np.mean([s.strength for s in cluster]) / 5
        swing_strength = min(2, int(avg_swing_strength))

        # Total strength (max 10)
        total_strength = min(
            10, source_strength + touch_strength + distance_strength + swing_strength
        )

        return max(1, total_strength)

    def detect(
        self,
        highs: NDArray[np.float64],
        lows: NDArray[np.float64],
        closes: NDArray[np.float64],
        times: NDArray[np.float64] | None = None,
    ) -> list[SRLevel]:
        """
        Main detection method - detect support/resistance levels from K-line data

        Args:
            highs: Array of high prices
            lows: Array of low prices
            closes: Array of close prices
            times: Array of timestamps (optional)

        Returns:
            List of SRLevel objects sorted by strength
        """
        # Validate inputs
        n = len(highs)
        if n < 50:
            logger.warning(f"Insufficient data for SR detection: {n} candles")
            return []

        if len(lows) != n or len(closes) != n:
            raise ValueError("Highs, lows, and closes must have same length")

        # Step 1: Detect swing points
        swing_points = self.detect_swing_points(highs, lows, times)

        # Step 2: Cluster into levels
        levels = self.cluster_levels(swing_points, closes, times)

        logger.info(f"Detected {len(levels)} support/resistance levels")
        return levels


def convert_klines_to_arrays(
    klines: list[Any],
) -> tuple[
    NDArray[np.float64],
    NDArray[np.float64],
    NDArray[np.float64],
    NDArray[np.float64],
]:
    """
    Convert Kline objects to numpy arrays for algorithm processing

    Args:
        klines: List of Kline model objects

    Returns:
        Tuple of (highs, lows, closes, times) arrays
    """
    n = len(klines)
    highs = np.zeros(n, dtype=np.float64)
    lows = np.zeros(n, dtype=np.float64)
    closes = np.zeros(n, dtype=np.float64)
    times = np.zeros(n, dtype=np.float64)

    for i, kline in enumerate(klines):
        highs[i] = float(kline.high)
        lows[i] = float(kline.low)
        closes[i] = float(kline.close)
        # Convert datetime to timestamp
        times[i] = (
            kline.time.timestamp()
            if hasattr(kline.time, "timestamp")
            else float(kline.time)
        )

    return highs, lows, closes, times


def format_level_for_response(level: SRLevel) -> dict[str, Any]:
    """
    Format SRLevel dataclass for API response

    Args:
        level: SRLevel object

    Returns:
        Dictionary with formatted data compatible with SRLegacyItem schema
    """
    return {
        "price": Decimal(str(round(level.price, 4))),
        "levelType": level.level_type,  # Use camelCase for schema compatibility
        "strength": level.strength,
        "touches": level.touches,
    }
