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
│   │   ├── order_matcher.py    # Limit order matching engine
│   │   ├── log_service.py      # Trade log logic
│   │   ├── pattern_service.py  # Pattern annotation logic
│   │   ├── ai_service.py       # AI recognition logic (rule-based)
│   │   ├── websocket_manager.py # WebSocket connection manager
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
│   │   ├── websocket.py        # WebSocket message schemas
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

**模型组织规范**:

| 模型类型 | 推荐位置 | 原因 |
|----------|----------|------|
| User 相关 | `user.py` | 用户是核心实体，与 Fund 等紧密关联 |
| Trade 相关 | `trade.py` | Position, Order, TradeReport 属于交易领域 |
| Market 相关 | `market.py` | Stock, Kline 属于行情领域 |
| 枚举类型 | `enums.py` | 集中管理，避免重复定义 |

**导入规范**:

```python
# ✅ 正确：从 models/__init__.py 导入
from app.models import User, Fund, Order, Position

# ❌ 错误：从具体文件导入（可能导致循环依赖）
from app.models.user import User, Fund
from app.models.trade import Order  # 但 Fund 不在这里！

# ✅ 正确：API 层导入
from app.models.user import User  # 只导入当前文件需要的
from app.models.trade import Order, Position, TradeReport
from app.models import Fund  # 或从 __init__.py 导入
```

**Pre-Modification Rule**: 修改任何模型前，先搜索是否已存在：

```bash
grep -r "class Fund" app/models/
# 如果找到，检查定义位置，不要重复定义
```

### Schemas (`app/schemas/`)

- Pydantic models for request/response validation
- Separate input schemas (e.g., `OrderCreate`) from output schemas (e.g., `OrderResponse`)
- Output schemas use camelCase for API responses

**类定义顺序规范**:

Pydantic 类必须在被引用之前定义：

```python
# ✅ 正确：先定义 ErrorDetail
class ErrorDetail(BaseModel):
    code: str
    message: str

class ErrorResponse(BaseModel):
    error: ErrorDetail  # 此时 ErrorDetail 已定义

# ❌ 错误：在定义前使用
class ErrorResponse(BaseModel):
    error: ErrorDetail  # NameError: 'ErrorDetail' is not defined

class ErrorDetail(BaseModel):  # 定义在使用之后
    code: str
    message: str
```

**最佳实践**: 按依赖顺序组织文件 - 基础类型在前，组合类型在后。

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

## WebSocket Patterns

### WebSocket Endpoint Location

WebSocket endpoints are defined in `app/main.py` (not in `app/api/`) because they require special handling different from REST routes.

```python
# app/main.py
@app.websocket("/ws/market")
async def market_websocket(
    websocket: WebSocket,
    token: str | None = None,
) -> None:
    """WebSocket endpoint for real-time market data.
    
    Authentication: Pass JWT token as query parameter `token`.
    """
    # Authenticate user if token provided
    user_id: UUID | None = None
    if token:
        try:
            user_id_str = verify_token(token, token_type="access")
            user_id = UUID(user_id_str)
        except TokenVerificationError as e:
            await websocket.accept()
            await ws_manager.send_error(websocket, e.error_type, e.message)
            await websocket.close()
            return

    await ws_manager.connect(websocket, user_id)
    ws_manager.start_background_task()
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            await ws_manager.handle_message(websocket, message)
    except WebSocketDisconnect:
        logger.info(f"Client disconnected: {websocket.client}")
    finally:
        ws_manager.disconnect(websocket)
```

**Authentication Flow**:
- Token passed as query parameter: `ws://host/ws/market?token=JWT_TOKEN`
- Optional: connection allowed without token (no order notifications)
- With token: enables order filled notifications for the user

### Connection Manager Pattern

Use a dedicated service class to manage WebSocket connections:

```python
# app/services/websocket_manager.py
class ConnectionManager:
    """Manages WebSocket connections and subscriptions."""

    def __init__(self) -> None:
        self._connections: dict[WebSocket, set[str]] = {}
        self._stock_subscribers: dict[str, set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket) -> None:
        """Accept a new WebSocket connection."""
        await websocket.accept()
        self._connections[websocket] = set()

    def disconnect(self, websocket: WebSocket) -> None:
        """Remove a WebSocket connection and clean up subscriptions."""
        subscribed_stocks = self._connections.pop(websocket, set())
        for stock_code in subscribed_stocks:
            if stock_code in self._stock_subscribers:
                self._stock_subscribers[stock_code].discard(websocket)

    async def handle_message(self, websocket: WebSocket, message: dict) -> None:
        """Handle incoming WebSocket message."""
        ...
```

### WebSocket Schemas

Use Pydantic schemas for message validation:

```python
# app/schemas/websocket.py
class WSAction(StrEnum):
    """WebSocket message actions."""
    SUBSCRIBE = "subscribe"
    UNSUBSCRIBE = "unsubscribe"
    PING = "ping"

class WSSubscribeMessage(BaseModel):
    """WebSocket subscription message from client."""
    action: WSAction
    stock_code: str | None = None

class WSPriceUpdate(BaseModel):
    """Price update message to client."""
    type: WSMessageType = WSMessageType.PRICE_UPDATE
    stock_code: str = Field(..., alias="stockCode")
    price: Decimal
    time: datetime
```

