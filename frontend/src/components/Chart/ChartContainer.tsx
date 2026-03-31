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
} from 'lightweight-charts';
import { useChartStore } from '@/stores/chartStore';

interface ChartContainerProps {
  data: CandlestickData<Time>[];
  stockCode: string;
  period?: string;
  onCrosshairMove?: (data: {
    time: Time;
    open: number;
    high: number;
    low: number;
    close: number;
  } | null) => void;
}

export function ChartContainer({
  data,
  stockCode,
  period = 'daily',
  onCrosshairMove,
}: ChartContainerProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

  const { chartStyle } = useChartStore();

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create chart
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

    // Create candlestick series
    const candlestickSeriesApi = chart.addSeries(CandlestickSeries, {
      upColor: chartStyle.upColor,
      downColor: chartStyle.downColor,
      borderUpColor: chartStyle.upColor,
      borderDownColor: chartStyle.downColor,
      wickUpColor: chartStyle.upColor,
      wickDownColor: chartStyle.downColor,
    });

    // Set crosshair move callback
    if (onCrosshairMove) {
      chart.subscribeCrosshairMove((param) => {
        if (!param.time || !param.seriesData) {
          onCrosshairMove(null);
          return;
        }

        const seriesData = param.seriesData.get(candlestickSeriesApi);
        if (seriesData && 'open' in seriesData) {
          onCrosshairMove({
            time: param.time,
            open: seriesData.open,
            high: seriesData.high,
            low: seriesData.low,
            close: seriesData.close,
          });
        }
      });
    }

    chartRef.current = chart;
    candlestickSeriesRef.current = candlestickSeriesApi;

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
  }, [chartStyle, onCrosshairMove]);

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
        upColor: chartStyle.upColor,
        downColor: chartStyle.downColor,
        borderUpColor: chartStyle.upColor,
        borderDownColor: chartStyle.downColor,
        wickUpColor: chartStyle.upColor,
        wickDownColor: chartStyle.downColor,
      });
    }
  }, [chartStyle]);

  return (
    <div className="relative w-full h-full min-h-[400px]">
      <div ref={chartContainerRef} className="w-full h-full" />
      <div className="absolute top-2 left-2 text-text-secondary text-sm">
        {stockCode} · {period}
      </div>
    </div>
  );
}