# Quality Guidelines

> Code standards, testing requirements, and forbidden patterns.

---

## Overview

- **Linting**: ruff (fast Python linter)
- **Type checking**: mypy (strict mode)
- **Testing**: pytest with async support
- **Code coverage**: Minimum 70%

---

## Pre-Commit Checklist

Before any commit:

- [ ] `ruff check .` passes
- [ ] `mypy app/` passes
- [ ] `pytest tests/` passes
- [ ] No hardcoded secrets or credentials

---

## Code Standards

### Type Hints (Required)

All functions must have type hints:

```python
# Good
async def create_order(
    user_id: str,
    order: OrderCreate,
    session: AsyncSession
) -> OrderResponse:
    ...

# Bad
async def create_order(user_id, order, session):  # Missing types
    ...
```

### Docstrings (Required for Public APIs)

```python
async def calculate_fibonacci_levels(
    point_a: float,
    point_b: float,
    ratios: list[float]
) -> dict[float, float]:
    """
    Calculate Fibonacci retracement levels.

    Args:
        point_a: Swing high (uptrend) or swing low (downtrend)
        point_b: Swing low (uptrend) or swing high (downtrend)
        ratios: Fibonacci ratios (default: [0.236, 0.382, 0.5, 0.618, 0.786])

    Returns:
        Dictionary mapping ratio to price level
    """
    ...
```

### Imports Organization

```python
# Standard library
import json
from datetime import datetime

# Third-party
from fastapi import APIRouter, Depends
from sqlalchemy import select

# Local imports
from app.models.order import Order
from app.services.trade_service import TradeService
```

### Function Length

- Maximum 50 lines per function
- If longer, split into helper functions

---

## Testing Requirements

### Test Structure

```
tests/
├── test_api/
│   ├── test_auth.py
│   ├── test_trade.py
│   └── test_market.py
├── test_services/
│   ├── test_trade_service.py
│   └── test_ai_service.py
├── test_utils/
│   └── test_fib_utils.py
└── conftest.py          # Shared fixtures
```

### Async Test Example

```python
# tests/test_api/test_trade.py
import pytest
from httpx import AsyncClient
from app.main import app

@pytest.fixture
async def client():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

@pytest.mark.asyncio
async def test_create_order(client: AsyncClient, auth_header: dict):
    response = await client.post(
        "/trade/order",
        json={
            "stock_code": "600519",
            "order_type": "buy",
            "order_mode": "market",
            "quantity": 100
        },
        headers=auth_header
    )
    assert response.status_code == 200
    data = response.json()
    assert data["stockCode"] == "600519"
```

### Service Test Example

```python
# tests/test_services/test_ai_service.py
import pytest
from app.services.ai_service import AIService
from app.utils.test_data import sample_klines

@pytest.mark.asyncio
async def test_identify_support_resistance():
    service = AIService()
    levels = service.identify_support_resistance(sample_klines)

    assert len(levels) > 0
    assert all("level_type" in l for l in levels)
    assert all("price" in l for l in levels)
```

---

## Forbidden Patterns

| Pattern | Why Forbidden | Alternative |
|---------|---------------|-------------|
| `eval()`, `exec()` | Security risk | Use safe parsers |
| Raw SQL with `+` concatenation | SQL injection | Use SQLAlchemy bind params |
| `requests` (sync) | Blocking I/O | Use `httpx` async |
| Global mutable state | Thread safety issues | Use dependency injection |
| `except:` bare catch | Hides bugs | Catch specific exceptions |
| `import *` | Namespace pollution | Explicit imports |
| Hardcoded credentials | Security leak | Use environment variables |
| Blocking sleep in async | Blocks event loop | Use `asyncio.sleep()` |

---

## Security Requirements

| Requirement | Implementation |
|-------------|----------------|
| Password storage | bcrypt with salt |
| JWT signing | RS256 algorithm |
| Input validation | Pydantic strict mode |
| SQL injection | SQLAlchemy ORM only |
| Rate limiting | Redis counter, 100 req/min |
| CORS | Whitelist specific domains |
| HTTPS | Mandatory, no HTTP |

---

## API Response Standards

### Success Response

```python
# Single item
{
    "id": "abc123",
    "stockCode": "600519",
    "quantity": 100
}

# List
{
    "items": [...],
    "total": 50,
    "page": 1,
    "pageSize": 20
}
```

### Error Response

```json
{
    "error": {
        "code": "INSUFFICIENT_FUND",
        "message": "可用资金不足",
        "details": {"available": 5000, "required": 10000}
    }
}
```

---

## Code Review Checklist

- [ ] Type hints present on all functions
- [ ] No forbidden patterns used
- [ ] Error handling with specific error codes
- [ ] Logging for important operations
- [ ] Tests cover new functionality
- [ ] No hardcoded configuration
- [ ] API response uses camelCase