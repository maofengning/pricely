import { api } from './api';
import type { SRDetectionResponse } from '@/types/drawing';

class AIService {
  /**
   * Detect support/resistance levels using rule-based algorithm
   * @param stockCode - Stock code
   * @param period - Time period
   * @returns Detected levels
   */
  async detectSRLevels(
    stockCode: string,
    period: string
  ): Promise<SRDetectionResponse> {
    const response = await api.post<SRDetectionResponse>('/ai/sr-detect', {
      stockCode,
      period,
    });
    return response;
  }

  /**
   * Convert AI detected levels to drawing objects
   * @param response - API response with levels
   * @returns Array of horizontal line drawings
   */
  convertLevelsToDrawings(
    response: SRDetectionResponse
  ): Array<{
    price: number;
    levelType: 'support' | 'resistance';
    strength: number;
    isAiDetected: boolean;
  }> {
    const drawings: Array<{
      price: number;
      levelType: 'support' | 'resistance';
      strength: number;
      isAiDetected: boolean;
    }> = [];

    // Convert support levels
    for (const level of response.supportLevels) {
      drawings.push({
        price: level.price,
        levelType: 'support',
        strength: level.strength,
        isAiDetected: true,
      });
    }

    // Convert resistance levels
    for (const level of response.resistanceLevels) {
      drawings.push({
        price: level.price,
        levelType: 'resistance',
        strength: level.strength,
        isAiDetected: true,
      });
    }

    return drawings;
  }

  /**
   * Get integer levels (price levels at multiples of 5 or 10)
   * @param stockCode - Stock code
   * @param period - Time period
   * @returns Integer levels
   */
  async getIntegerLevels(
    stockCode: string,
    period: string
  ): Promise<Array<{ price: number; levelType: string; touchesCount: number }>> {
    const response = await api.get<
      Array<{ price: number; levelType: string; touchesCount: number }>
    >(`/ai/int-levels?stock_code=${stockCode}&period=${period}`);
    return response;
  }

  /**
   * Correct a detected level (user correction)
   * @param levelId - Level ID
   * @param correctedPrice - Corrected price
   * @param action - 'update' or 'delete'
   * @returns Corrected level
   */
  async correctLevel(
    levelId: string,
    correctedPrice: number,
    action: 'update' | 'delete'
  ): Promise<{ id: string; price: number; levelType: string }> {
    const response = await api.post<{
      id: string;
      price: number;
      levelType: string;
    }>('/ai/correct-result', {
      levelId,
      correctedPrice,
      action,
    });
    return response;
  }
}

export const aiService = new AIService();