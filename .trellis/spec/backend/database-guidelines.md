# Database Guidelines

> ORM patterns, queries, migrations, and naming conventions.

---

## Overview

- **Database**: PostgreSQL 15
- **ORM**: SQLAlchemy 2.x (async mode)
- **Migrations**: Alembic
- **Caching**: Redis 7

---

## ORM Patterns

### Model Definition

Use SQLAlchemy 2.x async style with UUID primary keys:

```python
# app/models/order.py
from sqlalchemy import Column, String, Integer, Numeric, DateTime, Enum
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid

from app.core.database import Base
from app.models.enums import OrderStatus, OrderType, OrderMode

class Order(Base):
    __tablename__ = "orders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    stock_code = Column(String(10), nullable=False)
    stock_name = Column(String(50))
    order_type = Column(Enum(OrderType), nullable=False)
    order_mode = Column(Enum(OrderMode), nullable=False)
    limit_price = Column(Numeric(10, 4))
    quantity = Column(Integer, nullable=False)
    filled_price = Column(Numeric(10, 4))
    filled_at = Column(DateTime)
    status = Column(Enum(OrderStatus), default=OrderStatus.pending)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

### Async Session Usage

```python
# app/core/database.py
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession

engine = create_async_engine("postgresql+asyncpg://...")
async_session_maker = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# In service
async with async_session_maker() as session:
    result = await session.execute(select(Order).where(Order.user_id == user_id))
    orders = result.scalars().all()
```

### Enum Types

Define enums in a separate file for reuse:

```python
# app/models/enums.py
import enum

class OrderType(str, enum.Enum):
    buy = "buy"
    sell = "sell"

class OrderMode(str, enum.Enum):
    market = "market"
    limit = "limit"

class OrderStatus(str, enum.Enum):
    pending = "pending"
    filled = "filled"
    cancelled = "cancelled"
```

---

## Query Patterns

### Basic Queries

```python
from sqlalchemy import select

# Get all orders for a user
async def get_user_orders(session: AsyncSession, user_id: str):
    result = await session.execute(
        select(Order)
        .where(Order.user_id == user_id)
        .order_by(Order.created_at.desc())
    )
    return result.scalars().all()

# Get pending orders only
async def get_pending_orders(session: AsyncSession):
    result = await session.execute(
        select(Order).where(Order.status == OrderStatus.pending)
    )
    return result.scalars().all()
```

### With Relationships

```python
from sqlalchemy.orm import selectinload

# Get user with their funds
async def get_user_with_funds(session: AsyncSession, user_id: str):
    result = await session.execute(
        select(User)
        .options(selectinload(User.fund))
        .where(User.id == user_id)
    )
    return result.scalar_one_or_none()
```

### Aggregation

```python
from sqlalchemy import func

# Count orders
async def count_orders(session: AsyncSession, user_id: str):
    result = await session.execute(
        select(func.count(Order.id))
        .where(Order.user_id == user_id)
    )
    return result.scalar()
```

---

## Naming Conventions

| Location | Convention | Example |
|----------|------------|---------|
| **Table names** | snake_case | `orders`, `trade_logs`, `sr_levels` |
| **Column names** | snake_case | `trade_count`, `win_rate`, `filled_at` |
| **Primary keys** | `id` (UUID) | `id = Column(UUID...)` |
| **Foreign keys** | `{table}_id` | `user_id`, `stock_code` |
| **Timestamps** | `created_at`, `updated_at` | Standard naming |
| **Boolean flags** | `is_{state}` | `is_active`, `is_valid`, `is_ai_detected` |

---

## Migrations

### Create Migration

```bash
alembic revision --autogenerate -m "add orders table"
```

### Apply Migration

```bash
alembic upgrade head
```

### Migration File Example

```python
# alembic/versions/001_add_orders.py
def upgrade():
    op.create_table(
        'orders',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('stock_code', sa.String(10), nullable=False),
        sa.Column('order_type', sa.Enum('buy', 'sell', name='order_type_enum')),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'])
    )

def downgrade():
    op.drop_table('orders')
```

---

## Redis Usage

### Key Patterns

```python
# Session storage
session:{user_id}        # JWT token, TTL 24h

# K-line cache
kline:{stock_code}:{period}  # JSON array, TTL 5min

# Real-time price
realtime:{stock_code}    # Hash OHLC, real-time

# AI result cache
sr:{stock_code}:{period} # Support/resistance JSON, TTL 1h
```

### Redis Operations

```python
# app/core/redis.py
import redis.asyncio as redis

redis_client = redis.from_url("redis://localhost:6379")

async def cache_kline(stock_code: str, period: str, data: list):
    key = f"kline:{stock_code}:{period}"
    await redis_client.setex(key, 300, json.dumps(data))

async def get_cached_kline(stock_code: str, period: str) -> list | None:
    key = f"kline:{stock_code}:{period}"
    data = await redis_client.get(key)
    return json.loads(data) if data else None
```

---

## Anti-Patterns

| Anti-Pattern | Why | Correct Approach |
|--------------|-----|------------------|
| Raw SQL string concatenation | SQL injection | Use SQLAlchemy ORM |
| Sync SQLAlchemy | Blocking I/O | Use async SQLAlchemy |
| Missing indexes on FK | Slow joins | Add index on foreign keys |
| No `updated_at` trigger | Stale timestamps | Use `onupdate=datetime.utcnow` |
| Hardcoded enum values | Typos | Use Enum classes |
| Redis keys without TTL | Memory leak | Always set TTL |