### WebSocket Message Contracts

| Action | Request Format | Response Format |
|--------|----------------|-----------------|
| Subscribe | `{"action": "subscribe", "stock_code": "600519"}` | `{"type": "subscribed", "stockCode": "600519"}` |
| Unsubscribe | `{"action": "unsubscribe", "stock_code": "600519"}` | `{"type": "unsubscribed", "stockCode": "600519"}` |
| Ping | `{"action": "ping"}` | `{"type": "pong", "time": "2024-01-01T10:00:00"}` |
| Invalid | Any invalid JSON | `{"type": "error", "code": "INVALID_JSON", "message": "..."}` |

| Event | Trigger | Notification Format |
|-------|---------|---------------------|
| Order Filled | Limit order matches current price | `{"type": "order_filled", "orderId": "...", "stockCode": "...", "filledPrice": ..., ...}` |

**Order Filled Notification Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `orderId` | string | UUID of the filled order |
| `stockCode` | string | Stock code |
| `stockName` | string? | Stock name (optional) |
| `orderType` | string | "buy" or "sell" |
| `orderMode` | string | "market" or "limit" |
| `quantity` | int | Order quantity |
| `limitPrice` | Decimal? | Limit price (for limit orders) |
| `filledPrice` | Decimal | Actual execution price |
| `filledAt` | datetime | Execution timestamp |

### WebSocket Error Handling

| Error Code | Condition | HTTP Status |
|------------|-----------|-------------|
| `INVALID_JSON` | Message is not valid JSON | N/A (WebSocket) |
| `INVALID_ACTION` | Unknown action type | N/A (WebSocket) |
| `MISSING_STOCK_CODE` | Subscribe without stock_code | N/A (WebSocket) |

### Background Task Pattern

For real-time updates, use background tasks:

```python
# app/services/websocket_manager.py
def start_background_task(self) -> None:
    """Start the background price update task."""
    if self._price_task is None or self._price_task.done():
        self._price_task = asyncio.create_task(self.broadcast_price_updates())

    # Start order matching task
    if self._order_match_task is None or self._order_match_task.done():
        self._order_match_task = asyncio.create_task(self.check_and_match_orders())

async def broadcast_price_updates(self) -> None:
    """Background task to broadcast price updates."""
    self._running = True
    while self._running:
        for stock_code, subscribers in self._stock_subscribers.items():
            price_update = self._generate_price_update(stock_code)
            for websocket in subscribers:
                await websocket.send_json(price_update.model_dump(by_alias=True))
        await asyncio.sleep(1.0)

async def check_and_match_orders(self) -> None:
    """Background task to check and match pending limit orders.
    
    Runs every 3 seconds to check if any pending orders match current prices.
    """
    while self._running:
        if self._price_cache and self._user_connections:
            async with AsyncSessionLocal() as db:
                matcher = OrderMatcher(db)
                executed_results = await matcher.match_and_execute_orders(
                    self._price_cache
                )
                for result in executed_results:
                    await self.send_order_filled_notification(
                        result.order.user_id,
                        result.to_ws_message(),
                    )
        await asyncio.sleep(3.0)
```

**Background Tasks Summary**:

| Task | Interval | Purpose |
|------|----------|---------|
| Price updates | 1 second | Broadcast simulated price changes to subscribers |
| Order matching | 3 seconds | Check pending limit orders against current prices |

### Global Manager Instance

Use a global singleton for the connection manager:

```python
# app/services/websocket_manager.py
manager = ConnectionManager()
```

Import in main.py:

```python
from app.services.websocket_manager import manager as ws_manager
```

### Order Matcher Pattern

The Order Matcher service handles limit order matching against current market prices.

```python
# app/services/order_matcher.py
class OrderMatcher:
    """Order matching engine for limit orders."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def match_and_execute_orders(
        self,
        price_cache: dict[str, dict[str, Any]],
    ) -> list[OrderMatchResult]:
        """Match pending limit orders and execute them."""
        matched_orders = await self.match_orders(price_cache)
        executed_results = []
        for match_result in matched_orders:
            try:
                await self.execute_matched_order(match_result)
                executed_results.append(match_result)
            except Exception as e:
                await self.db.rollback()
                logger.error(f"Failed to execute order: {e}")
        return executed_results
```

**Matching Rules**:

| Order Type | Matching Condition | Fill Price |
|------------|--------------------|------------|
| Buy limit | current_price <= limit_price | current_price |
| Sell limit | current_price >= limit_price | current_price |

**Execution Flow**:

1. Get all pending limit orders from database
2. For each order, check if current price matches limit price condition
3. Execute matched orders:
   - Unfreeze funds (for buy limit orders)
   - Update order status to FILLED
   - Update position and fund balances
   - Commit transaction
4. Return executed results for WebSocket notification

---

## Anti-Patterns (Don't Do This)

| Anti-Pattern | Why |
|--------------|-----|
| Business logic in routes | Makes testing hard, violates separation |
| Raw SQL string concatenation | SQL injection risk, use ORM |
| Direct Redis calls in routes | Centralize in services |
| Mixed naming conventions | Confuses API consumers |
| Missing Pydantic validation | Unvalidated input = security risk |