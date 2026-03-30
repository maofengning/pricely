# State Management

> How state is managed in this project.

---

## Overview

- **Local state**: `useState` for component-local state
- **Global state**: Zustand (lightweight, TypeScript-friendly)
- **Server state**: React Query (caching, synchronization)
- **URL state**: React Router for navigation params

---

## State Categories

| Category | Tool | Example |
|----------|------|---------|
| **Local UI state** | useState | Modal open/close, form inputs |
| **Global app state** | Zustand | User session, theme, sidebar state |
| **Server data** | React Query | K-lines, orders, patterns |
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
3. Server data (use React Query)

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

## React Query for Server State

```tsx
// hooks/useKline.ts
import { useQuery, useMutation } from '@tanstack/react-query';
import { marketService } from '@/services/market';

export function useKline(stockCode: string, period: string) {
  return useQuery({
    queryKey: ['kline', stockCode, period],
    queryFn: () => marketService.getKline(stockCode, period),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (order: OrderCreate) => tradeService.createOrder(order),
    onSuccess: () => {
      // Invalidate orders query to refetch
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
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

### React Query Updates

```tsx
// Invalidate to refetch
queryClient.invalidateQueries({ queryKey: ['orders'] });

// Set data directly
queryClient.setQueryData(['kline', stockCode, period], newData);

// Optimistic update
useMutation({
  mutationFn: updateOrder,
  onMutate: async (newOrder) => {
    await queryClient.cancelQueries({ queryKey: ['orders'] });
    const previous = queryClient.getQueryData(['orders']);
    queryClient.setQueryData(['orders'], (old) => [...old, newOrder]);
    return { previous };
  },
  onError: (err, newOrder, context) => {
    queryClient.setQueryData(['orders'], context.previous);
  },
});
```

---

## Common Mistakes

| Mistake | Why | Fix |
|---------|-----|-----|
| Prop drilling everything | Hard to maintain | Use appropriate state solution |
| Using global state for server data | Cache duplication | Use React Query |
| Not persisting session | Lost on refresh | Use Zustand persist middleware |
| Stale server data | UI inconsistent | Use React Query invalidation |
| Overusing context | Re-renders all consumers | Use Zustand for complex state |