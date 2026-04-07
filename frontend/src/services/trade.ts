/**
 * Trade service for trading operations
 */

import { api } from './api';
import type {
  Order,
  Position,
  Fund,
  TradeReport,
  OrderStatus,
  ReportPeriodType,
} from '@/types';

interface OrderCreateRequest {
  stockCode: string;
  stockName?: string;
  orderType: 'buy' | 'sell';
  orderMode: 'market' | 'limit';
  quantity: number;
  limitPrice?: number;
}

interface FundResetRequest {
  initialCapital: number;
}

interface SuccessResponse {
  message: string;
}

export const tradeService = {
  // Order operations
  async createOrder(data: OrderCreateRequest): Promise<Order> {
    const response = await api.post<Order>('/trade/order', data);
    return response;
  },

  async cancelOrder(orderId: string): Promise<SuccessResponse> {
    return api.delete<SuccessResponse>(`/trade/order/${orderId}`);
  },

  async listOrders(status?: OrderStatus): Promise<Order[]> {
    const params = status ? `?status=${status}` : '';
    return api.get<Order[]>(`/trade/orders${params}`);
  },

  // Position operations
  async listPositions(): Promise<Position[]> {
    return api.get<Position[]>('/trade/position');
  },

  // Fund operations
  async getFund(): Promise<Fund> {
    return api.get<Fund>('/trade/fund');
  },

  async resetFund(data: FundResetRequest): Promise<SuccessResponse> {
    return api.post<SuccessResponse>('/trade/fund/reset', data);
  },

  // Trade reports
  async getReports(periodType?: ReportPeriodType): Promise<TradeReport[]> {
    const params = periodType ? `?period_type=${periodType}` : '';
    return api.get<TradeReport[]>(`/trade/report${params}`);
  },
};

export default tradeService;