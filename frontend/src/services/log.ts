import { api } from './api';
import type { TradeLog, TradeLogCreate, TradeLogUpdate, TradeLogQuery, TradeLogListResponse } from '@/types';

class LogService {
  async create(data: TradeLogCreate): Promise<TradeLog> {
    // Convert camelCase to snake_case for API
    const apiData = {
      stockCode: data.stockCode,
      stockName: data.stockName,
      period: data.period,
      patternType: data.patternType,
      entryPrice: data.entryPrice,
      stopLoss: data.stopLoss,
      takeProfit: data.takeProfit,
      exitPrice: data.exitPrice,
      quantity: data.quantity,
      profitLoss: data.profitLoss,
      notes: data.notes,
      tags: data.tags,
      tradeTime: data.tradeTime,
    };
    return api.post<TradeLog>('/logs', apiData);
  }

  async list(query?: TradeLogQuery): Promise<TradeLogListResponse> {
    const params = new URLSearchParams();
    if (query?.stockCode) params.append('stockCode', query.stockCode);
    if (query?.tags && query.tags.length > 0) {
      query.tags.forEach(tag => params.append('tags', tag));
    }
    if (query?.startDate) params.append('startDate', query.startDate);
    if (query?.endDate) params.append('endDate', query.endDate);
    if (query?.page) params.append('page', query.page.toString());
    if (query?.pageSize) params.append('pageSize', query.pageSize.toString());

    const queryString = params.toString();
    const endpoint = queryString ? `/logs?${queryString}` : '/logs';
    return api.get<TradeLogListResponse>(endpoint);
  }

  async get(id: string): Promise<TradeLog> {
    return api.get<TradeLog>(`/logs/${id}`);
  }

  async update(id: string, data: TradeLogUpdate): Promise<TradeLog> {
    // Convert camelCase to snake_case for API
    const apiData: Record<string, unknown> = {};
    if (data.stockCode) apiData.stockCode = data.stockCode;
    if (data.stockName) apiData.stockName = data.stockName;
    if (data.period) apiData.period = data.period;
    if (data.patternType) apiData.patternType = data.patternType;
    if (data.entryPrice) apiData.entryPrice = data.entryPrice;
    if (data.stopLoss !== undefined) apiData.stopLoss = data.stopLoss;
    if (data.takeProfit !== undefined) apiData.takeProfit = data.takeProfit;
    if (data.exitPrice !== undefined) apiData.exitPrice = data.exitPrice;
    if (data.quantity) apiData.quantity = data.quantity;
    if (data.profitLoss !== undefined) apiData.profitLoss = data.profitLoss;
    if (data.notes !== undefined) apiData.notes = data.notes;
    if (data.tags !== undefined) apiData.tags = data.tags;
    if (data.tradeTime !== undefined) apiData.tradeTime = data.tradeTime;

    return api.put<TradeLog>(`/logs/${id}`, apiData);
  }

  async delete(id: string): Promise<void> {
    await api.delete(`/logs/${id}`);
  }
}

export const logService = new LogService();
