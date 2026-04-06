/**
 * Math utilities for drawing tools
 * Fibonacci calculations and geometry helpers
 */

import {
  FIBONACCI_RETRACEMENT_LEVELS,
  FIBONACCI_EXTENSION_LEVELS,
} from '@/types/drawing';
import type {
  Drawing,
  DrawingToolType,
  DrawingPoint,
  HorizontalLineDrawing,
  TrendLineDrawing,
  ParallelChannelDrawing,
  FibonacciRetracementDrawing,
  FibonacciExtensionDrawing,
} from '@/types/drawing';

/**
 * Calculate Fibonacci retracement levels from two price points
 * @param highPrice - The high price point (100% level)
 * @param lowPrice - The low price point (0% level)
 * @returns Map of level name to price value
 */
export function calculateFibonacciRetracement(
  highPrice: number,
  lowPrice: number
): Record<string, number> {
  const levels: Record<string, number> = {};
  const range = highPrice - lowPrice;

  for (const level of FIBONACCI_RETRACEMENT_LEVELS) {
    // For retracement, 0% is at low price, 100% is at high price
    // Levels are calculated from the high price downward
    levels[level.toString()] = highPrice - range * level;
  }

  return levels;
}

/**
 * Calculate Fibonacci extension levels from three price points
 * @param swingHigh - First swing high
 * @param swingLow - Swing low after the high
 * @param extensionHigh - Extension high (third point)
 * @returns Map of level name to price value
 */
export function calculateFibonacciExtension(
  swingHigh: number,
  swingLow: number,
  extensionHigh: number
): Record<string, number> {
  const levels: Record<string, number> = {};
  const range = swingHigh - swingLow;

  // Extensions start from the extension high
  for (const level of FIBONACCI_EXTENSION_LEVELS) {
    levels[level.toString()] = extensionHigh + range * (level - 1);
  }

  return levels;
}

/**
 * Calculate the price at a given Fibonacci level
 * @param price1 - First price point
 * @param price2 - Second price point
 * @param fibLevel - Fibonacci level (0.236, 0.382, etc.)
 * @returns Calculated price at the Fibonacci level
 */
export function calculateFibLevelPrice(
  price1: number,
  price2: number,
  fibLevel: number
): number {
  const range = Math.abs(price1 - price2);
  const direction = price1 > price2 ? -1 : 1;
  return price1 + direction * range * fibLevel;
}

/**
 * Calculate slope of a line between two points
 * @param p1 - First point
 * @param p2 - Second point
 * @returns Slope (price change per time unit)
 */
export function calculateSlope(
  p1: { time: number; price: number },
  p2: { time: number; price: number }
): number {
  const timeDiff = p2.time - p1.time;
  if (timeDiff === 0) return 0;
  return (p2.price - p1.price) / timeDiff;
}

/**
 * Calculate price at a given time on a trend line
 * @param startPoint - Starting point of the line
 * @param slope - Line slope
 * @param time - Time to calculate price at
 * @returns Price at the given time
 */
export function calculateTrendLinePrice(
  startPoint: { time: number; price: number },
  slope: number,
  time: number
): number {
  return startPoint.price + slope * (time - startPoint.time);
}

/**
 * Calculate parallel line price offset
 * @param slope - Line slope
 * @param offsetPercent - Offset percentage of price range
 * @returns Price offset for parallel line
 */
export function calculateParallelOffset(
  slope: number,
  offsetPercent: number
): number {
  return slope * offsetPercent;
}

/**
 * Check if a price is near a level within tolerance
 * @param price - Price to check
 * @param levelPrice - Level price
 * @param tolerancePercent - Tolerance as percentage (default 1%)
 * @returns Whether price is near the level
 */
export function isPriceNearLevel(
  price: number,
  levelPrice: number,
  tolerancePercent: number = 1
): boolean {
  const diff = Math.abs(price - levelPrice);
  const tolerance = levelPrice * (tolerancePercent / 100);
  return diff <= tolerance;
}

/**
 * Generate unique ID for drawings
 * @returns Unique string ID
 */
