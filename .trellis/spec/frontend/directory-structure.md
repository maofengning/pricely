# Directory Structure

> How frontend code is organized in this project.

---

## Overview

Frontend follows a feature-based organization with clear separation between components, pages, services, and utilities.

---

## Directory Layout

```
frontend/
├── src/
│   ├── components/
│   │   ├── Chart/
│   │   │   ├── ChartContainer.tsx      # 图表容器，集成lightweight-charts
│   │   │   ├── CandleChart.tsx         # K线图主体
│   │   │   ├── OHLCDisplay.tsx         # OHLC信息展示组件
│   │   │   ├── MultiPeriodPanel.tsx    # 多周期联动面板
│   │   │   ├── ChartStyleSettings.tsx  # K线样式设置
│   │   │   ├── SupportResistanceTools.tsx  # 支撑阻力绘制工具栏
│   │   │   ├── FibonacciTools.tsx      # 斐波那契工具
│   │   │   └── PriceLevelMarker.tsx    # 价格位标注组件
│   │   ├── Pattern/
│   │   │   ├── PatternMarker.tsx       # 形态标注工具
│   │   │   ├── PatternList.tsx         # 形态列表侧边栏
│   │   │   ├── PatternEditor.tsx       # 形态编辑弹窗
│   │   │   └── PeriodSelector.tsx      # K线周期选择器
│   │   ├── Trade/
│   │   │   ├── TradePanel.tsx          # 交易面板
│   │   │   ├── PositionManager.tsx     # 持仓管理组件
│   │   │   ├── OrderBook.tsx           # 订单列表
│   │   │   ├── FundManager.tsx         # 资金管理组件
│   │   │   ├── TradeReport.tsx         # 交易报表组件
│   │   │   └── OrderForm.tsx           # 下单表单
│   │   ├── Log/
│   │   │   ├── TradeLog.tsx            # 交易日志主界面
│   │   │   ├── LogEntry.tsx            # 单条日志条目
│   │   │   ├── LogSearch.tsx           # 日志搜索组件
│   │   │   ├── LogFilter.tsx           # 日志筛选组件
│   │   │   └── LogEditor.tsx           # 日志编辑弹窗
│   │   ├── Auth/
│   │   │   ├── LoginForm.tsx           # 登录表单
│   │   │   ├── RegisterForm.tsx        # 注册表单
│   │   │   ├── UserProfile.tsx         # 用户信息页
│   │   │   └── Settings.tsx            # 用户设置
│   │   ├── Compliance/
│   │   │   ├── RiskWarningBanner.tsx   # 风险提示横幅
│   │   │   ├── RiskWarningModal.tsx    # 风险提示弹窗
│   │   │   └── WarningContent.tsx      # 提示内容组件
│   │   └── common/
│   │       ├── Header.tsx              # 导航栏
│   │       ├── Sidebar.tsx             # 侧边栏
│   │       ├── Loading.tsx             # 加载状态
│   │       ├── Modal.tsx               # 通用弹窗
│   │       ├── Button.tsx              # 通用按钮
│   │       └── Input.tsx               # 通用输入框
│   ├── pages/
│   │   ├── Home.tsx                    # 首页（图表+形态标注）
│   │   ├── Trade.tsx                   # 模拟交易页面
│   │   ├── Log.tsx                     # 交易日志页面
│   │   ├── Report.tsx                  # 报表页面
│   │   ├── Login.tsx                   # 登录页
│   │   └── Register.tsx                # 注册页
│   ├── services/
│   │   ├── api.ts                      # REST API调用封装
│   │   ├── websocket.ts                # WebSocket连接管理
│   │   ├── auth.ts                     # 认证相关API
│   │   ├── market.ts                   # 行情相关API
│   │   ├── trade.ts                    # 交易相关API
│   │   ├── log.ts                      # 日志相关API
│   │   ├── pattern.ts                  # 标注相关API
│   │   └── ai.ts                       # AI识别相关API
│   ├── stores/
│   │   ├── userStore.ts                # 用户状态
│   │   ├── chartStore.ts               # 图表状态
│   │   ├── tradeStore.ts               # 交易状态
│   │   ├── logStore.ts                 # 日志状态
│   │   └── patternStore.ts             # 标注状态
│   ├── hooks/
│   │   ├── useAuth.ts                  # 认证钩子
│   │   ├── useChart.ts                 # 图表操作钩子
│   │   ├── useWebSocket.ts             # WebSocket钩子
│   │   ├── useTrade.ts                 # 交易操作钩子
│   │   └── usePattern.ts               # 形态标注钩子
│   ├── utils/
│   │   ├── chartUtils.ts               # 图表工具函数
│   │   ├── dateUtils.ts                # 日期处理
│   │   ├── mathUtils.ts                # 数学计算（斐波那契等）
│   │   └── validators.ts               # 表单验证
│   └── types/
│       ├── chart.ts                    # 图表相关类型
│       ├── trade.ts                    # 交易相关类型
│       ├── log.ts                      # 日志相关类型
│       ├── pattern.ts                  # 标注相关类型
│       └── user.ts                     # 用户相关类型
├── public/
│   └── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts                      # Vite配置
└── Dockerfile
```

