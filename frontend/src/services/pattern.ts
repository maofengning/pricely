import { api } from './api';
import type { Pattern, PatternCreate, PatternUpdate, PatternQuery, Period } from '@/types';

class PatternService {
  async create(data: PatternCreate): Promise<Pattern> {
    // Convert camelCase to snake_case for API
    const apiData = {
      stockCode: data.stockCode,
      period: data.period,
      patternType: data.patternType,
      startTime: data.startTime,
      endTime: data.endTime,
      startPrice: data.startPrice,
      endPrice: data.endPrice,
      description: data.description,
    };
    return api.post<Pattern>('/patterns', apiData);
  }

  async list(query?: PatternQuery): Promise<Pattern[]> {
    const params = new URLSearchParams();
    if (query?.stockCode) params.append('stock_code', query.stockCode);
    if (query?.period) params.append('period', query.period);
    if (query?.patternType) params.append('pattern_type', query.patternType);

    const queryString = params.toString();
    const endpoint = queryString ? `/patterns?${queryString}` : '/patterns';
    return api.get<Pattern[]>(endpoint);
  }

  async getByPeriod(period: Period): Promise<Pattern[]> {
    return api.get<Pattern[]>(`/patterns/by-period?period=${period}`);
  }

  async get(id: string): Promise<Pattern> {
    return api.get<Pattern>(`/patterns/${id}`);
  }

  async update(id: string, data: PatternUpdate): Promise<Pattern> {
    // Convert camelCase to snake_case for API
    const apiData: Record<string, unknown> = {};
    if (data.patternType) apiData.patternType = data.patternType;
    if (data.startTime) apiData.startTime = data.startTime;
    if (data.endTime) apiData.endTime = data.endTime;
    if (data.startPrice !== undefined) apiData.startPrice = data.startPrice;
    if (data.endPrice !== undefined) apiData.endPrice = data.endPrice;
    if (data.description !== undefined) apiData.description = data.description;
    if (data.isValid !== undefined) apiData.isValid = data.isValid;

    return api.put<Pattern>(`/patterns/${id}`, apiData);
  }

  async delete(id: string): Promise<void> {
    await api.delete(`/patterns/${id}`);
  }
}

export const patternService = new PatternService();