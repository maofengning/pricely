"""
Custom exceptions for business logic errors
"""

from typing import Any


class BusinessError(Exception):
    """Business logic error with structured error code"""

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

    def _get_status_code(self, code: str) -> int:
        """Map error code to HTTP status code"""
        auth_errors = [
            "UNAUTHORIZED",
            "TOKEN_EXPIRED",
            "INVALID_CREDENTIALS",
            "INVALID_TOKEN",
            "USER_DEACTIVATED",
        ]
        not_found_errors = [
            "USER_NOT_FOUND",
            "ORDER_NOT_FOUND",
            "LOG_NOT_FOUND",
            "PATTERN_NOT_FOUND",
            "STOCK_NOT_FOUND",
            "KLINE_NOT_FOUND",
            "SR_LEVEL_NOT_FOUND",
            "FUND_NOT_FOUND",
        ]
        validation_errors = [
            "INVALID_INPUT",
            "MISSING_FIELD",
            "EMAIL_ALREADY_EXISTS",
            "INVALID_PERIOD",
            "INSUFFICIENT_FUND",
            "POSITION_EMPTY",
        ]

        if code in auth_errors:
            return 401
        elif code in not_found_errors:
            return 404
        elif code in validation_errors:
            return 400
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


class SRAlgorithmError(BusinessError):
    """Support/Resistance algorithm error"""

    def __init__(
        self,
        message: str,
        details: dict[str, Any] | None = None,
    ):
        super().__init__("SR_ALGORITHM_ERROR", message, details)
