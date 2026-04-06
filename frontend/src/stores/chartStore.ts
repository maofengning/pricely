import { create } from 'zustand';
import type { Period, KlineData, ChartStyle } from '@/types';

interface ChartState {
  stockCode: string | null;
  period: Period;
  klineData: KlineData[];
  chartStyle: ChartStyle;
  isLoading: boolean;
  setStockCode: (code: string) => void;
  setPeriod: (period: Period) => void;
  setKlineData: (data: KlineData[]) => void;
  setChartStyle: (style: Partial<ChartStyle>) => void;
  setLoading: (loading: boolean) => void;
}

const DEFAULT_CHART_STYLE: ChartStyle = {
  upColor: '#26a69a',
  downColor: '#ef5350',
  wickUpColor: '#26a69a',
  wickDownColor: '#ef5350',
  borderUpColor: '#26a69a',
  borderDownColor: '#ef5350',
};

export const useChartStore = create<ChartState>((set) => ({
  stockCode: null,
  period: '1d',
  klineData: [],
  chartStyle: DEFAULT_CHART_STYLE,
  isLoading: false,
  setStockCode: (code) => set({ stockCode: code }),
  setPeriod: (period) => set({ period }),
  setKlineData: (data) => set({ klineData: data }),
  setChartStyle: (style) =>
    set((state) => ({ chartStyle: { ...state.chartStyle, ...style } })),
  setLoading: (loading) => set({ isLoading: loading }),
}));