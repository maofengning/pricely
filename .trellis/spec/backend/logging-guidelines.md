# Logging Guidelines

> Structured logging, log levels, and what to log.

---

## Overview

- Use Python `logging` module with structured format
- Log to stdout (Docker captures)
- Different levels for different scenarios
- Include request context in logs

---

## Log Levels

| Level | When to Use | Example |
|-------|-------------|---------|
| **DEBUG** | Development debugging | `K-line data loaded: 500 records` |
| **INFO** | Normal operations | `User login: user_id=abc123`, `Order created: order_id=xyz` |
| **WARNING** | Recoverable issues | `Rate limit approaching: 95 req/min`, `Redis connection retry` |
| **ERROR** | Failures requiring attention | `Database connection failed`, `Order creation failed: INSUFFICIENT_FUND` |
| **CRITICAL** | System-wide failures | `Service unavailable`, `Data corruption detected` |

---

## Structured Log Format

Use JSON format for easy parsing:

```python
# app/core/logging.py
import logging
import json
from datetime import datetime

class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_obj = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
        }
        if hasattr(record, "request_id"):
            log_obj["request_id"] = record.request_id
        if hasattr(record, "user_id"):
            log_obj["user_id"] = record.user_id
        if record.exc_info:
            log_obj["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_obj)

# Setup
logger = logging.getLogger("pricely")
logger.setLevel(logging.INFO)
handler = logging.StreamHandler()
handler.setFormatter(JSONFormatter())
logger.addHandler(handler)
```

---

## Logging Patterns

### Request Logging

```python
# app/middleware/logging_middleware.py
from starlette.middleware.base import BaseHTTPMiddleware
import uuid

class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        request_id = str(uuid.uuid4())[:8]

        # Log request
        logger.info(
            f"Request started: {request.method} {request.url.path}",
            extra={"request_id": request_id}
        )

        response = await call_next(request)

        # Log response
        logger.info(
            f"Request completed: {request.method} {request.url.path} - {response.status_code}",
            extra={"request_id": request_id}
        )

        response.headers["X-Request-ID"] = request_id
        return response
```

### Service Operation Logging

```python
# app/services/trade_service.py
async def create_order(self, user_id: str, order: OrderCreate):
    logger.info(
        f"Order creation started: user={user_id}, stock={order.stock_code}, type={order.order_type}",
        extra={"user_id": user_id}
    )

    try:
        result = await self._execute_order(user_id, order)
        logger.info(f"Order created: order_id={result.id}", extra={"user_id": user_id})
        return result
    except BusinessError as e:
        logger.warning(
            f"Order failed: {e.code} - {e.message}",
            extra={"user_id": user_id, "error_code": e.code}
        )
        raise
```

### Error Logging

```python
try:
    await risky_operation()
except Exception as e:
    logger.error(
        f"Operation failed: {str(e)}",
        exc_info=True,  # Include stack trace
        extra={"user_id": user_id}
    )
    raise BusinessError("INTERNAL_ERROR", "服务暂时不可用")
```

---

## What to Log

### Always Log

| Event | Fields |
|-------|--------|
| User login/logout | `user_id`, `ip`, `success/fail` |
| Order creation | `user_id`, `order_id`, `stock_code`, `type`, `quantity` |
| Order execution | `order_id`, `filled_price`, `filled_at` |
| API errors | `error_code`, `user_id`, `request_id`, `details` |
| WebSocket connections | `user_id`, `stock_codes subscribed` |

### Never Log

| Data | Reason |
|------|--------|
| Passwords | Security |
| JWT tokens | Security |
| Credit card info | Compliance |
| Full email addresses | Privacy (log hashed or partial) |

---

## Performance Logging

```python
import time

async def slow_operation():
    start = time.time()
    result = await do_work()
    duration = time.time() - start

    if duration > 2.0:
        logger.warning(f"Slow operation: {duration:.2f}s")

    return result
```

---

## Anti-Patterns

| Anti-Pattern | Why | Correct |
|--------------|-----|---------|
| `print()` statements | Not captured in Docker | Use `logger` |
| Logging sensitive data | Security risk | Exclude passwords, tokens |
| Too verbose INFO logs | Noise, hard to find issues | Use DEBUG for verbose |
| No context in logs | Can't trace issues | Include `user_id`, `request_id` |
| Catching exceptions without logging | Bugs invisible | Always log before handling |
| Giant log messages | Parsing issues | Keep structured, concise |