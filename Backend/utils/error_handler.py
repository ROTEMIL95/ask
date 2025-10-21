"""
Error Handler Utilities
Standardized error responses for API endpoints
"""
from datetime import datetime
from typing import Dict, Any, List, Optional
from flask import jsonify, Response


class ErrorCode:
    """Standard error codes"""
    # Validation errors (400)
    VALIDATION_FAILED = 'VALIDATION_FAILED'
    MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD'
    INVALID_FORMAT = 'INVALID_FORMAT'
    INVALID_VALUE = 'INVALID_VALUE'

    # Authentication errors (401, 403)
    AUTH_REQUIRED = 'AUTH_REQUIRED'
    INVALID_CREDENTIALS = 'INVALID_CREDENTIALS'
    TOKEN_EXPIRED = 'TOKEN_EXPIRED'
    INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS'

    # Resource errors (404, 409)
    RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND'
    RESOURCE_CONFLICT = 'RESOURCE_CONFLICT'

    # Rate limiting (429)
    RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED'
    QUOTA_EXCEEDED = 'QUOTA_EXCEEDED'

    # Server errors (500+)
    INTERNAL_ERROR = 'INTERNAL_ERROR'
    SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE'
    LLM_API_ERROR = 'LLM_API_ERROR'
    DATABASE_ERROR = 'DATABASE_ERROR'

    # Business logic errors
    INSUFFICIENT_QUOTA = 'INSUFFICIENT_QUOTA'
    INVALID_API_CONFIG = 'INVALID_API_CONFIG'


