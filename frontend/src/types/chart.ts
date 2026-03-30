// Chart-related types
export interface KlineData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export type Period = '1min' | '5min' | '15min' | '60min' | 'daily' | 'weekly' | 'monthly';

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