# Type Safety

> Type safety patterns in this project.

---

## Overview

- **Type system**: TypeScript 5.x strict mode
- **Validation**: Zod for runtime validation (optional)
- **Naming**: camelCase for API responses (matches backend output)
- **Organization**: Types organized by feature domain

---

## Type Organization

### Types Directory

```
types/
├── chart.ts      # Chart-related types
├── trade.ts      # Trading-related types
├── log.ts        # Log-related types
├── pattern.ts    # Pattern annotation types
├── user.ts       # User authentication types
└── api.ts        # Common API response types
```

### Type File Structure

```tsx
// types/trade.ts

// Enums
export type OrderType = 'buy' | 'sell';
export type OrderMode = 'market' | 'limit';
export type OrderStatus = 'pending' | 'filled' | 'cancelled';

// Core types (match API response shape - camelCase)
export interface Order {
  id: string;
  stockCode: string;
  stockName: string;
  orderType: OrderType;
  orderMode: OrderMode;
  limitPrice?: number;
  quantity: number;
  filledPrice?: number;
  filledAt?: string;
  status: OrderStatus;
  createdAt: string;
}

// Request types
export interface OrderCreate {
  stockCode: string;
  orderType: OrderType;
  orderMode: OrderMode;
  quantity: number;
  limitPrice?: number;
}

// Response types
export interface OrderResponse {
  id: string;
  stockCode: string;
  status: OrderStatus;
}

// Pagination
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
```

---

## Common Patterns

### Generic Utility Types

```tsx
// types/api.ts

// API Error response
export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

// Async state
export interface AsyncState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

// Partial updates
export type PartialUpdate<T> = Partial<Omit<T, 'id' | 'createdAt'>>;
```

### Type Guards

```tsx
// utils/typeGuards.ts
import type { ApiError } from '@/types/api';

export function isApiError(response: unknown): response is ApiError {
  return (
    typeof response === 'object' &&
    response !== null &&
    'error' in response &&
    typeof response.error === 'object'
  );
}

// Usage
const result = await api.createOrder(order);
if (isApiError(result)) {
  setError(result.error.message);
}
```

---

## Runtime Validation (Optional)

Use Zod for critical input validation:

```tsx
// schemas/orderSchema.ts
import { z } from 'zod';

export const orderCreateSchema = z.object({
  stockCode: z.string().min(6).max(10),
  orderType: z.enum(['buy', 'sell']),
  orderMode: z.enum(['market', 'limit']),
  quantity: z.number().int().positive().max(100000),
  limitPrice: z.number().positive().optional(),
});

// In component
const handleSubmit = () => {
  const result = orderCreateSchema.safeParse(formData);
  if (!result.success) {
    setErrors(result.error.errors);
    return;
  }
  createOrder(result.data);
};
```

---

## Forbidden Patterns

| Pattern | Why | Correct |
|---------|-----|---------|
| `any` type | Loses type safety | Use specific type or `unknown` |
| Type assertion `as Type` | Runtime errors possible | Use type guards |
| Inline type definitions | Hard to reuse | Define in types/ |
| Mixed naming (snake_case) | Inconsistent with API | Use camelCase everywhere |
| `interface` vs `type` confusion | Confusion | Use `interface` for objects, `type` for unions/aliases |

---

## API Response Mapping

Backend returns camelCase (ORM handles snake_case → camelCase):

```tsx
// Backend DB: trade_count, win_rate
// Backend API: tradeCount, winRate
// Frontend: Use same camelCase names

export interface TradeReport {
  tradeCount: number;
  winCount: number;
  lossCount: number;
  winRate: number;
  netProfit: number;
  maxDrawdown: number;
}
```

---

## Strict TypeScript Config

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true
  }
}
```