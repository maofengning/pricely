// Trade log types
export interface TradeLog {
  id: string;
  stockCode: string;
  stockName: string;
  period: string;
  patternType?: string;
  entryPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  exitPrice?: number;
  quantity: number;
  profitLoss?: number;
  notes?: string;
  tags: string[];
  tradeTime: string;
}

export interface TradeLogCreate {
  stockCode: string;
  period: string;
  patternType?: string;
  entryPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  quantity: number;
  notes?: string;
  tags?: string[];
  tradeTime: string;
}