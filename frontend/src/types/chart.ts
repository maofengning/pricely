// Chart-related types
export interface KlineData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

// 7 periods: 1min, 5min, 15min, 30min, 1h, 4h, 1d
export type Period = '1min' | '5min' | '15min' | '30min' | '1h' | '4h' | '1d';

// Period display labels
export const PERIOD_LABELS: Record<Period, string> = {
  '1min': '1分钟',
  '5min': '5分钟',
  '15min': '15分钟',
  '30min': '30分钟',
  '1h': '1小时',
  '4h': '4小时',
  '1d': '日线',
};

// Default periods for multi-period panel
export const DEFAULT_PERIODS: Period[] = ['1min', '5min', '15min', '30min', '1h', '4h', '1d'];

// Grid layout configuration
export type GridLayout = '1x1' | '2x2' | '2x3' | '3x3';

export interface GridLayoutConfig {
  cols: number;
  rows: number;
  maxCharts: number;
}

export const GRID_LAYOUTS: Record<GridLayout, GridLayoutConfig> = {
  '1x1': { cols: 1, rows: 1, maxCharts: 1 },
  '2x2': { cols: 2, rows: 2, maxCharts: 4 },
  '2x3': { cols: 3, rows: 2, maxCharts: 6 },
  '3x3': { cols: 3, rows: 3, maxCharts: 9 },
};

export interface ChartStyle {
  upColor: string;
  downColor: string;
  wickUpColor: string;
  wickDownColor: string;
  borderUpColor: string;
  borderDownColor: string;
}

export interface SupportResistanceLevel {
  id: string;
  price: number;
  levelType: 'support' | 'resistance' | 'trendline' | 'channel' | 'swing_high' | 'swing_low';
  strength: number;
  isAiDetected: boolean;
}