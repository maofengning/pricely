# Hook Guidelines

> How hooks are used in this project.

---

## Overview

- Custom hooks encapsulate reusable stateful logic
- Follow `use*` naming convention
- Keep hooks focused on single responsibility
- Use TypeScript for hook signatures

---

## Custom Hook Patterns

### Basic Hook Structure

```tsx
// hooks/useAuth.ts
import { useState, useCallback } from 'react';
import { authService } from '@/services/auth';
import type { User, AuthState } from '@/types/user';

export function useAuth(): AuthState & {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
} {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await authService.login(email, password);
      setUser(result.user);
      localStorage.setItem('token', result.token);
    } catch (err) {
      setError('登录失败，请检查邮箱和密码');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('token');
  }, []);

  return { user, isLoading, error, login, logout };
}
```

### Hook with Cleanup

```tsx
// hooks/useWebSocket.ts
import { useEffect, useRef } from 'react';

export function useWebSocket(url: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    wsRef.current = new WebSocket(url);

    wsRef.current.onopen = () => setConnected(true);
    wsRef.current.onclose = () => setConnected(false);

    return () => {
      wsRef.current?.close();
    };
  }, [url]);

  return { connected, ws: wsRef.current };
}
```

---

## Data Fetching Hooks

### 标准数据获取模式

```tsx
// hooks/useKline.ts
import { useState, useEffect, useCallback } from 'react';
import { marketService } from '@/services/market';
import type { CandleData } from '@/types/chart';

export function useKline(stockCode: string, period: string) {
  const [data, setData] = useState<CandleData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
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
  }, [stockCode, period]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
```

### 操作类 Hook

```tsx
// hooks/useTrade.ts
import { useState, useCallback } from 'react';
import { tradeService } from '@/services/trade';
import type { OrderCreate, Order } from '@/types/trade';

export function useTrade() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  const createOrder = useCallback(async (order: OrderCreate) => {
    setLoading(true);
    try {
      const result = await tradeService.createOrder(order);
      setOrders(prev => [...prev, result]);
      return result;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const result = await tradeService.getOrders();
      setOrders(result);
    } finally {
      setLoading(false);
    }
  }, []);

  return { orders, loading, createOrder, fetchOrders };
}
```

---

## Naming Conventions

| Hook | Purpose |
|------|---------|
| `useAuth` | Authentication state and actions |
| `useChart` | Chart operations and state |
| `useWebSocket` | WebSocket connection management |
| `useTrade` | Trading operations |
| `useKline` | K-line data fetching |
| `usePattern` | Pattern annotation operations |
| `useDebounce` | Debounce value changes |
| `useLocalStorage` | Sync state with localStorage |

---

## Hook Rules

1. **Only call hooks at top level** - Not inside loops, conditions, or nested functions
2. **Only call hooks from React functions** - Components or other hooks
3. **Return stable values** - Use `useMemo` for derived data
4. **Cleanup side effects** - Return cleanup function from `useEffect`

---

## Common Mistakes

| Mistake | Why | Fix |
|---------|-----|-----|
| Missing cleanup in useEffect | Memory leaks | Return cleanup function |
| Not using useCallback for handlers | Re-renders on every parent update | Wrap with useCallback |
| Stale closure in async hooks | Uses old state values | Use ref or update pattern |
| Too many hooks in one file | Hard to test, reuse | Split into focused hooks |
| Direct DOM manipulation in hooks | React conflicts | Use refs sparingly |