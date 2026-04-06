import { useEffect, useRef, useState } from 'react';
import {
  createChart,
  ColorType,
  CandlestickSeries,
  createSeriesMarkers,
} from 'lightweight-charts';
import type {
  IChartApi,
  ISeriesApi,
  CandlestickData,
  Time,
  MouseEventParams,
  SeriesMarker,
  ISeriesMarkersPluginApi,
} from 'lightweight-charts';
import { useChartStore } from '@/stores/chartStore';
import { useDrawingStore } from '@/stores/drawingStore';
import { DrawingLayer } from './DrawingLayer';
import {
  createDrawingFromPoints,
  getRequiredPointsForTool,
  getToolLabel,
} from '@/utils/mathUtils';
import type { PatternMarkerData } from '@/types';

interface ChartContainerProps {
  data: CandlestickData<Time>[];
  stockCode: string;
  period?: string;
  markers?: PatternMarkerData[];
  onCrosshairMove?: (data: {
    time: Time;
    open: number;
    high: number;
    low: number;
    close: number;
  } | null) => void;
}

// Types for chart instance state
interface ChartInstanceState {
  chart: IChartApi;
  series: ISeriesApi<'Candlestick'>;
  container: HTMLDivElement;
}

export function ChartContainer({
  data,
  stockCode,
  period = 'daily',
  markers = [],
  onCrosshairMove,
}: ChartContainerProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartInstance, setChartInstance] = useState<ChartInstanceState | null>(null);
  const markersPluginRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);

  const { chartStyle } = useChartStore();
  const { activeTool, drawingPoints } = useDrawingStore();

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const container = chartContainerRef.current;

    // Create chart
    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: '#1e222d' },
        textColor: '#d1d4dc',
      },
      grid: {
        vertLines: { color: '#2a2e39' },
        horzLines: { color: '#2a2e39' },
      },
      width: container.clientWidth,
      height: container.clientHeight,
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

    // Create candlestick series with default colors
    const candlestickSeriesApi = chart.addSeries(CandlestickSeries, {
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderUpColor: '#26a69a',
      borderDownColor: '#ef5350',
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
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

    // Set chart instance state
    setChartInstance({
      chart,
      series: candlestickSeriesApi,
      container,
    });

    // Create markers plugin
    markersPluginRef.current = createSeriesMarkers(candlestickSeriesApi);

    // Handle resize
    const handleResize = () => {
      if (container) {
        chart.applyOptions({
          width: container.clientWidth,
          height: container.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      setChartInstance(null);
      markersPluginRef.current = null;
    };
  }, [onCrosshairMove]);

  // Handle click for drawing
  useEffect(() => {
    if (!chartInstance || !activeTool) return;

    const handleClick = (param: MouseEventParams) => {
      if (!param.time) return;

      // Get the bar data at this time
      const barData = data.find((d) => d.time === param.time);
      if (!barData) return;

      const time = typeof param.time === 'number'
        ? param.time
        : parseFloat(param.time as string);

      const price = barData.close;

      // Add drawing point through store action
      const { addDrawingPoint, addDrawing, setActiveTool } = useDrawingStore.getState();

      addDrawingPoint({ time, price });

      // Check if we have enough points after adding
      const newPoints = useDrawingStore.getState().drawingPoints;
      const requiredPoints = getRequiredPointsForTool(activeTool);

      if (newPoints.length >= requiredPoints) {
        // Create the drawing
        const drawing = createDrawingFromPoints(
          newPoints,
          activeTool,
          stockCode,
          period
        );
        if (drawing) {
          addDrawing(drawing);
          setActiveTool(null);
        }
      }
    };

    chartInstance.chart.subscribeClick(handleClick);

    return () => {
      chartInstance.chart.unsubscribeClick(handleClick);
    };
  }, [chartInstance, activeTool, data, stockCode, period]);

  // Update data
  useEffect(() => {
    if (chartInstance && data.length > 0) {
      chartInstance.series.setData(data);
      chartInstance.chart.timeScale().fitContent();
    }
  }, [chartInstance, data]);

  // Update style
  useEffect(() => {
    if (chartInstance) {
      chartInstance.series.applyOptions({
        upColor: chartStyle.upColor,
        downColor: chartStyle.downColor,
        borderUpColor: chartStyle.upColor,
        borderDownColor: chartStyle.downColor,
        wickUpColor: chartStyle.upColor,
        wickDownColor: chartStyle.downColor,
      });
    }
  }, [chartInstance, chartStyle]);

  // Update markers
  useEffect(() => {
    if (markersPluginRef.current && markers.length > 0) {
      const chartMarkers: SeriesMarker<Time>[] = markers.map((m) => ({
        time: m.time as Time,
        position: m.position,
        color: m.color,
        shape: m.shape,
        text: m.text,
      }));
      markersPluginRef.current.setMarkers(chartMarkers);
    } else if (markersPluginRef.current) {
      markersPluginRef.current.setMarkers([]);
    }
  }, [markers]);

  return (
    <div className="relative w-full h-full min-h-[400px]" data-testid="chart-container">
      <div ref={chartContainerRef} className="w-full h-full" />

      {/* Drawing layer overlay - only render when chart instance is available */}
      {chartInstance && (
        <DrawingLayer
          chart={chartInstance.chart}
          series={chartInstance.series}
          containerRef={chartInstance.container}
        />
      )}

      {/* Stock code and period label */}
      <div className="absolute top-2 left-2 text-text-secondary text-sm z-20">
        {stockCode} · {period}
      </div>

      {/* Drawing mode indicator */}
      {activeTool && (
        <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded z-20">
          绘制模式: {getToolLabel(activeTool)}
          {drawingPoints.length > 0 &&
            ` (${drawingPoints.length}/${getRequiredPointsForTool(activeTool)})`}
        </div>
      )}

      {/* Temporary drawing points indicator */}
      {activeTool && drawingPoints.length > 0 && (
        <div className="absolute bottom-2 left-2 text-text-secondary text-xs z-20">
          点击图表继续绘制，或按 Esc 取消
        </div>
      )}
    </div>
  );
}