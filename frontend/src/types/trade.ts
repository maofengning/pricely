// Trade-related types
export type OrderType = 'buy' | 'sell';
export type OrderMode = 'market' | 'limit';
export type OrderStatus = 'pending' | 'filled' | 'cancelled';

export interface Order {
  id: string;
  stockCode: string;
  stockName: string;
  orderType: OrderType;
  orderMode: OrderMode;
  limitPrice?: number;
  quantity: number;
  filledPrice?: number;
  filledAt?: string;
  status: OrderStatus;
  createdAt: string;
}

export interface OrderCreate {
  stockCode: string;
  orderType: OrderType;
  orderMode: OrderMode;
  quantity: number;
  limitPrice?: number;
}

export interface Position {
  id: string;
  stockCode: string;
  stockName: string;
  quantity: number;
  avgCost: number;
  currentPrice: number;
  profitLoss: number;
}

export interface Fund {
  totalBalance: number;
  available: number;
  frozen: number;
  initialCapital: number;
}

export interface TradeReport {
  tradeCount: number;
  winCount: number;
  lossCount: number;
  winRate: number;
  totalProfit: number;
  totalLoss: number;
  netProfit: number;
  maxDrawdown: number;
}