import { create } from 'zustand';
import type {
  Drawing,
  DrawingToolType,
  DrawingToolMode,
  DrawingPoint,
} from '@/types/drawing';

interface DrawingState {
  // Tool selection
  activeTool: DrawingToolType | null;
  toolMode: DrawingToolMode;

  // Current drawing points (for multi-point drawings)
  drawingPoints: DrawingPoint[];

  // All drawings for current chart
  drawings: Drawing[];

  // Selected drawing for editing
  selectedDrawingId: string | null;

  // Drawing visibility
  showDrawings: boolean;

  // Actions
  setActiveTool: (tool: DrawingToolType | null) => void;
  setToolMode: (mode: DrawingToolMode) => void;
  addDrawingPoint: (point: DrawingPoint) => void;
  clearDrawingPoints: () => void;
  addDrawing: (drawing: Drawing) => void;
  updateDrawing: (id: string, updates: Partial<Drawing>) => void;
  deleteDrawing: (id: string) => void;
  selectDrawing: (id: string | null) => void;
  setDrawings: (drawings: Drawing[]) => void;
  setShowDrawings: (show: boolean) => void;
  clearAllDrawings: () => void;
}

export const useDrawingStore = create<DrawingState>((set) => ({
  activeTool: null,
  toolMode: 'idle',
  drawingPoints: [],
  drawings: [],
  selectedDrawingId: null,
  showDrawings: true,

  setActiveTool: (tool) =>
    set({
      activeTool: tool,
      toolMode: tool ? 'drawing' : 'idle',
      drawingPoints: [],
      selectedDrawingId: null,
    }),

  setToolMode: (mode) => set({ toolMode: mode }),

  addDrawingPoint: (point) =>
    set((state) => ({
      drawingPoints: [...state.drawingPoints, point],
    })),

  clearDrawingPoints: () => set({ drawingPoints: [] }),

  addDrawing: (drawing) =>
    set((state) => ({
      drawings: [...state.drawings, drawing],
      drawingPoints: [],
      toolMode: 'idle',
    })),

  updateDrawing: (id, updates) =>
    set((state) => ({
      drawings: state.drawings.map((d) =>
        d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d
      ) as Drawing[],
    })),

  deleteDrawing: (id) =>
    set((state) => ({
      drawings: state.drawings.filter((d) => d.id !== id),
      selectedDrawingId:
        state.selectedDrawingId === id ? null : state.selectedDrawingId,
    })),

  selectDrawing: (id) =>
    set({
      selectedDrawingId: id,
      toolMode: id ? 'selected' : 'idle',
      activeTool: null,
    }),

  setDrawings: (drawings) => set({ drawings }),

  setShowDrawings: (show) => set({ showDrawings: show }),

  clearAllDrawings: () =>
    set({
      drawings: [],
      drawingPoints: [],
      selectedDrawingId: null,
      toolMode: 'idle',
    }),
}));