class ErrorResponse:
    """Standardized error response builder"""

    @staticmethod
    def build(
        error_code: str,
        message: str,
        status_code: int = 400,
        details: Optional[Dict[str, Any]] = None,
        suggestions: Optional[List[str]] = None,
        request_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Build standardized error response

        Args:
            error_code: Machine-readable error code
            message: Human-readable error message
            status_code: HTTP status code
            details: Additional error details
            suggestions: List of suggestions to fix the error
            request_id: Request ID for tracking

        Returns:
            Dictionary containing standardized error response
        """
        response = {
            'success': False,
            'error_code': error_code,
            'message': message,
            'status_code': status_code,
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        }

        if details:
            response['details'] = details

        if suggestions:
            response['suggestions'] = suggestions

        if request_id:
            response['request_id'] = request_id

        return response

    @staticmethod
    def validation_error(
        message: str,
        validation_errors: List[Dict[str, str]],
        request_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Build validation error response"""
        suggestions = ['Please fix the validation errors listed in details']

        return ErrorResponse.build(
            error_code=ErrorCode.VALIDATION_FAILED,
            message=message,
            status_code=400,
            details={'validation_errors': validation_errors},
            suggestions=suggestions,
            request_id=request_id
        )

    @staticmethod
    def missing_field_error(
        field_name: str,
        request_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Build missing required field error"""
        return ErrorResponse.build(
            error_code=ErrorCode.MISSING_REQUIRED_FIELD,
            message=f'Missing required field: {field_name}',
            status_code=400,
            details={'missing_field': field_name},
            suggestions=[f'Please provide the required field: {field_name}'],
            request_id=request_id
        )

    @staticmethod
    def authentication_error(
        message: str = 'Authentication required',
        request_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Build authentication error response"""
        return ErrorResponse.build(
            error_code=ErrorCode.AUTH_REQUIRED,
            message=message,
            status_code=401,
            suggestions=[
                'Provide valid authentication credentials',
                'Check if your API key or token is correct',
                'Verify your credentials have not expired'
            ],
            request_id=request_id
        )

    @staticmethod
    def permission_error(
        resource: str = 'resource',
        request_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Build permission error response"""
        return ErrorResponse.build(
            error_code=ErrorCode.INSUFFICIENT_PERMISSIONS,
            message=f'You do not have permission to access this {resource}',
            status_code=403,
            details={'resource': resource},
            suggestions=[
                'Verify your account has the necessary permissions',
                'Contact your administrator for access'
            ],
            request_id=request_id
        )

    @staticmethod
    def not_found_error(
        resource: str,
        resource_id: Optional[str] = None,
        request_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Build resource not found error"""
        message = f'{resource} not found'
        if resource_id:
            message += f': {resource_id}'

        return ErrorResponse.build(
            error_code=ErrorCode.RESOURCE_NOT_FOUND,
            message=message,
            status_code=404,
            details={'resource': resource, 'resource_id': resource_id},
            suggestions=[
                f'Verify the {resource} ID is correct',
                f'Check if the {resource} exists'
            ],
            request_id=request_id
        )

    @staticmethod
    def rate_limit_error(
        retry_after: Optional[int] = None,
        request_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Build rate limit error response"""
        suggestions = ['You have made too many requests in a short time']

        if retry_after:
            suggestions.append(f'Please wait {retry_after} seconds before trying again')
        else:
            suggestions.append('Please wait a moment before trying again')

        details = {}
        if retry_after:
            details['retry_after'] = retry_after

        return ErrorResponse.build(
            error_code=ErrorCode.RATE_LIMIT_EXCEEDED,
            message='Rate limit exceeded',
            status_code=429,
            details=details,
            suggestions=suggestions,
            request_id=request_id
        )

    @staticmethod
    def quota_exceeded_error(
        quota_type: str = 'API calls',
        request_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Build quota exceeded error"""
        return ErrorResponse.build(
            error_code=ErrorCode.QUOTA_EXCEEDED,
            message=f'Your {quota_type} quota has been exceeded',
            status_code=402,  # Payment Required
            details={'quota_type': quota_type},
            suggestions=[
                'Upgrade your plan for more quota',
                'Wait for your quota to reset',
                'Contact support if you believe this is an error'
            ],
            request_id=request_id
        )

    @staticmethod
    def internal_error(
        message: str = 'An internal server error occurred',
        error_details: Optional[Dict[str, Any]] = None,
        request_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Build internal server error response"""
        suggestions = [
            'This is not your fault - the server encountered an error',
            'Please try again in a few moments'
        ]

        if request_id:
            suggestions.append(f'If the problem persists, contact support with request ID: {request_id}')

        return ErrorResponse.build(
            error_code=ErrorCode.INTERNAL_ERROR,
            message=message,
            status_code=500,
            details=error_details,
            suggestions=suggestions,
            request_id=request_id
        )

    @staticmethod
    def service_unavailable_error(
        service_name: str = 'service',
        request_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Build service unavailable error"""
        return ErrorResponse.build(
            error_code=ErrorCode.SERVICE_UNAVAILABLE,
            message=f'The {service_name} is temporarily unavailable',
            status_code=503,
            details={'service': service_name},
            suggestions=[
                f'The {service_name} is experiencing issues',
                'Please try again in a few minutes',
                'Check the service status page for updates'
            ],
            request_id=request_id
        )

    @staticmethod
    def llm_api_error(
        error_message: str,
        request_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Build LLM API error response"""
        return ErrorResponse.build(
            error_code=ErrorCode.LLM_API_ERROR,
            message='Failed to generate code examples',
            status_code=500,
            details={'llm_error': error_message},
            suggestions=[
                'The AI service encountered an error',
                'Please try again with a simpler request',
                'If the problem persists, contact support'
            ],
            request_id=request_id
        )


def make_error_response(error_dict: Dict[str, Any]) -> Response:
    """
    Create Flask response from error dictionary

    Args:
        error_dict: Error dictionary from ErrorResponse.build()

    Returns:
        Flask Response object
    """
    status_code = error_dict.get('status_code', 500)
    return jsonify(error_dict), status_code


def make_success_response(
    data: Any,
    message: Optional[str] = None,
    request_id: Optional[str] = None
) -> Response:
    """
    Create standardized success response

    Args:
        data: Response data
        message: Optional success message
        request_id: Optional request ID

    Returns:
        Flask Response object
    """
    response = {
        'success': True,
        'data': data,
        'timestamp': datetime.utcnow().isoformat() + 'Z'
    }

    if message:
        response['message'] = message

    if request_id:
        response['request_id'] = request_id

    return jsonify(response), 200


# Convenience functions for common errors

def validation_error_response(validation_errors: List[Dict[str, str]], request_id: Optional[str] = None):
    """Create validation error response"""
    error_dict = ErrorResponse.validation_error(
        message='Request validation failed',
        validation_errors=validation_errors,
        request_id=request_id
    )
    return make_error_response(error_dict)


def missing_field_response(field_name: str, request_id: Optional[str] = None):
    """Create missing field error response"""
    error_dict = ErrorResponse.missing_field_error(field_name, request_id)
    return make_error_response(error_dict)


def auth_required_response(request_id: Optional[str] = None):
    """Create authentication required response"""
    error_dict = ErrorResponse.authentication_error(request_id=request_id)
    return make_error_response(error_dict)


def not_found_response(resource: str, resource_id: Optional[str] = None, request_id: Optional[str] = None):
    """Create not found error response"""
    error_dict = ErrorResponse.not_found_error(resource, resource_id, request_id)
    return make_error_response(error_dict)


def rate_limit_response(retry_after: Optional[int] = None, request_id: Optional[str] = None):
    """Create rate limit error response"""
    error_dict = ErrorResponse.rate_limit_error(retry_after, request_id)
    return make_error_response(error_dict)


def quota_exceeded_response(quota_type: str = 'API calls', request_id: Optional[str] = None):
    """Create quota exceeded error response"""
    error_dict = ErrorResponse.quota_exceeded_error(quota_type, request_id)
    return make_error_response(error_dict)


def internal_error_response(message: str = None, error_details: Optional[Dict[str, Any]] = None,
                          request_id: Optional[str] = None):
    """Create internal server error response"""
    error_dict = ErrorResponse.internal_error(message or 'An internal server error occurred',
                                             error_details, request_id)
    return make_error_response(error_dict)
