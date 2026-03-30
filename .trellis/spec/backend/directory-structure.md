# Directory Structure

> How backend code is organized in this project.

---

## Overview

Backend follows a modular architecture with clear separation between API routes, services, models, and utilities.

---

## Directory Layout

```
backend/
├── app/
│   ├── main.py                 # FastAPI application entry point
│   ├── config.py               # Configuration settings
│   ├── dependencies.py         # Dependency injection
│   ├── api/
│   │   ├── __init__.py
│   │   ├── auth.py             # Authentication routes
│   │   ├── market.py           # Market data routes
│   │   ├── trade.py            # Trading routes
│   │   ├── logs.py             # Trade log routes
│   │   ├── patterns.py         # Pattern annotation routes
│   │   ├── ai.py               # AI recognition routes
│   │   └── compliance.py       # Compliance routes
│   ├── services/
│   │   ├── __init__.py
│   │   ├── auth_service.py     # Authentication logic
│   │   ├── market_service.py   # Market data logic
│   │   ├── trade_service.py    # Trading logic
│   │   ├── log_service.py      # Trade log logic
│   │   ├── pattern_service.py  # Pattern annotation logic
│   │   ├── ai_service.py       # AI recognition logic (rule-based)
│   │   └── report_service.py   # Trade report generation
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py             # User SQLAlchemy model
│   │   ├── fund.py             # Fund model
│   │   ├── position.py         # Position model
│   │   ├── order.py            # Order model
│   │   ├── trade_log.py        # Trade log model
│   │   ├── pattern_mark.py     # Pattern annotation model
│   │   ├── sr_level.py         # Support/resistance level model
│   │   └── trade_report.py     # Trade report model
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── auth.py             # Auth Pydantic schemas
│   │   ├── market.py           # Market Pydantic schemas
│   │   ├── trade.py            # Trade Pydantic schemas
│   │   ├── log.py              # Log Pydantic schemas
│   │   ├── pattern.py          # Pattern Pydantic schemas
│   │   ├── ai.py               # AI Pydantic schemas
│   │   └── common.py           # Common response schemas
│   ├── core/
│   │   ├── __init__.py
│   │   ├── security.py         # JWT, password hashing
│   │   ├── redis.py            # Redis client
│   │   └── database.py         # Database connection
│   └── utils/
│       ├── __init__.py
│       ├── kline_utils.py      # K-line data utilities
│       ├── fib_utils.py        # Fibonacci calculation
│       ├── swing_detector.py   # Swing point detection
│       └── validators.py       # Custom validators
├── data/
│   ├── stocks.json             # Pre-loaded stock list
│   └── klines/                 # CSV files for historical K-lines
│       ├── 600519_1min.csv
│       ├── 600519_5min.csv
│       └── ...
├── tests/
│   ├── __init__.py
│   ├── test_auth.py
│   ├── test_trade.py
│   └── ...
├── alembic/                    # Database migrations
│   ├── versions/
│   └── env.py
├── alembic.ini
├── requirements.txt
├── pyproject.toml
└── Dockerfile
```

---

## Module Organization

### API Routes (`app/api/`)

- Each file corresponds to a business module
- Routes use RESTful naming: plural nouns (`/orders`, `/logs`, `/patterns`)
- Use FastAPI router with prefix and tags:

```python
# app/api/trade.py
from fastapi import APIRouter, Depends

router = APIRouter(prefix="/trade", tags=["trade"])

@router.post("/order")
async def create_order(...):
    ...
```

### Services (`app/services/`)

- Business logic layer, separated from routes
- Services handle data processing, calculations, external integrations
- Services should be injected via dependencies:

```python
# app/dependencies.py
from app.services.trade_service import TradeService

def get_trade_service():
    return TradeService()
```

### Models (`app/models/`)

- SQLAlchemy ORM models
- One model per table, file named after table
- Use UUID primary keys, timestamps with `updated_at`

### Schemas (`app/schemas/`)

- Pydantic models for request/response validation
- Separate input schemas (e.g., `OrderCreate`) from output schemas (e.g., `OrderResponse`)
- Output schemas use camelCase for API responses

---

## Naming Conventions

| Layer | Convention | Example |
|-------|------------|---------|
| **Files** | snake_case | `trade_service.py`, `swing_detector.py` |
| **Classes** | PascalCase | `TradeService`, `OrderModel`, `OrderCreate` |
| **Functions** | snake_case | `create_order()`, `calculate_fibonacci()` |
| **Variables** | snake_case | `trade_count`, `win_rate` |
| **Constants** | UPPER_SNAKE | `MAX_SUBSCRIPTIONS = 10` |
| **API paths** | plural nouns | `/orders`, `/logs`, `/patterns` |

---

## Examples

### Route File Structure

```python
# app/api/trade.py
from fastapi import APIRouter, Depends, HTTPException
from app.schemas.trade import OrderCreate, OrderResponse
from app.services.trade_service import TradeService
from app.dependencies import get_trade_service, get_current_user

router = APIRouter(prefix="/trade", tags=["trade"])

@router.post("/order", response_model=OrderResponse)
async def create_order(
    order: OrderCreate,
    user = Depends(get_current_user),
    service: TradeService = Depends(get_trade_service)
):
    """Create a simulated order (market or limit)."""
    result = await service.create_order(user.id, order)
    if not result:
        raise HTTPException(status_code=400, detail="INSUFFICIENT_FUND")
    return result
```

### Service File Structure

```python
# app/services/trade_service.py
from app.models.order import Order, OrderStatus
from app.models.position import Position
from app.models.fund import Fund
from app.schemas.trade import OrderCreate, OrderResponse
from sqlalchemy.ext.asyncio import AsyncSession

class TradeService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_order(self, user_id: str, order: OrderCreate) -> OrderResponse:
        # Business logic here
        ...
```

---

## Anti-Patterns (Don't Do This)

| Anti-Pattern | Why |
|--------------|-----|
| Business logic in routes | Makes testing hard, violates separation |
| Raw SQL string concatenation | SQL injection risk, use ORM |
| Direct Redis calls in routes | Centralize in services |
| Mixed naming conventions | Confuses API consumers |
| Missing Pydantic validation | Unvalidated input = security risk |