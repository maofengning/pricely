import { useCallback, useRef, useState } from 'react';
import type { IChartApi, Time, IRange } from 'lightweight-charts';
import type { Period } from '@/types';

export interface CrosshairData {
  time: Time;
  price: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface ChartSyncState {
  visibleRange: IRange<Time> | null;
  crosshairData: CrosshairData | null;
}

export interface ChartInstance {
  period: Period;
  chart: IChartApi;
}

interface UseMultiPeriodSyncOptions {
  periods: Period[];
  onCrosshairMove?: (period: Period, data: CrosshairData | null) => void;
}

interface UseMultiPeriodSyncReturn {
  // Chart instance management
  registerChart: (period: Period, chart: IChartApi) => void;
  unregisterChart: (period: Period) => void;

  // Crosshair sync
  crosshairData: CrosshairData | null;
  handleCrosshairMove: (sourcePeriod: Period, data: CrosshairData | null) => void;

  // Zoom sync
  visibleRange: IRange<Time> | null;
  handleVisibleRangeChange: (sourcePeriod: Period, range: IRange<Time> | null) => void;

  // Time alignment
  alignTimeScales: () => void;

  // Active periods management
  activePeriods: Period[];
  addPeriod: (period: Period) => void;
  removePeriod: (period: Period) => void;

  // Chart refs for external access
  chartRefs: React.MutableRefObject<Map<Period, IChartApi>>;
}

export function useMultiPeriodSync(
  options: UseMultiPeriodSyncOptions
): UseMultiPeriodSyncReturn {
  const { periods, onCrosshairMove } = options;

  // State for crosshair and range sync
  const [crosshairData, setCrosshairData] = useState<CrosshairData | null>(null);
  const [visibleRange, setVisibleRange] = useState<IRange<Time> | null>(null);
  const [activePeriods, setActivePeriods] = useState<Period[]>(periods);

  // Chart instance refs
  const chartRefs = useRef<Map<Period, IChartApi>>(new Map());

  // Register chart instance
  const registerChart = useCallback((period: Period, chart: IChartApi) => {
    chartRefs.current.set(period, chart);
  }, []);

  // Unregister chart instance
  const unregisterChart = useCallback((period: Period) => {
    chartRefs.current.delete(period);
  }, []);

  // Handle crosshair move from any chart
  const handleCrosshairMove = useCallback(
    (sourcePeriod: Period, data: CrosshairData | null) => {
      setCrosshairData(data);

      // Notify parent callback
      onCrosshairMove?.(sourcePeriod, data);
    },
    [onCrosshairMove]
  );

  // Handle visible range change from any chart
  const handleVisibleRangeChange = useCallback(
    (sourcePeriod: Period, range: IRange<Time> | null) => {
      if (!range) {
        setVisibleRange(null);
        return;
      }

      setVisibleRange(range);

      // Sync visible range to all other charts
      chartRefs.current.forEach((chart, period) => {
        if (period !== sourcePeriod) {
          try {
            chart.timeScale().setVisibleRange(range);
          } catch {
            // Ignore errors if chart is not ready
          }
        }
      });
    },
    []
  );

  // Align time scales across all charts
  const alignTimeScales = useCallback(() => {
    const charts = Array.from(chartRefs.current.values());
    if (charts.length < 2) return;

    // Calculate the intersection of all visible ranges
    let commonFrom: number | null = null;
    let commonTo: number | null = null;

    charts.forEach((chart) => {
      const range = chart.timeScale().getVisibleRange();
      if (range) {
        const from = Number(range.from);
        const to = Number(range.to);
        if (commonFrom === null || commonTo === null) {
          commonFrom = from;
          commonTo = to;
        } else {
          // Take the intersection
          commonFrom = Math.max(commonFrom, from);
          commonTo = Math.min(commonTo, to);
        }
      }
    });

    // Apply the common range to all charts
    if (commonFrom !== null && commonTo !== null && commonFrom < commonTo) {
      charts.forEach((chart) => {
        try {
          chart.timeScale().setVisibleRange({
            from: commonFrom as Time,
            to: commonTo as Time,
          });
        } catch {
          // Ignore errors
        }
      });
    }
  }, []);

  // Add a period
  const addPeriod = useCallback((period: Period) => {
    setActivePeriods((prev) => {
      if (prev.includes(period)) return prev;
      return [...prev, period];
    });
  }, []);

  // Remove a period
  const removePeriod = useCallback((period: Period) => {
    setActivePeriods((prev) => prev.filter((p) => p !== period));
    chartRefs.current.delete(period);
  }, []);

  return {
    registerChart,
    unregisterChart,
    crosshairData,
    handleCrosshairMove,
    visibleRange,
    handleVisibleRangeChange,
    alignTimeScales,
    activePeriods,
    addPeriod,
    removePeriod,
    chartRefs,
  };
}