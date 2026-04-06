"""
<<<<<<< HEAD
Custom exceptions for business logic errors
=======
Custom exceptions for the application
>>>>>>> feature/auth-api
"""

from typing import Any


class BusinessError(Exception):
<<<<<<< HEAD
    """Business logic error with code and message"""
=======
    """Business logic error with structured error code"""
>>>>>>> feature/auth-api

    def __init__(
        self,
        code: str,
        message: str,
        details: dict[str, Any] | None = None,
    ):
        self.code = code
        self.message = message
        self.details = details or {}
        self.status_code = self._get_status_code(code)
<<<<<<< HEAD
        super().__init__(message)

    def _get_status_code(self, code: str) -> int:
        """Map error code to HTTP status code"""
        auth_codes = ["UNAUTHORIZED", "TOKEN_EXPIRED", "INVALID_CREDENTIALS"]
        not_found_codes = [
            "ORDER_NOT_FOUND",
            "LOG_NOT_FOUND",
            "PATTERN_NOT_FOUND",
            "STOCK_NOT_FOUND",
            "KLINE_NOT_FOUND",
        ]

        if code in auth_codes:
            return 401
        elif code in not_found_codes:
            return 404
        else:
            return 400


class DataLoadError(BusinessError):
    """Data loading error"""

    def __init__(
        self,
        message: str,
        details: dict[str, Any] | None = None,
    ):
        super().__init__("DATA_LOAD_ERROR", message, details)


class ValidationError(BusinessError):
    """Validation error"""

    def __init__(
        self,
        message: str,
        details: dict[str, Any] | None = None,
    ):
        super().__init__("VALIDATION_ERROR", message, details)
=======

    def _get_status_code(self, code: str) -> int:
        """Map error code to HTTP status code"""
        auth_errors = [
            "UNAUTHORIZED",
            "TOKEN_EXPIRED",
            "INVALID_CREDENTIALS",
            "INVALID_TOKEN",
        ]
        not_found_errors = [
            "USER_NOT_FOUND",
            "ORDER_NOT_FOUND",
            "LOG_NOT_FOUND",
            "PATTERN_NOT_FOUND",
        ]
        validation_errors = [
            "INVALID_INPUT",
            "MISSING_FIELD",
            "EMAIL_ALREADY_EXISTS",
        ]

        if code in auth_errors:
            return 401
        elif code in not_found_errors:
            return 404
        elif code in validation_errors:
            return 400
        else:
            return 400
>>>>>>> feature/auth-api
