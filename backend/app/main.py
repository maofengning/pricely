"""
Pricely FastAPI Application Entry Point
"""

import json
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Any
from uuid import UUID

from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from loguru import logger

from app.api import api_router
from app.core.config import settings
from app.core.exceptions import BusinessError
from app.core.logging import setup_logging
from app.core.security import TokenVerificationError, verify_token
from app.services.scheduler_service import scheduler_service
from app.services.websocket_manager import manager as ws_manager


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Application lifespan events"""
    # Startup
    setup_logging()  # type: ignore[no-untyped-call]
    logger.info("Application starting up...")
    # Start scheduler for report generation
    scheduler_service.start()
    yield
    # Shutdown
    scheduler_service.stop()
    ws_manager.stop_background_task()
    logger.info("Application shut down complete")


app = FastAPI(
    title="Pricely API",
    description="基于价格行为学的裸K分析平台API",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)


@app.exception_handler(BusinessError)
async def business_error_handler(request: Request, exc: BusinessError) -> JSONResponse:
    """Handle BusinessError exceptions with structured error response"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.code,
                "message": exc.message,
                "details": exc.details,
            }
        },
    )


@app.exception_handler(TokenVerificationError)
async def token_verification_error_handler(
    request: Request,
    exc: TokenVerificationError
) -> JSONResponse:
    """Handle TokenVerificationError exceptions with structured error response"""
    # Map error type to HTTP status code
    status_code = 401 if exc.error_type in ["TOKEN_EXPIRED", "INVALID_TOKEN"] else 400
    return JSONResponse(
        status_code=status_code,
        content={
            "error": {
                "code": exc.error_type,
                "message": exc.message,
                "details": {},
            }
        },
    )


# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix=settings.API_V1_PREFIX)

# Health check endpoint
@app.get("/health")
async def health_check() -> dict[str, str]:
    """Health check endpoint"""
    return {"status": "healthy", "version": "0.1.0"}


@app.get("/scheduler/status")
async def scheduler_status() -> dict[str, Any]:
    """Scheduler status endpoint - shows scheduled report generation jobs"""
    return {
        "running": scheduler_service.scheduler.running,
        "jobs": scheduler_service.get_jobs(),
    }


@app.websocket("/ws/market")
async def market_websocket(
    websocket: WebSocket,
    token: str | None = None,
) -> None:
    """
    WebSocket endpoint for real-time market data.

    Authentication: Pass JWT token as query parameter `token`.

    Message format:
    - Subscribe: {"action": "subscribe", "stock_code": "600519"}
    - Unsubscribe: {"action": "unsubscribe", "stock_code": "600519"}
    - Ping: {"action": "ping"}

    Response format:
    - Price update: {"type": "price_update", "stockCode": "600519", "price": 1850.50, ...}
    - Subscribed: {"type": "subscribed", "stockCode": "600519"}
    - Pong: {"type": "pong", "time": "2024-01-01T10:00:00"}
    - Order filled: {"type": "order_filled", "orderId": "...", ...}
    - Error: {"type": "error", "code": "ERROR_CODE", "message": "Error message"}
    """
    # Authenticate user if token provided
    user_id: UUID | None = None
    if token:
        try:
            user_id_str = verify_token(token, token_type="access")
            user_id = UUID(user_id_str)
            logger.info(f"WebSocket authenticated for user_id={user_id}")
        except TokenVerificationError as e:
            # Accept connection but send error and close
            await websocket.accept()
            await ws_manager.send_error(websocket, e.error_type, e.message)
            await websocket.close()
            return

    # Connect websocket
    await ws_manager.connect(websocket, user_id)
    ws_manager.start_background_task()

    try:
        while True:
            # Receive and parse message
            data = await websocket.receive_text()

            try:
                message = json.loads(data)
                await ws_manager.handle_message(websocket, message)
            except json.JSONDecodeError:
                logger.warning(f"Invalid JSON received: {data}")
                await ws_manager.send_error(
                    websocket, "INVALID_JSON", "Message must be valid JSON"
                )

    except WebSocketDisconnect:
        logger.info(f"Client disconnected: {websocket.client}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        ws_manager.disconnect(websocket)
