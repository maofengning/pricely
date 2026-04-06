import { useEffect, useState, useCallback, useMemo } from 'react';
import { SyncedChart } from './SyncedChart';
import { PeriodMultiSelect } from './PeriodSelector';
import { GridLayoutSelector } from './GridLayoutSelector';
import { SupportResistanceTools } from './SupportResistanceTools';
import { useMultiPeriodSync } from '@/hooks';
import { api } from '@/services/api';
import type {
  KlineData,
  Period,
  GridLayout,
} from '@/types';
import { GRID_LAYOUTS, PERIOD_LABELS } from '@/types';
import type { IRange, IChartApi, CandlestickData, Time } from 'lightweight-charts';

interface MultiPeriodPanelProps {
  stockCode: string;
  defaultPeriods?: Period[];
  defaultLayout?: GridLayout;
  showLayoutSelector?: boolean;
  showPeriodSelector?: boolean;
}

export function MultiPeriodPanel({
  stockCode,
  defaultPeriods = ['1min', '5min', '15min', '30min', '1h', '4h'],
  defaultLayout = '2x3',
  showLayoutSelector = true,
  showPeriodSelector = true,
}: MultiPeriodPanelProps) {
  // State
  const [layout, setLayout] = useState<GridLayout>(defaultLayout);
  const [klineData, setKlineData] = useState<Record<Period, KlineData[]>>({} as Record<Period, KlineData[]>);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Chart sync hook
  const {
    activePeriods,
    addPeriod,
    removePeriod,
    crosshairData,
    handleCrosshairMove,
    visibleRange,
    handleVisibleRangeChange,
    registerChart,
  } = useMultiPeriodSync({
    periods: defaultPeriods,
  });

  // Crosshair sync state per period
  const [crosshairSync, setCrosshairSync] = useState<Map<Period, { time: Time } | null>>(new Map());

  // Fetch kline data for all active periods
  useEffect(() => {
    const fetchKlineData = async () => {
      if (!stockCode || activePeriods.length === 0) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await api.get<{
          stockCode: string;
          periods: Record<string, KlineData[]>;
        }>(`/market/multi-period?stock_code=${stockCode}&periods=${activePeriods.join(',')}`);

        setKlineData(response.periods as Record<Period, KlineData[]>);
      } catch (err) {
        console.error('Failed to fetch kline data:', err);
        setError('Failed to load chart data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchKlineData();
  }, [stockCode, activePeriods]);

  // Handle period selection change
  const handlePeriodsChange = useCallback(
    (newPeriods: Period[]) => {
      // Remove periods that are no longer selected
      activePeriods.forEach((period) => {
        if (!newPeriods.includes(period)) {
          removePeriod(period);
          setCrosshairSync((prev) => {
            const next = new Map(prev);
            next.delete(period);
            return next;
          });
        }
      });

      // Add new periods
      newPeriods.forEach((period) => {
        if (!activePeriods.includes(period)) {
          addPeriod(period);
        }
      });
    },
    [activePeriods, addPeriod, removePeriod]
  );

  // Handle crosshair move from any chart
  const onCrosshairMove = useCallback(
    (sourcePeriod: Period, data: { time: Time; open: number; high: number; low: number; close: number } | null) => {
      // Create crosshair data with price from close
      const crosshairInput = data ? { ...data, price: data.close } : null;
      handleCrosshairMove(sourcePeriod, crosshairInput);

      // Sync crosshair to all other charts
      if (data) {
        setCrosshairSync((prev) => {
          const next = new Map(prev);
          activePeriods.forEach((period) => {
            if (period !== sourcePeriod) {
              next.set(period, { time: data.time });
            } else {
              next.set(period, null); // Don't sync back to source
            }
          });
          return next;
        });
      }
    },
    [handleCrosshairMove, activePeriods]
  );

  // Handle visible range change from any chart
  const onVisibleRangeChange = useCallback(
    (sourcePeriod: Period, range: IRange<Time> | null) => {
      handleVisibleRangeChange(sourcePeriod, range);
    },
    [handleVisibleRangeChange]
  );

  // Handle chart ready callback
  const onChartReady = useCallback((period: Period, chart: IChartApi) => {
    registerChart(period, chart);
  }, [registerChart]);

  // Get grid CSS classes based on layout
  const gridClasses = 'grid gap-2 h-full';

  // Get grid style for CSS grid
  const gridStyle = useMemo(() => {
    const config = GRID_LAYOUTS[layout];
    return {
      gridTemplateColumns: `repeat(${config.cols}, minmax(0, 1fr))`,
      gridTemplateRows: `repeat(${config.rows}, minmax(0, 1fr))`,
    };
  }, [layout]);

  // Convert KlineData to CandlestickData
  const convertToCandlestickData = useCallback(
    (data: KlineData[]): CandlestickData<Time>[] => {
      return data.map((d) => ({
        time: d.time as Time,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
      }));
    },
    []
  );

  // Limit visible periods based on layout
  const visiblePeriods = useMemo(() => {
    const maxCharts = GRID_LAYOUTS[layout].maxCharts;
    return activePeriods.slice(0, maxCharts);
  }, [activePeriods, layout]);

  // Get first period for drawing tools
  const primaryPeriod = activePeriods[0] || '1min';

  return (
    <div className="flex flex-col h-full">
      {/* Drawing Tools Toolbar */}
      <div className="mb-4">
        <SupportResistanceTools stockCode={stockCode} period={primaryPeriod} />
      </div>

      {/* Header with controls */}
      <div className="flex flex-col gap-2 mb-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          {/* Stock code display */}
          <div className="flex items-center gap-2">
            <span className="text-text-primary font-medium">{stockCode}</span>
            {isLoading && <span className="text-text-secondary text-sm">Loading...</span>}
            {error && <span className="text-red-400 text-sm">{error}</span>}
          </div>

          {/* Layout selector */}
          {showLayoutSelector && (
            <GridLayoutSelector value={layout} onChange={setLayout} />
          )}
        </div>

        {/* Period multi-select */}
        {showPeriodSelector && (
          <PeriodMultiSelect
            value={activePeriods}
            onChange={handlePeriodsChange}
            maxSelect={GRID_LAYOUTS[layout].maxCharts}
          />
        )}
      </div>

      {/* Crosshair info display */}
      {crosshairData && (
        <div className="mb-2 px-2 py-1 bg-bg-secondary rounded text-sm flex items-center gap-4">
          <span className="text-text-secondary">Time:</span>
          <span className="text-text-primary">{String(crosshairData.time)}</span>
          <span className="text-text-secondary">|</span>
          <span className="text-text-secondary">O:</span>
          <span className="text-green-400">{crosshairData.open.toFixed(2)}</span>
          <span className="text-text-secondary">H:</span>
          <span className="text-red-400">{crosshairData.high.toFixed(2)}</span>
          <span className="text-text-secondary">L:</span>
          <span className="text-green-400">{crosshairData.low.toFixed(2)}</span>
          <span className="text-text-secondary">C:</span>
          <span className={crosshairData.close >= crosshairData.open ? 'text-green-400' : 'text-red-400'}>
            {crosshairData.close.toFixed(2)}
          </span>
        </div>
      )}

      {/* Chart grid */}
      <div className={gridClasses} style={gridStyle}>
        {visiblePeriods.map((period) => {
          const data = klineData[period] || [];
          const chartData = convertToCandlestickData(data);

          return (
            <div
              key={period}
              className="bg-bg-secondary rounded-lg overflow-hidden border border-border"
            >
              <SyncedChart
                data={chartData}
                stockCode={stockCode}
                period={period}
                onCrosshairMove={(data) => onCrosshairMove(period, data)}
                onVisibleRangeChange={(range) => onVisibleRangeChange(period, range)}
                onChartReady={(chart) => onChartReady(period, chart)}
                syncRange={visibleRange}
                syncCrosshair={crosshairSync.get(period) || null}
              />
            </div>
          );
        })}

        {/* Empty slots */}
        {visiblePeriods.length < GRID_LAYOUTS[layout].maxCharts &&
          Array.from({ length: GRID_LAYOUTS[layout].maxCharts - visiblePeriods.length }).map((_, index) => (
            <div
              key={`empty-${index}`}
              className="bg-bg-secondary rounded-lg overflow-hidden border border-border flex items-center justify-center"
            >
              <span className="text-text-muted text-sm">Select more periods to display</span>
            </div>
          ))}
      </div>

      {/* Legend */}
      <div className="mt-2 flex items-center justify-end gap-2 text-xs text-text-muted">
        {visiblePeriods.map((period) => (
          <span key={period} className="px-2 py-0.5 bg-bg-secondary rounded">
            {PERIOD_LABELS[period]}
          </span>
        ))}
      </div>
    </div>
  );
}