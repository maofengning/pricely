"""
Custom exceptions for the application
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
