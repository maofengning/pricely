// Trade log types - aligned with backend API

import { type Period } from './chart';

// Pattern type from backend PatternEnum
export type LogPatternType =
  | 'head_and_shoulders_top'
  | 'head_and_shoulders_bottom'
  | 'double_top'
  | 'double_bottom'
  | 'triple_top'
  | 'triple_bottom'
  | 'triangle'
  | 'flag';

// Pattern type display names in Chinese
export const LOG_PATTERN_TYPE_LABELS: Record<LogPatternType, string> = {
  head_and_shoulders_top: '头肩顶',
  head_and_shoulders_bottom: '头肩底',
  double_top: '双顶',
  double_bottom: '双底',
  triple_top: '三重顶',
  triple_bottom: '三重底',
  triangle: '三角形',
  flag: '旗形',
};

export interface TradeLog {
  id: string;
  stockCode: string;
  stockName?: string;
  period: Period;
  patternType?: LogPatternType;
  entryPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  exitPrice?: number;
  quantity: number;
  profitLoss?: number;
  notes?: string;
  tags: string[];
  tradeTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TradeLogCreate {
  stockCode: string;
  stockName?: string;
  period: Period;
  patternType?: LogPatternType;
  entryPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  exitPrice?: number;
  quantity: number;
  profitLoss?: number;
  notes?: string;
  tags?: string[];
  tradeTime?: string;
}

export interface TradeLogUpdate {
  stockCode?: string;
  stockName?: string;
  period?: Period;
  patternType?: LogPatternType;
  entryPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  exitPrice?: number;
  quantity?: number;
  profitLoss?: number;
  notes?: string;
  tags?: string[];
  tradeTime?: string;
}

export interface TradeLogQuery {
  stockCode?: string;
  tags?: string[];
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export interface TradeLogListResponse {
  items: TradeLog[];
  total: number;
  page: number;
  pageSize: number;
}
