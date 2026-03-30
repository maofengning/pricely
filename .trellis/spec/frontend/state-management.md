# State Management

> How state is managed in this project.

---

## Overview

- **Local state**: `useState` for component-local state
- **Global state**: Zustand (lightweight, TypeScript-friendly)
- **Server state**: 自定义 Hooks + API 调用（本项目不使用 React Query）
- **URL state**: React Router for navigation params

---

## State Categories

| Category | Tool | Example |
|----------|------|---------|
| **Local UI state** | useState | Modal open/close, form inputs |
| **Global app state** | Zustand | User session, theme, sidebar state |
| **Server data** | 自定义 Hooks + API | K-lines, orders, patterns |
| **URL state** | React Router | Stock code, period from URL |

---

## When to Use Global State

Use Zustand when:

1. State is accessed by multiple components across the tree
2. State persists across navigation (user session, theme)
3. Complex state updates that benefit from centralized logic

Don't use global state for:

1. Form inputs (use local state)
2. Component visibility (use local state)
3. Server data (use custom hooks)

---

## Zustand Store Pattern

```tsx
// stores/userStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types/user';

interface UserState {
  user: User | null;
  token: string | null;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      logout: () => set({ user: null, token: null }),
    }),
    { name: 'user-storage' }
  )
);

// Usage in component
function Header() {
  const { user, logout } = useUserStore();
  return user ? <span>{user.nickname}</span> : <span>未登录</span>;
}
```

---

## Server Data with Custom Hooks

服务端数据通过自定义 Hook 获取，不放入 Zustand：

```tsx
// hooks/useKline.ts
import { useState, useEffect } from 'react';
import { marketService } from '@/services/market';
import type { CandleData } from '@/types/chart';

export function useKline(stockCode: string, period: string) {
  const [data, setData] = useState<CandleData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await marketService.getKline(stockCode, period);
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, [stockCode, period]);

  return { data, loading, error, refetch: fetch };
}

// hooks/useOrders.ts
export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const result = await tradeService.getOrders();
      setOrders(result);
    } finally {
      setLoading(false);
    }
  };

  const createOrder = async (order: OrderCreate) => {
    const result = await tradeService.createOrder(order);
    setOrders(prev => [...prev, result]);
    return result;
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return { orders, loading, createOrder, refetch: fetchOrders };
}
```

---

## URL State

```tsx
// pages/Home.tsx
import { useParams, useSearchParams } from 'react-router-dom';

function Home() {
  const { stockCode } = useParams();  // From /stock/:stockCode
  const [searchParams] = useSearchParams();
  const period = searchParams.get('period') || 'daily';

  return <ChartContainer stockCode={stockCode} period={period} />;
}
```

---

## State Update Patterns

### Zustand Updates

```tsx
// Good: Direct update
set({ user: newUser });

// Good: Partial update
set((state) => ({ ...state, user: newUser }));

// Good: Async update (call inside action)
async fetchUser(id: string) {
  const user = await authService.getUser(id);
  set({ user });
}
```

### Custom Hook Updates

```tsx
// 重新获取数据
const { data, loading, refetch } = useKline(stockCode, period);

// 手动刷新
<Button onClick={refetch}>刷新数据</Button>

// 创建后更新列表
const { orders, createOrder } = useOrders();
await createOrder(newOrder);  // 自动更新 orders 列表
```

---

## Common Mistakes

| Mistake | Why | Fix |
|---------|-----|-----|
| Prop drilling everything | Hard to maintain | Use appropriate state solution |
| Using global state for server data | Cache duplication, sync issues | Use custom hooks |
| Not persisting session | Lost on refresh | Use Zustand persist middleware |
| Stale server data | UI inconsistent | Add refetch mechanism in hooks |
| Overusing context | Re-renders all consumers | Use Zustand for complex state |
| Missing loading/error states | Poor UX | Always handle loading & error |