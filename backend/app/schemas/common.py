"""
Common schemas and response types
"""

from typing import Optional, Any
from pydantic import BaseModel


class ErrorDetail(BaseModel):
    """Error detail"""
    code: str
    message: str
    details: Optional[dict[str, Any]] = None


class ErrorResponse(BaseModel):
    """Error response"""
    error: ErrorDetail


class SuccessResponse(BaseModel):
    """Success response"""
    success: bool = True
    message: Optional[str] = None


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