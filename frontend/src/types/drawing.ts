// Drawing tools types for Support/Resistance and Fibonacci

export type DrawingToolType =
  | 'horizontal_line'
  | 'trend_line'
  | 'parallel_channel'
  | 'fibonacci_retracement'
  | 'fibonacci_extension';

export type DrawingToolMode = 'idle' | 'drawing' | 'editing' | 'selected';

export interface DrawingPoint {
  time: number;
  price: number;
}

export interface BaseDrawing {
  id: string;
  toolType: DrawingToolType;
  stockCode: string;
  period: string;
  createdAt: string;
  updatedAt: string;
}

export interface HorizontalLineDrawing extends BaseDrawing {
  toolType: 'horizontal_line';
  price: number;
  levelType: 'support' | 'resistance';
  strength?: number;
  isAiDetected: boolean;
}

export interface TrendLineDrawing extends BaseDrawing {
  toolType: 'trend_line';
  startPoint: DrawingPoint;
  endPoint: DrawingPoint;
  trendType: 'up' | 'down';
}

export interface ParallelChannelDrawing extends BaseDrawing {
  toolType: 'parallel_channel';
  mainLineStart: DrawingPoint;
  mainLineEnd: DrawingPoint;
  parallelLineOffset: number; // Price offset for parallel line
  channelType: 'up' | 'down';
}

export interface FibonacciRetracementDrawing extends BaseDrawing {
  toolType: 'fibonacci_retracement';
  startPoint: DrawingPoint;
  endPoint: DrawingPoint;
  levels: Record<string, number>; // e.g., { '0': price, '0.236': price, ... }
}

export interface FibonacciExtensionDrawing extends BaseDrawing {
  toolType: 'fibonacci_extension';
  startPoint: DrawingPoint;
  endPoint: DrawingPoint;
  extensionPoint: DrawingPoint; // Third point for extension
  levels: Record<string, number>;
}

export type Drawing =
  | HorizontalLineDrawing
  | TrendLineDrawing
  | ParallelChannelDrawing
  | FibonacciRetracementDrawing
  | FibonacciExtensionDrawing;

export interface SRLevelFromAPI {
  price: number;
  levelType: 'support' | 'resistance';
  strength: number;
  touches?: number;
}

export interface SRDetectionResponse {
  stockCode: string;
  period: string;
  supportLevels: SRLevelFromAPI[];
  resistanceLevels: SRLevelFromAPI[];
}

// Standard Fibonacci levels
export const FIBONACCI_RETRACEMENT_LEVELS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
export const FIBONACCI_EXTENSION_LEVELS = [0, 0.236, 0.382, 0.5, 0.618, 1, 1.236, 1.382, 1.5, 1.618, 2];