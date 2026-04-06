import { create } from 'zustand';
import type { Pattern } from '@/types';

interface PatternState {
  patterns: Pattern[];
  selectedPattern: Pattern | null;
  isLoading: boolean;
  error: string | null;
  editorOpen: boolean;
  editingPattern: Pattern | null;

  // Actions
  setPatterns: (patterns: Pattern[]) => void;
  setSelectedPattern: (pattern: Pattern | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  openEditor: (pattern?: Pattern) => void;
  closeEditor: () => void;

  // Async actions (will be handled by hook)
  addPattern: (pattern: Pattern) => void;
  updatePattern: (id: string, updates: Partial<Pattern>) => void;
  removePattern: (id: string) => void;
}

export const usePatternStore = create<PatternState>((set) => ({
  patterns: [],
  selectedPattern: null,
  isLoading: false,
  error: null,
  editorOpen: false,
  editingPattern: null,

  setPatterns: (patterns) => set({ patterns }),
  setSelectedPattern: (pattern) => set({ selectedPattern: pattern }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  openEditor: (pattern) => set({ editorOpen: true, editingPattern: pattern ?? null }),
  closeEditor: () => set({ editorOpen: false, editingPattern: null }),

  addPattern: (pattern) => set((state) => ({
    patterns: [...state.patterns, pattern],
  })),
  updatePattern: (id, updates) => set((state) => ({
    patterns: state.patterns.map((p) =>
      p.id === id ? { ...p, ...updates } : p
    ),
    selectedPattern: state.selectedPattern?.id === id
      ? { ...state.selectedPattern, ...updates }
      : state.selectedPattern,
  })),
  removePattern: (id) => set((state) => ({
    patterns: state.patterns.filter((p) => p.id !== id),
    selectedPattern: state.selectedPattern?.id === id ? null : state.selectedPattern,
  })),
}));