# Quality Guidelines

> Code quality standards for frontend development.

---

## Overview

- **Linting**: ESLint with TypeScript rules
- **Type checking**: TypeScript strict mode
- **Testing**: Vitest (fast, Vite-native) + React Testing Library
- **Code coverage**: Minimum 70%

---

## Pre-Commit Checklist

Before any commit:

- [ ] `npm run lint` passes (ESLint)
- [ ] `npm run typecheck` passes (tsc --noEmit)
- [ ] `npm run test` passes (Vitest)
- [ ] No hardcoded API URLs or secrets

---

## Code Standards

### Component Structure

```tsx
// Good: Clean component structure
export function OrderForm({ stockCode, onSubmit }: OrderFormProps) {
  const [formData, setFormData] = useState<OrderCreate>({
    stockCode,
    orderType: 'buy',
    quantity: 100,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {/* Form fields */}
    </form>
  );
}
```

### TypeScript Strict

```tsx
// Good: Explicit types
const orders: Order[] = await tradeService.getOrders();

// Bad: Implicit any
const orders = await tradeService.getOrders(); // TypeScript infers, but be explicit for complex types
```

### Import Aliases

Use `@/` for src imports:

```tsx
// Good
import { Button } from '@/components/common/Button';
import { useAuth } from '@/hooks/useAuth';

// Bad
import { Button } from '../../../components/common/Button';
```

---

## Testing Requirements

### Test Structure

```
tests/
├── components/
│   ├── Chart/
│   │   └── CandleChart.test.tsx
│   └── Trade/
│   │   └── OrderForm.test.tsx
├── hooks/
│   ├── useAuth.test.ts
│   └── useTrade.test.ts
├── utils/
│   └── fibonacci.test.ts
└── setup.ts
```

### Component Test Example

```tsx
// tests/components/Trade/OrderForm.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { OrderForm } from '@/components/Trade/OrderForm';

describe('OrderForm', () => {
  it('renders with stock code', () => {
    render(<OrderForm stockCode="600519" />);
    expect(screen.getByText('600519')).toBeInTheDocument();
  });

  it('calls onSubmit with order data', () => {
    const onSubmit = vi.fn();
    render(<OrderForm stockCode="600519" onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole('button', { name: '提交' }));

    expect(onSubmit).toHaveBeenCalledWith({
      stockCode: '600519',
      orderType: 'buy',
      quantity: 100,
    });
  });
});
```

### Hook Test Example

```tsx
// tests/hooks/useFibonacci.test.ts
import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useFibonacci } from '@/hooks/useFibonacci';

describe('useFibonacci', () => {
  it('calculates retracement levels', () => {
    const { result } = renderHook(() =>
      useFibonacci(100, 80, [0.382, 0.5, 0.618])
    );

    expect(result.current.levels[0.382]).toBeCloseTo(92.38);
    expect(result.current.levels[0.5]).toBe(90);
    expect(result.current.levels[0.618]).toBeCloseTo(87.62);
  });
});
```

---

## Forbidden Patterns

| Pattern | Why Forbidden | Alternative |
|---------|---------------|-------------|
| `dangerouslySetInnerHTML` | XSS risk | Use safe rendering |
| Inline `style={{}}` everywhere | Hard to maintain | Use CSS modules |
| Prop drilling > 3 levels | Hard to refactor | Use context/store |
| `useEffect` for derived state | Re-renders, complexity | Use `useMemo` |
| `any` type | Loses safety | Use `unknown` + type guard |
| Giant components > 200 lines | Hard to test | Split into smaller |
| `index.tsx` exports only | Hard to find | Named exports |

---

## Accessibility Requirements

| Requirement | Implementation |
|-------------|----------------|
| Semantic HTML | Use `<button>`, `<form>`, `<nav>` |
| ARIA labels | Icon buttons need `aria-label` |
| Keyboard nav | Tab order, Enter to submit |
| Focus management | Focus on modal open, restore on close |
| Color contrast | 4.5:1 minimum ratio |

---

## Code Review Checklist

- [ ] TypeScript types defined for all props
- [ ] No forbidden patterns used
- [ ] CSS modules used (not inline styles)
- [ ] Accessibility attributes present
- [ ] Tests cover main functionality
- [ ] No hardcoded strings (use constants)
- [ ] Imports use `@/` alias
- [ ] Component is focused and small |