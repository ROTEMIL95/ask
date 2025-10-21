"""
Structured Logging Utility
Provides consistent logging with request IDs, timestamps, and structured data
"""
import logging
import sys
import uuid
from datetime import datetime
from typing import Dict, Any, Optional
from enum import Enum


class LogLevel(Enum):
    """Log levels"""
    DEBUG = 'DEBUG'
    INFO = 'INFO'
    WARNING = 'WARNING'
    ERROR = 'ERROR'
    CRITICAL = 'CRITICAL'


class StructuredLogger:
    """
    Structured logger with request ID tracking and consistent formatting
    """

    def __init__(self, name: str = 'askapi'):
        self.logger = logging.getLogger(name)
        self._setup_logger()

    def _setup_logger(self):
        """Setup logger with consistent formatting"""
        if not self.logger.handlers:
            # Create console handler
            handler = logging.StreamHandler(sys.stdout)
            handler.setLevel(logging.DEBUG)

            # Create formatter
            formatter = logging.Formatter(
                '[%(asctime)s] [%(levelname)s] [%(name)s] %(message)s',
                datefmt='%Y-%m-%d %H:%M:%S UTC'
            )
            handler.setFormatter(formatter)

            # Add handler to logger
            self.logger.addHandler(handler)
            self.logger.setLevel(logging.DEBUG)
            self.logger.propagate = False

    def _format_message(self, message: str, extra: Optional[Dict[str, Any]] = None) -> str:
        """Format message with extra context"""
        if not extra:
            return message

        # Build structured message
        parts = [message]

        # Add request ID if present
        if 'request_id' in extra:
            parts.append(f"[req_id={extra['request_id']}]")

        # Add user ID if present
        if 'user_id' in extra:
            parts.append(f"[user_id={extra['user_id']}]")

        # Add endpoint if present
        if 'endpoint' in extra:
            parts.append(f"[endpoint={extra['endpoint']}]")

        # Add duration if present
        if 'duration_ms' in extra:
            parts.append(f"[duration={extra['duration_ms']}ms]")

        # Add other fields as key=value pairs
        other_fields = {k: v for k, v in extra.items()
                       if k not in ['request_id', 'user_id', 'endpoint', 'duration_ms']}

        if other_fields:
            field_strs = [f"{k}={v}" for k, v in other_fields.items()]
            parts.append(f"[{', '.join(field_strs)}]")

        return ' '.join(parts)

    def debug(self, message: str, extra: Optional[Dict[str, Any]] = None):
        """Log debug message"""
        formatted = self._format_message(message, extra)
        self.logger.debug(formatted)

    def info(self, message: str, extra: Optional[Dict[str, Any]] = None):
        """Log info message"""
        formatted = self._format_message(message, extra)
        self.logger.info(formatted)

    def warning(self, message: str, extra: Optional[Dict[str, Any]] = None):
        """Log warning message"""
        formatted = self._format_message(message, extra)
        self.logger.warning(formatted)

    def error(self, message: str, extra: Optional[Dict[str, Any]] = None, exc_info=False):
        """Log error message"""
        formatted = self._format_message(message, extra)
        self.logger.error(formatted, exc_info=exc_info)

    def critical(self, message: str, extra: Optional[Dict[str, Any]] = None, exc_info=False):
        """Log critical message"""
        formatted = self._format_message(message, extra)
        self.logger.critical(formatted, exc_info=exc_info)


class RequestLogger:
    """
    Logger for tracking API requests with request IDs and performance metrics
    """

    def __init__(self, logger: StructuredLogger):
        self.logger = logger
        self.request_id = None
        self.start_time = None
        self.context = {}

    def start_request(self, endpoint: str, method: str, user_id: Optional[str] = None,
                     extra_context: Optional[Dict[str, Any]] = None):
        """Start tracking a new request"""
        self.request_id = self._generate_request_id()
        self.start_time = datetime.utcnow()
        self.context = {
            'request_id': self.request_id,
            'endpoint': endpoint,
            'method': method,
            'user_id': user_id or 'anonymous',
            'start_time': self.start_time.isoformat()
        }

        if extra_context:
            self.context.update(extra_context)

        self.logger.info('Request started', extra=self.context)

        return self.request_id

    def log_validation(self, valid: bool, errors: list = None):
        """Log validation result"""
        context = self.context.copy()
        context['validation_valid'] = valid

        if errors:
            context['validation_errors'] = len(errors)
            self.logger.warning('Validation failed', extra=context)
            for error in errors:
                self.logger.debug(f"Validation error: {error.get('field')} - {error.get('message')}",
                                extra=self.context)
        else:
            self.logger.debug('Validation passed', extra=context)

    def log_llm_call(self, model: str, prompt_length: int, max_tokens: int):
        """Log LLM API call"""
        context = self.context.copy()
        context.update({
            'llm_model': model,
            'prompt_length': prompt_length,
            'max_tokens': max_tokens
        })
        self.logger.info('Calling LLM API', extra=context)

    def log_llm_response(self, model: str, tokens_used: int, stop_reason: str):
        """Log LLM response"""
        context = self.context.copy()
        context.update({
            'llm_model': model,
            'tokens_used': tokens_used,
            'stop_reason': stop_reason
        })
        self.logger.info('LLM response received', extra=context)

    def end_request(self, status_code: int, success: bool = True):
        """End request tracking and log performance"""
        if not self.start_time:
            self.logger.warning('end_request called without start_request')
            return

        end_time = datetime.utcnow()
        duration_ms = int((end_time - self.start_time).total_seconds() * 1000)

        context = self.context.copy()
        context.update({
            'status_code': status_code,
            'success': success,
            'duration_ms': duration_ms,
            'end_time': end_time.isoformat()
        })

        if success:
            self.logger.info('Request completed successfully', extra=context)
        else:
            self.logger.error('Request failed', extra=context)

        return duration_ms

    def log_error(self, error_message: str, error_code: str = None, details: Dict[str, Any] = None):
        """Log an error during request processing"""
        context = self.context.copy()
        context['error_message'] = error_message

        if error_code:
            context['error_code'] = error_code

        if details:
            context.update(details)

        self.logger.error('Request error', extra=context, exc_info=True)

    @staticmethod
    def _generate_request_id() -> str:
        """Generate a unique request ID"""
        return f"req_{uuid.uuid4().hex[:12]}"


# Global logger instance
_global_logger = None


def get_logger(name: str = 'askapi') -> StructuredLogger:
    """Get or create global logger instance"""
    global _global_logger
    if _global_logger is None:
        _global_logger = StructuredLogger(name)
    return _global_logger


def create_request_logger() -> RequestLogger:
    """Create a new request logger instance"""
    return RequestLogger(get_logger())


# Convenience functions
def log_debug(message: str, **kwargs):
    """Log debug message"""
    get_logger().debug(message, extra=kwargs if kwargs else None)


def log_info(message: str, **kwargs):
    """Log info message"""
    get_logger().info(message, extra=kwargs if kwargs else None)


def log_warning(message: str, **kwargs):
    """Log warning message"""
    get_logger().warning(message, extra=kwargs if kwargs else None)


def log_error(message: str, exc_info=False, **kwargs):
    """Log error message"""
    get_logger().error(message, extra=kwargs if kwargs else None, exc_info=exc_info)


def log_critical(message: str, exc_info=False, **kwargs):
    """Log critical message"""
    get_logger().critical(message, extra=kwargs if kwargs else None, exc_info=exc_info)