---

## Module Organization

### Feature-Based Components

Group components by feature domain:

```
components/
├── Chart/      # All chart-related components
├── Trade/      # All trading-related components
├── Pattern/    # All pattern annotation components
├── Log/        # All log-related components
├── Auth/       # All authentication components
├── Compliance/ # All compliance/warning components
└── common/     # Shared/reusable components
```

### Pages

Pages compose components and are route targets:

```tsx
// pages/Home.tsx
import { ChartContainer } from '@/components/Chart/ChartContainer';
import { PatternList } from '@/components/Pattern/PatternList';
import { Header } from '@/components/common/Header';

export function Home() {
  return (
    <>
      <Header />
      <ChartContainer />
      <PatternList />
    </>
  );
}
```

---

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| **Component files** | PascalCase | `TradePanel.tsx`, `OrderForm.tsx` |
| **Hook files** | camelCase with `use` prefix | `useAuth.ts`, `useChart.ts` |
| **Service files** | camelCase | `api.ts`, `websocket.ts` |
| **Store files** | camelCase with `Store` suffix | `tradeStore.ts`, `userStore.ts` |
| **Type files** | camelCase | `trade.ts`, `pattern.ts` |
| **Utility files** | camelCase | `chartUtils.ts`, `dateUtils.ts` |
| **CSS modules** | Same as component | `TradePanel.module.css` |

---

## Examples

### Component File Structure

```tsx
// components/Trade/OrderForm.tsx
import { useState } from 'react';
import { Button } from '@/components/common/Button';
import { useTrade } from '@/hooks/useTrade';
import type { OrderCreate } from '@/types/trade';

interface OrderFormProps {
  stockCode: string;
  onSubmit: (order: OrderCreate) => void;
}

export function OrderForm({ stockCode, onSubmit }: OrderFormProps) {
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy');
  const [quantity, setQuantity] = useState(100);
  const { createOrder, isLoading } = useTrade();

  const handleSubmit = async () => {
    await createOrder({ stockCode, orderType, quantity });
  };

  return (
    <div className="order-form">
      {/* Form content */}
    </div>
  );
}
```

---

## Anti-Patterns

| Anti-Pattern | Why | Correct |
|--------------|-----|---------|
| Components in flat structure | Hard to find related files | Group by feature |
| Business logic in components | Hard to test, duplicate logic | Use hooks/services |
| Inline styles everywhere | Hard to maintain, no theme | Use CSS modules or Tailwind |
| Generic folder names (`utils`, `helpers`) | Unclear what's inside | Specific names (`chartUtils`) |
| Giant page components | Hard to read, test | Compose smaller components |