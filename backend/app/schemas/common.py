"""
Common schemas and response types
"""

from typing import Any

from pydantic import BaseModel


class ErrorDetail(BaseModel):
    """Error detail"""
    code: str
    message: str
    details: dict[str, Any] | None = None


class ErrorResponse(BaseModel):
    """Error response"""
    error: ErrorDetail


class SuccessResponse(BaseModel):
    """Success response"""
    success: bool = True
    message: str | None = None


class PaginationMeta(BaseModel):
    """Pagination metadata"""
    total: int
    page: int
    pageSize: int
    totalPages: int


class PaginatedResponse(BaseModel):
    """Paginated response"""
    data: list[Any]
    meta: PaginationMeta
