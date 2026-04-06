"""
Pricely FastAPI Application Entry Point
"""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import api_router
from app.core.config import settings
from app.core.exceptions import BusinessError
from app.core.logging import setup_logging
from app.core.security import TokenVerificationError


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Application lifespan events"""
    # Startup
    setup_logging()  # type: ignore[no-untyped-call]
    yield
    # Shutdown


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
