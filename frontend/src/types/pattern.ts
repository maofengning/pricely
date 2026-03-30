// Pattern annotation types
export type PatternType =
  | 'pin_bar'
  | 'engulfing'
  | 'evening_star'
  | 'morning_star'
  | 'doji'
  | 'head_shoulders_top'
  | 'head_shoulders_bottom';

export interface PatternMark {
  id: string;
  stockCode: string;
  period: string;
  patternType: PatternType;
  startTime: string;
  endTime: string;
  startPrice: number;
  endPrice: number;
  description?: string;
  isValid: boolean;
}

export interface PatternCreate {
  stockCode: string;
  period: string;
  patternType: PatternType;
  startTime: string;
  endTime: string;
  startPrice: number;
  endPrice: number;
  description?: string;
}