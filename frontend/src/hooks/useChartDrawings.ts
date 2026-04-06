import { useRef, useCallback } from 'react';
import type { Time } from 'lightweight-charts';
import type { Drawing } from '@/types/drawing';
import { useDrawingStore } from '@/stores/drawingStore';
import { getRequiredPointsForTool } from '@/utils/mathUtils';

// Drawing primitive colors
const COLORS = {
  support: '#26a69a', // Green for support
  resistance: '#ef5350', // Red for resistance
  trend_up: '#26a69a',
  trend_down: '#ef5350',
  fibonacci: '#2962ff', // Blue for Fibonacci
  channel: '#ffa726', // Orange for channels
  selected: '#ffffff', // White for selected drawings
};

/**
 * Hook for managing chart drawing operations
 * Note: This hook provides utilities for drawing operations
 * The actual rendering is handled by DrawingLayer component
 */
export function useChartDrawings() {
  const primitivesRef = useRef<Map<string, unknown>>(new Map());
  const { drawings, selectedDrawingId, showDrawings } = useDrawingStore();

  /**
   * Get color for drawing based on type
   */
  const getDrawingColor = useCallback((drawing: Drawing): string => {
    switch (drawing.toolType) {
      case 'horizontal_line':
        return drawing.levelType === 'support' ? COLORS.support : COLORS.resistance;
      case 'trend_line':
        return drawing.trendType === 'up' ? COLORS.trend_up : COLORS.trend_down;
      case 'parallel_channel':
        return COLORS.channel;
      case 'fibonacci_retracement':
      case 'fibonacci_extension':
        return COLORS.fibonacci;
      default:
        return COLORS.fibonacci;
    }
  }, []);

  /**
   * Handle chart click for drawing
   */
  const handleChartClick = useCallback(
    (time: Time, price: number): boolean => {
      const state = useDrawingStore.getState();
      const { activeTool, addDrawingPoint } = state;

      if (!activeTool) return false;

      const point = {
        time: typeof time === 'number' ? time : parseFloat(time as string),
        price,
      };

      addDrawingPoint(point);

      // Check if we need more points
      const newPoints = useDrawingStore.getState().drawingPoints;

      return newPoints.length >= getRequiredPointsForTool(activeTool);
    },
    []
  );

  return {
    handleChartClick,
    primitivesRef,
    getDrawingColor,
    drawings,
    selectedDrawingId,
    showDrawings,
  };
}