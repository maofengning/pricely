// Pattern annotation types - aligned with backend API

import { type Period } from './chart';

export type PatternType =
  | 'pin_bar'
  | 'engulfing'
  | 'evening_star'
  | 'morning_star'
  | 'doji'
  | 'head_shoulders_top'
  | 'head_shoulders_bottom';

// Re-export Period from chart types for external use
export { type Period };

// Pattern type display names in Chinese
export const PATTERN_TYPE_LABELS: Record<PatternType, string> = {
  pin_bar: 'Pin Bar',
  engulfing: '吞没形态',
  evening_star: '黄昏之星',
  morning_star: '启明星',
  doji: '十字星',
  head_shoulders_top: '头肩顶',
  head_shoulders_bottom: '头肩底',
};

// Pattern type colors for markers
export const PATTERN_TYPE_COLORS: Record<PatternType, string> = {
  pin_bar: '#2962ff',
  engulfing: '#9c27b0',
  evening_star: '#ef5350',
  morning_star: '#26a69a',
  doji: '#ff9800',
  head_shoulders_top: '#ef5350',
  head_shoulders_bottom: '#26a69a',
};

export interface Pattern {
  id: string;
  stockCode: string;
  period: Period;
  patternType: PatternType;
  startTime: string;
  endTime: string;
  startPrice: number | null;
  endPrice: number | null;
  description: string | null;
  isValid: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PatternCreate {
  stockCode: string;
  period: Period;
  patternType: PatternType;
  startTime: string;
  endTime: string;
  startPrice?: number | null;
  endPrice?: number | null;
  description?: string;
}

export interface PatternUpdate {
  patternType?: PatternType;
  startTime?: string;
  endTime?: string;
  startPrice?: number | null;
  endPrice?: number | null;
  description?: string;
  isValid?: boolean;
}

export interface PatternQuery {
  stockCode?: string;
  period?: Period;
  patternType?: PatternType;
}

// Marker shape types for lightweight-charts
export type MarkerShape = 'circle' | 'square' | 'arrowUp' | 'arrowDown';

// Pattern marker for chart display
export interface PatternMarkerData {
  id: string;
  time: number;
  position: 'aboveBar' | 'belowBar';
  color: string;
  shape: MarkerShape;
  text: string;
}