# Component Guidelines

> How components are built in this project.

---

## Overview

- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS（已确定）
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

### Tailwind CSS（本项目采用）

```tsx
export function OrderForm({ stockCode }: OrderFormProps) {
  return (
    <div className="flex flex-col gap-4 p-5 bg-gray-800 rounded-lg">
      <div className="flex items-center gap-2">
        <label className="text-gray-300 w-20">股票代码</label>
        <input className="px-3 py-2 bg-gray-700 rounded text-white" />
      </div>
      <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded">
        提交
      </button>
    </div>
  );
}
```

### 类名顺序规范

```tsx
// ✅ 推荐：按功能分组（布局 → 尺寸 → 间距 → 颜色 → 状态）
<div className="flex items-center justify-between w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600">

// ❌ 不推荐：随机顺序
<div className="hover:bg-gray-700 flex px-4 bg-gray-800 w-full py-2 rounded-lg">
```

### 复杂样式抽离

```tsx
// ✅ 推荐：样式超过 5 个时抽离为变量或使用 clsx
import clsx from 'clsx';

const chartContainerStyle = "relative w-full h-[600px] bg-gray-900 rounded-lg border border-gray-700";

// 条件样式
<button className={clsx(
  "px-4 py-2 rounded font-medium",
  isPrimary ? "bg-blue-500 text-white hover:bg-blue-600" : "bg-gray-200 text-gray-800 hover:bg-gray-300"
)}>
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