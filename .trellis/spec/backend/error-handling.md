# Error Handling

> How errors are caught, logged, and returned to clients.

---

## Overview

- Use FastAPI's `HTTPException` for API errors
- Custom error codes for business logic errors
- Structured error response format
- Centralized exception handlers

---

## Error Response Format

All API errors follow this format:

```json
{
  "error": {
    "code": "INVALID_STOCK_CODE",
    "message": "股票代码不存在",
    "details": {"stock_code": "ABC123"}
  }
}
```

---

## Error Code Categories

| Category | Examples |
|----------|----------|
| **Authentication** | `UNAUTHORIZED`, `TOKEN_EXPIRED`, `INVALID_CREDENTIALS`, `INVALID_TOKEN`, `USER_DEACTIVATED` |
| **Business Logic** | `INSUFFICIENT_FUND`, `STOCK_NOT_FOUND`, `INVALID_STOCK_CODE`, `KLINE_NOT_FOUND`, `ORDER_NOT_FOUND`, `POSITION_EMPTY` |
| **Validation** | `INVALID_INPUT`, `MISSING_FIELD`, `INVALID_PERIOD`, `EMAIL_ALREADY_EXISTS` |
| **System** | `INTERNAL_ERROR`, `SERVICE_UNAVAILABLE`, `DATABASE_ERROR` |

---

## HTTP Exception Usage

### Basic HTTP Exception

```python
from fastapi import HTTPException

# Simple error
raise HTTPException(status_code=401, detail="UNAUTHORIZED")

# With details
raise HTTPException(
    status_code=400,
    detail={
        "code": "INSUFFICIENT_FUND",
        "message": "可用资金不足",
        "details": {"required": 10000, "available": 5000}
    }
)
```

### Custom Exception Class

```python
# app/core/exceptions.py
class BusinessError(Exception):
    def __init__(self, code: str, message: str, details: dict = None):
        self.code = code
        self.message = message
        self.details = details or {}
        self.status_code = self._get_status_code(code)

    def _get_status_code(self, code: str) -> int:
        if code in ["UNAUTHORIZED", "TOKEN_EXPIRED", "INVALID_CREDENTIALS"]:
            return 401
        elif code in ["ORDER_NOT_FOUND", "LOG_NOT_FOUND", "PATTERN_NOT_FOUND"]:
            return 404
        else:
            return 400

# Usage
raise BusinessError("INSUFFICIENT_FUND", "可用资金不足", {"available": 5000})
```

### JWT Token Verification Error

For JWT-specific errors, use TokenVerificationError with structured error types:

```python
# app/core/security.py
class TokenVerificationError(Exception):
    """Exception raised when token verification fails."""

    def __init__(self, error_type: str, message: str):
        self.error_type = error_type  # e.g., "TOKEN_EXPIRED", "INVALID_TOKEN"
        self.message = message
        super().__init__(message)

# Usage in verify_token
def verify_token(token: str, token_type: str | None = None) -> str:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        # Verify token type if specified
        if token_type is not None and payload.get("type") != token_type:
            raise TokenVerificationError("INVALID_TOKEN", "令牌类型不正确")
        return str(payload.get("sub"))
    except ExpiredSignatureError:
        raise TokenVerificationError("TOKEN_EXPIRED", "令牌已过期") from None
    except JWTError:
        raise TokenVerificationError("INVALID_TOKEN", "无效的令牌") from None
```

### Exception Handler

```python
# app/main.py
from fastapi import Request
from fastapi.responses import JSONResponse
from app.core.exceptions import BusinessError

@app.exception_handler(BusinessError)
async def business_error_handler(request: Request, exc: BusinessError):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.code,
                "message": exc.message,
                "details": exc.details
            }
        }
    )
```

---

## Validation Errors

Pydantic automatically validates inputs. Customize error format:

```python
# app/main.py
from fastapi.exceptions import RequestValidationError

@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    return JSONResponse(
        status_code=400,
        content={
            "error": {
                "code": "INVALID_INPUT",
                "message": "输入参数校验失败",
                "details": {"fields": [e["loc"] for e in errors]}
            }
        }
    )
```

---

## Service Layer Error Handling

Services should raise exceptions, not return error tuples:

```python
# app/services/trade_service.py
class TradeService:
    async def create_order(self, user_id: str, order: OrderCreate):
        # Check fund
        fund = await self.get_fund(user_id)
        required = order.quantity * (order.limit_price or current_price)

        if fund.available < required:
            raise BusinessError(
                "INSUFFICIENT_FUND",
                "可用资金不足",
                {"required": required, "available": fund.available}
            )

        # Proceed with order creation
        ...
```

---

## Error Handling Best Practices

| Practice | Reason |
|----------|--------|
| Use specific error codes | Helps frontend handle errors specifically |
| Include helpful details | Frontend can show precise info to user |
| Log errors with context | Debugging needs full context |
| Don't expose internal errors | Security risk, use generic message |
| Always use Pydantic validation | Never trust raw input |

---

## Anti-Patterns

| Anti-Pattern | Why | Correct |
|--------------|-----|---------|
| Returning error tuples `return (False, "error")` | Inconsistent handling | Raise exceptions |
| Catching all exceptions silently | Bugs hidden | Log and handle specifically |
| Hardcoded status codes in services | Inconsistent HTTP mapping | Use BusinessError class |
| Exposing stack traces to client | Security risk | Return generic message |
| Missing error details | User confused | Include helpful context |