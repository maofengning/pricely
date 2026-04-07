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
│   │   ├── websocket_manager.py # WebSocket connection manager
│   │   ├── report_service.py   # Trade report generation
│   │   └── scheduler_service.py # Scheduled task management
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
async def market_websocket(websocket: WebSocket) -> None:
    """WebSocket endpoint for real-time market data."""
    await ws_manager.connect(websocket)
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

async def broadcast_price_updates(self) -> None:
    """Background task to broadcast price updates."""
    self._running = True
    while self._running:
        for stock_code, subscribers in self._stock_subscribers.items():
            price_update = self._generate_price_update(stock_code)
            for websocket in subscribers:
                await websocket.send_json(price_update.model_dump(by_alias=True))
        await asyncio.sleep(1.0)
```

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

---

## Scheduled Task Pattern

For scheduled report generation or other periodic tasks, use APScheduler:

### Service Structure

```python
# app/services/scheduler_service.py
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

class SchedulerService:
    """Service for managing scheduled tasks."""

    def __init__(self) -> None:
        self.scheduler = BackgroundScheduler()
        self._initialized = False

    def setup_jobs(self) -> None:
        """Setup all scheduled jobs."""
        if self._initialized:
            return

        # Daily job: runs at 0:05 AM every day
        self.scheduler.add_job(
            self._generate_daily_reports,
            CronTrigger(hour=0, minute=5),
            id="daily_report",
            name="Daily Report Generation",
            replace_existing=True,
        )

        # Weekly job: runs at 0:05 AM every Monday
        self.scheduler.add_job(
            self._generate_weekly_reports,
            CronTrigger(day_of_week="mon", hour=0, minute=5),
            id="weekly_report",
            name="Weekly Report Generation",
            replace_existing=True,
        )

        # Monthly job: runs at 0:05 AM on 1st of each month
        self.scheduler.add_job(
            self._generate_monthly_reports,
            CronTrigger(day=1, hour=0, minute=5),
            id="monthly_report",
            name="Monthly Report Generation",
            replace_existing=True,
        )

        self._initialized = True

    def start(self) -> None:
        """Start the scheduler."""
        if not self._initialized:
            self.setup_jobs()
        self.scheduler.start()

    def stop(self) -> None:
        """Stop the scheduler."""
        if self.scheduler.running:
            self.scheduler.shutdown()


# Global singleton instance
scheduler_service = SchedulerService()
```

### Integration in main.py

```python
# app/main.py
from app.services.scheduler_service import scheduler_service

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    # Startup
    setup_logging()
    scheduler_service.start()  # Start scheduler
    yield
    # Shutdown
    scheduler_service.stop()   # Stop scheduler
```

### CronTrigger Examples

| Schedule | Trigger Expression |
|----------|-------------------|
| Every day at 0:05 | `CronTrigger(hour=0, minute=5)` |
| Every Monday at 0:05 | `CronTrigger(day_of_week="mon", hour=0, minute=5)` |
| Every 1st of month at 0:05 | `CronTrigger(day=1, hour=0, minute=5)` |
| Every hour | `CronTrigger(minute=0)` |
| Every 15 minutes | `CronTrigger(minute="*/15")` |

### Job Error Handling

Each job should handle its own exceptions to prevent scheduler crash:

```python
def _generate_daily_reports(self) -> None:
    """Generate daily reports for all users."""
    logger.info("Starting daily report generation job")
    db = SessionLocal()
    try:
        service = ReportService(db)
        service.generate_reports_for_all_users(ReportPeriodEnum.DAILY, period_date)
    except Exception as e:
        logger.error(f"Daily report generation failed: {e}")
    finally:
        db.close()
    logger.info("Daily report generation job completed")
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