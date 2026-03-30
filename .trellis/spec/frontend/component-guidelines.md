# Component Guidelines

> How components are built in this project.

---

## Overview

- **Framework**: React 18 with TypeScript
- **Styling**: CSS modules or Tailwind CSS (to be decided)
- **Chart library**: lightweight-charts (TradingView open-source)
- **UI Style**: TradingView-inspired dark theme, clean layout

---

## Component Structure

### File Template

```tsx
// components/Chart/CandleChart.tsx
import { useEffect, useRef } from 'react';
import { createChart, IChartApi } from 'lightweight-charts';
import type { CandleData } from '@/types/chart';
import styles from './CandleChart.module.css';

interface CandleChartProps {
  data: CandleData[];
  stockCode: string;
  period: string;
  onPriceSelect?: (price: number) => void;
}

export function CandleChart({
  data,
  stockCode,
  period,
  onPriceSelect
}: CandleChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    chartRef.current = createChart(chartContainerRef.current, {
      layout: {
        background: { type: 'solid', color: '#1e1e1e' },
        textColor: '#d1d4dc',
      },
      width: chartContainerRef.current.clientWidth,
      height: 500,
    });

    // Add candlestick series
    const candlestickSeries = chartRef.current.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
    });

    candlestickSeries.setData(data);

    return () => {
      chartRef.current?.remove();
    };
  }, [data]);

  return (
    <div
      ref={chartContainerRef}
      className={styles.chartContainer}
      data-testid="candle-chart"
    />
  );
}
```

---

## Props Conventions

### Props Interface

Always define Props interface with TypeScript:

```tsx
interface OrderFormProps {
  // Required props first
  stockCode: string;

  // Optional props with defaults
  orderType?: 'buy' | 'sell';  // default: 'buy'
  quantity?: number;           // default: 100

  // Event handlers
  onSubmit?: (order: OrderCreate) => void;
  onCancel?: () => void;

  // Render props / children
  children?: React.ReactNode;
}
```

### Default Props

Use default values in function signature:

```tsx
export function OrderForm({
  stockCode,
  orderType = 'buy',
  quantity = 100,
  onSubmit,
}: OrderFormProps) {
  // ...
}
```

---

## Styling Patterns

### CSS Modules (Preferred)

```css
/* OrderForm.module.css */
.orderForm {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  background: var(--color-bg-secondary);
}

.inputGroup {
  display: flex;
  align-items: center;
  gap: 8px;
}

.submitButton {
  background: var(--color-primary);
  color: white;
  padding: 12px 24px;
}
```

### Tailwind CSS (Alternative)

```tsx
export function OrderForm({ stockCode }: OrderFormProps) {
  return (
    <div className="flex flex-col gap-4 p-5 bg-slate-800">
      {/* ... */}
    </div>
  );
}
```

---

## Accessibility

- Use semantic HTML (`button`, `form`, `input`)
- Add `aria-label` for icon-only buttons
- Ensure keyboard navigation works
- Use sufficient color contrast (4.5:1 minimum)

```tsx
<Button
  onClick={handleSubmit}
  aria-label="提交订单"
  disabled={isLoading}
>
  {isLoading ? '处理中...' : '提交'}
</Button>
```

---

## Component Categories

| Category | Purpose | Example |
|----------|---------|---------|
| **Container** | State management, data fetching | `ChartContainer`, `TradePanel` |
| **Presentational** | Pure UI, no business logic | `Button`, `Modal`, `OHLCDisplay` |
| **Form** | User input handling | `OrderForm`, `LoginForm` |
| **Layout** | Page structure | `Header`, `Sidebar`, `PageWrapper` |

---

## Common Mistakes

| Mistake | Why | Fix |
|---------|-----|-----|
| Props drilling deep | Hard to maintain | Use context or lift state |
| Inline styles in JSX | Hard to read, no theme | Use CSS modules |
| No TypeScript for props | Runtime errors | Always define Props interface |
| Huge useEffect | Hard to debug | Split into smaller effects |
| Missing key in lists | React warning | Use unique id as key |
| Direct DOM manipulation | React conflict | Use refs sparingly |