import { useCallback, useState } from 'react';
import { useDrawingStore } from '@/stores/drawingStore';
import { aiService } from '@/services/ai';
import type {
  Drawing,
  DrawingToolType,
  DrawingPoint,
  DrawingToolMode,
  HorizontalLineDrawing,
} from '@/types/drawing';
import {
  generateDrawingId,
  createDrawingFromPoints as createDrawingFromUtil,
  getRequiredPointsForTool,
} from '@/utils/mathUtils';

interface UseDrawingReturn {
  // Drawing state from store
  activeTool: DrawingToolType | null;
  toolMode: DrawingToolMode;
  drawings: Drawing[];
  selectedDrawingId: string | null;
  drawingPoints: DrawingPoint[];

  // Actions
  setActiveTool: (tool: DrawingToolType | null) => void;
  startDrawing: (tool: DrawingToolType) => void;
  addPoint: (point: DrawingPoint) => void;
  finishDrawing: (stockCode: string, period: string) => Drawing | null;
  cancelDrawing: () => void;
  selectDrawing: (id: string | null) => void;
  updateDrawing: (id: string, updates: Partial<Drawing>) => void;
  deleteDrawing: (id: string) => void;
  deleteSelectedDrawing: () => void;
  clearAllDrawings: () => void;

  // AI detection
  detectSRLevels: (stockCode: string, period: string) => Promise<void>;
  isLoadingDetection: boolean;

  // Required points for each tool
  getRequiredPoints: (tool: DrawingToolType) => number;
}

/**
 * Hook for managing drawing operations
 */
export function useDrawing(): UseDrawingReturn {
  const {
    activeTool,
    toolMode,
    drawings,
    selectedDrawingId,
    drawingPoints,
    setActiveTool,
    addDrawingPoint,
    clearDrawingPoints,
    addDrawing,
    updateDrawing,
    deleteDrawing,
    selectDrawing,
    setDrawings,
    clearAllDrawings,
  } = useDrawingStore();

  const [isLoadingDetection, setIsLoadingDetection] = useState(false);

  /**
   * Get required number of points for each tool
   * Uses shared utility function from mathUtils
   */
  const getRequiredPoints = useCallback(
    (tool: DrawingToolType): number => getRequiredPointsForTool(tool),
    []
  );

  /**
   * Start drawing with a tool
   */
  const startDrawing = useCallback(
    (tool: DrawingToolType) => {
      setActiveTool(tool);
      clearDrawingPoints();
    },
    [setActiveTool, clearDrawingPoints]
  );

  /**
   * Add a point to current drawing
   */
  const addPoint = useCallback(
    (point: DrawingPoint) => {
      addDrawingPoint(point);
    },
    [addDrawingPoint]
  );

  /**
   * Finish drawing and create the drawing object
   * Uses shared utility function from mathUtils
   */
  const finishDrawing = useCallback(
    (stockCode: string, period: string): Drawing | null => {
      if (!activeTool) return null;

      const required = getRequiredPointsForTool(activeTool);
      if (drawingPoints.length < required) return null;

      const drawing = createDrawingFromUtil(
        drawingPoints,
        activeTool,
        stockCode,
        period
      );

      if (drawing) {
        addDrawing(drawing);
        setActiveTool(null);
      }

      return drawing;
    },
    [activeTool, drawingPoints, addDrawing, setActiveTool]
  );

  /**
   * Cancel current drawing
   */
  const cancelDrawing = useCallback(() => {
    setActiveTool(null);
    clearDrawingPoints();
  }, [setActiveTool, clearDrawingPoints]);

  /**
   * Delete selected drawing
   */
  const deleteSelectedDrawing = useCallback(() => {
    if (selectedDrawingId) {
      deleteDrawing(selectedDrawingId);
    }
  }, [selectedDrawingId, deleteDrawing]);

  /**
   * Detect support/resistance levels from AI
   */
  const detectSRLevels = useCallback(
    async (stockCode: string, period: string): Promise<void> => {
      setIsLoadingDetection(true);
      try {
        const response = await aiService.detectSRLevels(stockCode, period);
        const levels = aiService.convertLevelsToDrawings(response);

        // Create horizontal line drawings from detected levels
        const now = new Date().toISOString();
        const newDrawings: Drawing[] = levels.map((level) =>
          ({
            id: generateDrawingId(),
            toolType: 'horizontal_line',
            stockCode,
            period,
            price: level.price,
            levelType: level.levelType,
            strength: level.strength,
            isAiDetected: true,
            createdAt: now,
            updatedAt: now,
          }) as HorizontalLineDrawing
        );

        setDrawings([...drawings, ...newDrawings]);
      } catch (error) {
        console.error('Failed to detect S/R levels:', error);
      } finally {
        setIsLoadingDetection(false);
      }
    },
    [drawings, setDrawings]
  );

  return {
    activeTool,
    toolMode,
    drawings,
    selectedDrawingId,
    drawingPoints,
    setActiveTool,
    startDrawing,
    addPoint,
    finishDrawing,
    cancelDrawing,
    selectDrawing,
    updateDrawing,
    deleteDrawing,
    deleteSelectedDrawing,
    clearAllDrawings,
    detectSRLevels,
    isLoadingDetection,
    getRequiredPoints,
  };
}