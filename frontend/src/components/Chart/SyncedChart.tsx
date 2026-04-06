import { useEffect, useRef } from 'react';
import {
  createChart,
  ColorType,
  CandlestickSeries,
} from 'lightweight-charts';
import type {
  IChartApi,
  ISeriesApi,
  CandlestickData,
  Time,
  IRange,
} from 'lightweight-charts';
import { useChartStore } from '@/stores/chartStore';
import type { Period, ChartStyle } from '@/types';

export interface CrosshairMoveData {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface SyncedChartProps {
  data: CandlestickData<Time>[];
  stockCode: string;
  period: Period;
  onCrosshairMove?: (data: CrosshairMoveData | null) => void;
  onVisibleRangeChange?: (range: IRange<Time> | null) => void;
  onChartReady?: (chart: IChartApi) => void;
  syncRange?: IRange<Time> | null;
  syncCrosshair?: { time: Time } | null;
  chartStyle?: ChartStyle;
}

const DEFAULT_CHART_STYLE: ChartStyle = {
  upColor: '#26a69a',
  downColor: '#ef5350',
  wickUpColor: '#26a69a',
  wickDownColor: '#ef5350',
  borderUpColor: '#26a69a',
  borderDownColor: '#ef5350',
};

export function SyncedChart({
  data,
  stockCode,
  period,
  onCrosshairMove,
  onVisibleRangeChange,
  onChartReady,
  syncRange,
  syncCrosshair,
  chartStyle = DEFAULT_CHART_STYLE,
}: SyncedChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const isSyncingRef = useRef(false);

  const { chartStyle: storeChartStyle } = useChartStore();
  const effectiveStyle = chartStyle || storeChartStyle;

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#1e222d' },
        textColor: '#d1d4dc',
      },
      grid: {
        vertLines: { color: '#2a2e39' },
        horzLines: { color: '#2a2e39' },
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      crosshair: {
        mode: 1, // Magnet mode
        vertLine: {
          color: '#758696',
          width: 1,
          style: 3,
          labelBackgroundColor: '#2962ff',
        },
        horzLine: {
          color: '#758696',
          width: 1,
          style: 3,
          labelBackgroundColor: '#2962ff',
        },
      },
      rightPriceScale: {
        borderColor: '#2a2e39',
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
      timeScale: {
        borderColor: '#2a2e39',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: effectiveStyle.upColor,
      downColor: effectiveStyle.downColor,
      borderUpColor: effectiveStyle.borderUpColor,
      borderDownColor: effectiveStyle.borderDownColor,
      wickUpColor: effectiveStyle.wickUpColor,
      wickDownColor: effectiveStyle.wickDownColor,
    });

    // Subscribe to crosshair move
    chart.subscribeCrosshairMove((param) => {
      if (isSyncingRef.current) return;

      if (!param.time || !param.seriesData) {
        onCrosshairMove?.(null);
        return;
      }

      const seriesData = param.seriesData.get(candlestickSeries);
      if (seriesData && 'open' in seriesData) {
        onCrosshairMove?.({
          time: param.time,
          open: seriesData.open,
          high: seriesData.high,
          low: seriesData.low,
          close: seriesData.close,
        });
      }
    });

    // Subscribe to visible range change
    chart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
      if (isSyncingRef.current) return;

      if (range) {
        const timeRange = chart.timeScale().getVisibleRange();
        onVisibleRangeChange?.(timeRange || null);
      }
    });

    chartRef.current = chart;
    candlestickSeriesRef.current = candlestickSeries;

    // Notify parent that chart is ready
    onChartReady?.(chart);

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
      candlestickSeriesRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Update data
  useEffect(() => {
    if (candlestickSeriesRef.current && data.length > 0) {
      candlestickSeriesRef.current.setData(data);
      chartRef.current?.timeScale().fitContent();
    }
  }, [data]);

  // Update style
  useEffect(() => {
    if (candlestickSeriesRef.current) {
      candlestickSeriesRef.current.applyOptions({
        upColor: effectiveStyle.upColor,
        downColor: effectiveStyle.downColor,
        borderUpColor: effectiveStyle.borderUpColor,
        borderDownColor: effectiveStyle.borderDownColor,
        wickUpColor: effectiveStyle.wickUpColor,
        wickDownColor: effectiveStyle.wickDownColor,
      });
    }
  }, [effectiveStyle]);

  // Sync visible range from external source
  useEffect(() => {
    if (syncRange && chartRef.current) {
      isSyncingRef.current = true;
      try {
        chartRef.current.timeScale().setVisibleRange(syncRange);
      } catch {
        // Ignore errors if chart is not ready
      }
      // Reset sync flag after a short delay
      setTimeout(() => {
        isSyncingRef.current = false;
      }, 50);
    }
  }, [syncRange]);

  // Sync crosshair position from external source
  useEffect(() => {
    if (syncCrosshair && chartRef.current && candlestickSeriesRef.current) {
      isSyncingRef.current = true;
      try {
        // Set crosshair position: price first, then time, then series
        // We use 0 as price placeholder, the chart will show crosshair at the time position
        chartRef.current.setCrosshairPosition(
          0,
          syncCrosshair.time,
          candlestickSeriesRef.current
        );
      } catch {
        // Ignore errors
      }
      setTimeout(() => {
        isSyncingRef.current = false;
      }, 50);
    }
  }, [syncCrosshair]);

  return (
    <div className="relative w-full h-full min-h-[200px]" data-testid={`synced-chart-${period}`}>
      <div ref={chartContainerRef} className="w-full h-full" />
      <div className="absolute top-2 left-2 text-text-secondary text-xs">
        {stockCode} / {period}
      </div>
    </div>
  );
}