import { create } from 'zustand';
import type { TradeLog, TradeLogQuery, TradeLogListResponse } from '@/types';

interface LogState {
  logs: TradeLog[];
  total: number;
  page: number;
  pageSize: number;
  selectedLog: TradeLog | null;
  isLoading: boolean;
  error: string | null;
  editorOpen: boolean;
  editingLog: TradeLog | null;
  query: TradeLogQuery;

  // Actions
  setLogs: (response: TradeLogListResponse) => void;
  setSelectedLog: (log: TradeLog | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  openEditor: (log?: TradeLog) => void;
  closeEditor: () => void;
  setQuery: (query: TradeLogQuery) => void;

  // Async actions (will be handled by hook)
  addLog: (log: TradeLog) => void;
  updateLog: (id: string, updates: Partial<TradeLog>) => void;
  removeLog: (id: string) => void;
}

export const useLogStore = create<LogState>((set) => ({
  logs: [],
  total: 0,
  page: 1,
  pageSize: 20,
  selectedLog: null,
  isLoading: false,
  error: null,
  editorOpen: false,
  editingLog: null,
  query: {},

  setLogs: (response) => set({
    logs: response.items,
    total: response.total,
    page: response.page,
    pageSize: response.pageSize,
  }),
  setSelectedLog: (log) => set({ selectedLog: log }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  openEditor: (log) => set({ editorOpen: true, editingLog: log ?? null }),
  closeEditor: () => set({ editorOpen: false, editingLog: null }),
  setQuery: (query) => set({ query }),

  addLog: (log) => set((state) => ({
    logs: [...state.logs, log],
    total: state.total + 1,
  })),
  updateLog: (id, updates) => set((state) => ({
    logs: state.logs.map((l) =>
      l.id === id ? { ...l, ...updates } : l
    ),
    selectedLog: state.selectedLog?.id === id
      ? { ...state.selectedLog, ...updates }
      : state.selectedLog,
  })),
  removeLog: (id) => set((state) => ({
    logs: state.logs.filter((l) => l.id !== id),
    total: state.total - 1,
    selectedLog: state.selectedLog?.id === id ? null : state.selectedLog,
  })),
}));
