import { useEffect, useRef, useCallback } from 'react';
import type { IChartApi, ISeriesApi, Time } from 'lightweight-charts';
import type { Drawing, DrawingPoint, DrawingToolType } from '@/types/drawing';
import { useDrawingStore } from '@/stores/drawingStore';

// Drawing colors
const COLORS = {
  support: '#26a69a',
  resistance: '#ef5350',
  trend_up: '#26a69a',
  trend_down: '#ef5350',
  fibonacci: '#2962ff',
  channel: '#ffa726',
  selected: '#ffffff',
  ai_detected: '#9c27b0', // Purple for AI-detected levels
};

interface DrawingLayerProps {
  chart: IChartApi;
  series: ISeriesApi<'Candlestick'>;
  containerRef: HTMLDivElement;
}

/**
 * Component that renders drawings as a canvas overlay on the chart
 */
export function DrawingLayer({ chart, series, containerRef }: DrawingLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { drawings, selectedDrawingId, showDrawings, activeTool, drawingPoints } = useDrawingStore();

  /**
   * Convert time to x coordinate
   */
  const timeToX = useCallback((time: number): number => {
    try {
      return chart.timeScale().timeToCoordinate(time as Time) ?? 0;
    } catch {
      return 0;
    }
  }, [chart]);

  /**
   * Convert price to y coordinate
   */
  const priceToY = useCallback((price: number): number => {
    try {
      return series.priceToCoordinate(price) ?? 0;
    } catch {
      return 0;
    }
  }, [series]);

  /**
   * Render temporary points while drawing
   */
  const renderTemporaryPoints = useCallback(
    (ctx: CanvasRenderingContext2D, points: DrawingPoint[], tool: DrawingToolType) => {
      ctx.save();

      // Draw points
      ctx.fillStyle = COLORS.selected;
      for (const point of points) {
        const x = timeToX(point.time);
        const y = priceToY(point.price);

        ctx.beginPath();
        ctx.arc(x, y, 6, 0, 2 * Math.PI);
        ctx.fill();
      }

      // Draw connecting line for multi-point tools
      if (points.length > 1 && tool !== 'horizontal_line') {
        ctx.strokeStyle = COLORS.selected;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(timeToX(points[0].time), priceToY(points[0].price));
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(timeToX(points[i].time), priceToY(points[i].price));
        }
        ctx.stroke();
      }

      ctx.restore();
    },
    [timeToX, priceToY]
  );

  /**
   * Render horizontal line (support/resistance)
   */
  const renderHorizontalLine = useCallback(
    (ctx: CanvasRenderingContext2D, drawing: Drawing, isSelected: boolean) => {
      if (drawing.toolType !== 'horizontal_line') return;

      const y = priceToY(drawing.price);
      const color = drawing.isAiDetected
        ? COLORS.ai_detected
        : drawing.levelType === 'support'
          ? COLORS.support
          : COLORS.resistance;

      ctx.strokeStyle = isSelected ? COLORS.selected : color;
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.setLineDash(drawing.isAiDetected ? [8, 4] : [4, 4]);

      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(ctx.canvas.width, y);
      ctx.stroke();

      // Draw label
      ctx.fillStyle = isSelected ? COLORS.selected : color;
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'right';
      const label = drawing.isAiDetected
        ? `${drawing.price.toFixed(2)} (AI)`
        : `${drawing.price.toFixed(2)} (${drawing.levelType === 'support' ? '支' : '阻'})`;
      ctx.fillText(label, ctx.canvas.width - 5, y - 5);

      // Draw strength indicator if available
      if (drawing.strength) {
        ctx.fillStyle = color;
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`强度: ${drawing.strength}`, 5, y + 15);
      }
    },
    [priceToY]
  );

  /**
   * Render trend line
   */
  const renderTrendLine = useCallback(
    (ctx: CanvasRenderingContext2D, drawing: Drawing, isSelected: boolean) => {
      if (drawing.toolType !== 'trend_line') return;

      const startX = timeToX(drawing.startPoint.time);
      const startY = priceToY(drawing.startPoint.price);
      const endX = timeToX(drawing.endPoint.time);
      const endY = priceToY(drawing.endPoint.price);

      const color = drawing.trendType === 'up' ? COLORS.trend_up : COLORS.trend_down;

      ctx.strokeStyle = isSelected ? COLORS.selected : color;
      ctx.lineWidth = isSelected ? 2 : 1;

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      // Draw endpoint markers
      ctx.fillStyle = isSelected ? COLORS.selected : color;
      ctx.beginPath();
      ctx.arc(startX, startY, 4, 0, 2 * Math.PI);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(endX, endY, 4, 0, 2 * Math.PI);
      ctx.fill();

      // Draw label
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(drawing.trendType === 'up' ? '上升趋势' : '下降趋势', (startX + endX) / 2, startY - 10);
    },
    [timeToX, priceToY]
  );

  /**
   * Render parallel channel
   */
  const renderChannel = useCallback(
    (ctx: CanvasRenderingContext2D, drawing: Drawing, isSelected: boolean) => {
      if (drawing.toolType !== 'parallel_channel') return;

      const startX = timeToX(drawing.mainLineStart.time);
      const startY = priceToY(drawing.mainLineStart.price);
      const endX = timeToX(drawing.mainLineEnd.time);
      const endY = priceToY(drawing.mainLineEnd.price);

      const parallelStartY = priceToY(drawing.mainLineStart.price + drawing.parallelLineOffset);
      const parallelEndY = priceToY(drawing.mainLineEnd.price + drawing.parallelLineOffset);

      const color = COLORS.channel;

      ctx.strokeStyle = isSelected ? COLORS.selected : color;
      ctx.lineWidth = isSelected ? 2 : 1;

      // Main line
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      // Parallel line
      ctx.beginPath();
      ctx.moveTo(startX, parallelStartY);
      ctx.lineTo(endX, parallelEndY);
      ctx.stroke();

      // Fill channel area
      ctx.fillStyle = `${color}30`;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.lineTo(endX, parallelEndY);
      ctx.lineTo(startX, parallelStartY);
      ctx.closePath();
      ctx.fill();
    },
    [timeToX, priceToY]
  );

  /**
   * Render Fibonacci retracement
   */
  const renderFibonacciRetracement = useCallback(
    (ctx: CanvasRenderingContext2D, drawing: Drawing, isSelected: boolean) => {
      if (drawing.toolType !== 'fibonacci_retracement') return;

      const startX = timeToX(drawing.startPoint.time);
      const endX = timeToX(drawing.endPoint.time);

      const color = COLORS.fibonacci;
      const levelColors = ['#ef5350', '#ffa726', '#26a69a', '#ab47bc', '#78909c', '#2962ff'];

      // Draw main line
      const startY = priceToY(drawing.startPoint.price);
      const endY = priceToY(drawing.endPoint.price);

      ctx.strokeStyle = isSelected ? COLORS.selected : color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      // Draw Fibonacci level lines
      const sortedLevels = Object.entries(drawing.levels).sort(
        ([a], [b]) => parseFloat(a) - parseFloat(b)
      );

      sortedLevels.forEach(([levelName, price], index) => {
        const y = priceToY(price);
        const levelColor = levelColors[index % levelColors.length];

        ctx.strokeStyle = isSelected ? COLORS.selected : levelColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
        ctx.stroke();

        // Draw label
        ctx.fillStyle = isSelected ? COLORS.selected : levelColor;
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`${levelName} (${price.toFixed(2)})`, endX - 5, y - 3);
      });
    },
    [timeToX, priceToY]
  );

  /**
   * Render Fibonacci extension
   */
  const renderFibonacciExtension = useCallback(
    (ctx: CanvasRenderingContext2D, drawing: Drawing, isSelected: boolean) => {
      if (drawing.toolType !== 'fibonacci_extension') return;

      const startX = timeToX(drawing.startPoint.time);
      const extX = timeToX(drawing.extensionPoint.time);

      const color = COLORS.fibonacci;
      const levelColors = ['#ef5350', '#ffa726', '#26a69a', '#ab47bc', '#78909c', '#2962ff'];

      // Draw main lines
      const startY = priceToY(drawing.startPoint.price);
      const endY = priceToY(drawing.endPoint.price);
      const extY = priceToY(drawing.extensionPoint.price);

      ctx.strokeStyle = isSelected ? COLORS.selected : color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(timeToX(drawing.endPoint.time), endY);
      ctx.lineTo(extX, extY);
      ctx.stroke();

      // Draw Fibonacci level lines from extension point
      const sortedLevels = Object.entries(drawing.levels).sort(
        ([a], [b]) => parseFloat(a) - parseFloat(b)
      );

      sortedLevels.forEach(([levelName, price], index) => {
        const y = priceToY(price);
        const levelColor = levelColors[index % levelColors.length];

        ctx.strokeStyle = isSelected ? COLORS.selected : levelColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(startX, y);
        ctx.lineTo(extX, y);
        ctx.stroke();

        // Draw label
        ctx.fillStyle = isSelected ? COLORS.selected : levelColor;
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`${levelName} (${price.toFixed(2)})`, extX - 5, y - 3);
      });
    },
    [timeToX, priceToY]
  );

  /**
   * Render a single drawing
   */
  const renderDrawing = useCallback(
    (ctx: CanvasRenderingContext2D, drawing: Drawing, isSelected: boolean) => {
      ctx.save();

      switch (drawing.toolType) {
        case 'horizontal_line':
          renderHorizontalLine(ctx, drawing, isSelected);
          break;
        case 'trend_line':
          renderTrendLine(ctx, drawing, isSelected);
          break;
        case 'parallel_channel':
          renderChannel(ctx, drawing, isSelected);
          break;
        case 'fibonacci_retracement':
          renderFibonacciRetracement(ctx, drawing, isSelected);
          break;
        case 'fibonacci_extension':
          renderFibonacciExtension(ctx, drawing, isSelected);
          break;
      }

      ctx.restore();
    },
    [renderHorizontalLine, renderTrendLine, renderChannel, renderFibonacciRetracement, renderFibonacciExtension]
  );

  /**
   * Render all drawings
   */
  const renderDrawings = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !showDrawings) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Render each drawing
    for (const drawing of drawings) {
      renderDrawing(ctx, drawing, drawing.id === selectedDrawingId);
    }

    // Render current drawing points (while drawing)
    if (activeTool && drawingPoints.length > 0) {
      renderTemporaryPoints(ctx, drawingPoints, activeTool);
    }
  }, [drawings, selectedDrawingId, showDrawings, activeTool, drawingPoints, renderDrawing, renderTemporaryPoints]);

  // Create canvas overlay
  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none'; // Allow clicks to pass through
    canvas.style.zIndex = '10';

    containerRef.appendChild(canvas);
    canvasRef.current = canvas;

    // Handle resize
    const handleResize = () => {
      if (canvas && containerRef) {
        canvas.width = containerRef.clientWidth;
        canvas.height = containerRef.clientHeight;
        renderDrawings();
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (containerRef.contains(canvas)) {
        containerRef.removeChild(canvas);
      }
      canvasRef.current = null;
    };
  }, [containerRef, renderDrawings]);

  // Re-render when drawings change
  useEffect(() => {
    renderDrawings();
  }, [renderDrawings]);

  // Subscribe to chart updates for re-rendering
  useEffect(() => {
    const handleVisibleRangeChange = () => {
      renderDrawings();
    };

    chart.timeScale().subscribeVisibleLogicalRangeChange(handleVisibleRangeChange);

    return () => {
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(handleVisibleRangeChange);
    };
  }, [chart, renderDrawings]);

  return null; // Canvas is rendered as overlay
}