export function generateDrawingId(): string {
  return `drawing_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Determine trend direction from two points
 * @param p1 - First point
 * @param p2 - Second point
 * @returns 'up' or 'down'
 */
export function determineTrendDirection(
  p1: { time: number; price: number },
  p2: { time: number; price: number }
): 'up' | 'down' {
  return p2.price > p1.price ? 'up' : 'down';
}

/**
 * Calculate distance between two points
 * @param p1 - First point
 * @param p2 - Second point
 * @returns Euclidean distance
 */
export function calculateDistance(
  p1: { time: number; price: number },
  p2: { time: number; price: number }
): number {
  const timeDiff = p2.time - p1.time;
  const priceDiff = p2.price - p1.price;
  return Math.sqrt(timeDiff * timeDiff + priceDiff * priceDiff);
}

/**
 * Get required number of points for each drawing tool
 * @param tool - Drawing tool type
 * @returns Number of points required
 */
export function getRequiredPointsForTool(tool: DrawingToolType): number {
  switch (tool) {
    case 'horizontal_line':
      return 1; // Single price point
    case 'trend_line':
      return 2; // Start and end points
    case 'parallel_channel':
      return 3; // Main line (2 points) + offset point
    case 'fibonacci_retracement':
      return 2; // High and low points
    case 'fibonacci_extension':
      return 3; // Swing high, swing low, extension point
    default:
      return 2;
  }
}

/**
 * Create drawing object from collected points
 * @param points - Collected drawing points
 * @param tool - Drawing tool type
 * @param stockCode - Stock code
 * @param period - Time period
 * @returns Drawing object or null if not enough points
 */
export function createDrawingFromPoints(
  points: DrawingPoint[],
  tool: DrawingToolType,
  stockCode: string,
  period: string
): Drawing | null {
  const now = new Date().toISOString();
  const id = generateDrawingId();

  if (points.length < 1) return null;

  switch (tool) {
    case 'horizontal_line': {
      const price = points[0].price;
      return {
        id,
        toolType: 'horizontal_line',
        stockCode,
        period,
        price,
        levelType: 'support', // Default, user can edit
        isAiDetected: false,
        createdAt: now,
        updatedAt: now,
      } as HorizontalLineDrawing;
    }

    case 'trend_line': {
      if (points.length < 2) return null;
      return {
        id,
        toolType: 'trend_line',
        stockCode,
        period,
        startPoint: points[0],
        endPoint: points[1],
        trendType: determineTrendDirection(points[0], points[1]),
        createdAt: now,
        updatedAt: now,
      } as TrendLineDrawing;
    }

    case 'parallel_channel': {
      if (points.length < 3) return null;
      const channelSlope = calculateSlope(points[0], points[1]);
      return {
        id,
        toolType: 'parallel_channel',
        stockCode,
        period,
        mainLineStart: points[0],
        mainLineEnd: points[1],
        parallelLineOffset:
          points[2].price -
          points[0].price -
          channelSlope * (points[2].time - points[0].time),
        channelType: determineTrendDirection(points[0], points[1]),
        createdAt: now,
        updatedAt: now,
      } as ParallelChannelDrawing;
    }

    case 'fibonacci_retracement': {
      if (points.length < 2) return null;
      const highPrice = Math.max(points[0].price, points[1].price);
      const lowPrice = Math.min(points[0].price, points[1].price);
      return {
        id,
        toolType: 'fibonacci_retracement',
        stockCode,
        period,
        startPoint: { time: points[0].time, price: highPrice },
        endPoint: { time: points[1].time, price: lowPrice },
        levels: calculateFibonacciRetracement(highPrice, lowPrice),
        createdAt: now,
        updatedAt: now,
      } as FibonacciRetracementDrawing;
    }

    case 'fibonacci_extension': {
      if (points.length < 3) return null;
      return {
        id,
        toolType: 'fibonacci_extension',
        stockCode,
        period,
        startPoint: points[0],
        endPoint: points[1],
        extensionPoint: points[2],
        levels: calculateFibonacciExtension(
          points[0].price,
          points[1].price,
          points[2].price
        ),
        createdAt: now,
        updatedAt: now,
      } as FibonacciExtensionDrawing;
    }

    default:
      return null;
  }
}

/**
 * Get tool display label in Chinese
 * @param tool - Drawing tool type
 * @returns Chinese label for the tool
 */
export function getToolLabel(tool: DrawingToolType): string {
  switch (tool) {
    case 'horizontal_line':
      return '水平线';
    case 'trend_line':
      return '趋势线';
    case 'parallel_channel':
      return '平行通道';
    case 'fibonacci_retracement':
      return '斐波那契回撤';
    case 'fibonacci_extension':
      return '斐波那契扩展';
    default:
      return '未知工具';
  }
}