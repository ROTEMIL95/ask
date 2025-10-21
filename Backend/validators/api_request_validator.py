"""
API Request Validator - Pre-generation validation
Validates API request configuration before sending to LLM for code generation
"""
import re
from datetime import datetime
from typing import Dict, List, Any, Optional


class ValidationError:
    """Structured validation error"""
    def __init__(self, field: str, code: str, message: str):
        self.field = field
        self.code = code
        self.message = message

    def to_dict(self):
        return {
            'field': self.field,
            'code': self.code,
            'message': self.message
        }


class APIRequestValidator:
    """Validator for API request configuration"""

    VALID_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']
    METHODS_WITHOUT_BODY = ['GET', 'DELETE', 'HEAD', 'OPTIONS']
    METHODS_WITH_BODY = ['POST', 'PUT', 'PATCH']

    def __init__(self):
        self.errors: List[ValidationError] = []

    def validate(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate API request configuration

        Args:
            request_data: Dictionary containing API request configuration

        Returns:
            Dictionary with validation results: {'valid': bool, 'errors': List[dict]}
        """
        self.errors = []

        # Extract request components
        base_url = request_data.get('baseUrl', '').strip() if request_data.get('baseUrl') else ''
        path = request_data.get('path', '').strip() if request_data.get('path') else ''
        method = request_data.get('method', '').strip().upper() if request_data.get('method') else ''
        body = request_data.get('body')
        query_params = request_data.get('queryParams', {})
        headers = request_data.get('headers', {})
        auth = request_data.get('auth', {})

        # 1. Basic Required Fields
        self._validate_required_fields(base_url, path, method)

        # 2. HTTP Method Logic
        self._validate_method_logic(method, body)

        # 3. Authentication Rules
        self._validate_auth(auth)

        # 4. Path and Query Validation
        self._validate_path(path)
        self._validate_query_params(query_params)
        self._validate_url_format(base_url, path)

        # 5. Date Validation (in body, query params, headers)
        self._validate_dates(body, 'body')
        self._validate_dates(query_params, 'queryParams')
        self._validate_dates(headers, 'headers')

        # 6. Headers Validation
        self._validate_headers(headers, method)

        return {
            'valid': len(self.errors) == 0,
            'errors': [error.to_dict() for error in self.errors]
        }

    def _validate_required_fields(self, base_url: str, path: str, method: str):
        """Validate required fields are present and not null/undefined/empty"""
        if not base_url or base_url.lower() in ['null', 'undefined', '']:
            self.errors.append(ValidationError(
                'baseUrl',
                'missing_base_url',
                'Base URL is required and cannot be empty, null, or undefined'
            ))

        if not path or path.lower() in ['null', 'undefined', '']:
            self.errors.append(ValidationError(
                'path',
                'missing_path',
                'Path is required and cannot be empty, null, or undefined'
            ))

        if not method or method.lower() in ['null', 'undefined', '']:
            self.errors.append(ValidationError(
                'method',
                'missing_method',
                'HTTP method is required and cannot be empty, null, or undefined'
            ))
        elif method not in self.VALID_METHODS:
            self.errors.append(ValidationError(
                'method',
                'invalid_method',
                f'Invalid HTTP method. Must be one of: {", ".join(self.VALID_METHODS)}'
            ))

    def _validate_method_logic(self, method: str, body: Any):
        """Validate HTTP method logic (body requirements)"""
        if method in self.METHODS_WITHOUT_BODY:
            if body is not None and body != '':
                self.errors.append(ValidationError(
                    'body',
                    'unexpected_body',
                    f'{method} requests must not include a body'
                ))

        elif method in self.METHODS_WITH_BODY:
            if body is None or body == '':
                self.errors.append(ValidationError(
                    'body',
                    'missing_body',
                    f'{method} requests must include a valid JSON body'
                ))
            elif isinstance(body, str):
                # Try to parse as JSON
                import json
                try:
                    parsed = json.loads(body)
                    if not isinstance(parsed, dict):
                        self.errors.append(ValidationError(
                            'body',
                            'invalid_body_format',
                            'Request body must be a JSON object'
                        ))
                except json.JSONDecodeError:
                    self.errors.append(ValidationError(
                        'body',
                        'invalid_json',
                        'Request body must be valid JSON'
                    ))
            elif not isinstance(body, dict):
                self.errors.append(ValidationError(
                    'body',
                    'invalid_body_type',
                    'Request body must be a JSON object'
                ))

    def _validate_auth(self, auth: Dict[str, Any]):
        """Validate authentication configuration"""
        if not auth or not isinstance(auth, dict):
            return

        auth_type = auth.get('type', '').lower()

        if auth_type == 'bearer':
            token = auth.get('token', '').strip() if auth.get('token') else ''
            if not token or token.lower() in ['null', 'undefined', '']:
                self.errors.append(ValidationError(
                    'auth.token',
                    'missing_bearer_token',
                    'Bearer token is required when auth type is "bearer"'
                ))

        elif auth_type == 'basic':
            username = auth.get('username', '').strip() if auth.get('username') else ''
            password = auth.get('password', '').strip() if auth.get('password') else ''

            if not username or username.lower() in ['null', 'undefined', '']:
                self.errors.append(ValidationError(
                    'auth.username',
                    'missing_username',
                    'Username is required for basic authentication'
                ))

            if not password or password.lower() in ['null', 'undefined', '']:
                self.errors.append(ValidationError(
                    'auth.password',
                    'missing_password',
                    'Password is required for basic authentication'
                ))

        elif auth_type == 'header':
            header_name = auth.get('headerName', '').strip() if auth.get('headerName') else ''
            header_value = auth.get('headerValue', '').strip() if auth.get('headerValue') else ''

            if not header_name or header_name.lower() in ['null', 'undefined', '']:
                self.errors.append(ValidationError(
                    'auth.headerName',
                    'missing_header_name',
                    'Header name is required for header authentication'
                ))

            if not header_value or header_value.lower() in ['null', 'undefined', '']:
                self.errors.append(ValidationError(
                    'auth.headerValue',
                    'missing_header_value',
                    'Header value is required for header authentication'
                ))

        elif auth_type == 'none':
            # Ensure no auth fields are present
            if any(key in auth for key in ['token', 'username', 'password', 'headerName', 'headerValue']):
                self.errors.append(ValidationError(
                    'auth',
                    'unexpected_auth_fields',
                    'Auth type is "none" but authentication fields are present'
                ))

    def _validate_path(self, path: str):
        """Validate path doesn't contain unresolved placeholders"""
        if not path:
            return

        # Check for unresolved placeholders like {id}, {user}, etc.
        placeholder_pattern = r'\{[a-zA-Z_][a-zA-Z0-9_]*\}'
        placeholders = re.findall(placeholder_pattern, path)

        if placeholders:
            self.errors.append(ValidationError(
                'path',
                'unresolved_placeholders',
                f'Path contains unresolved placeholders: {", ".join(placeholders)}. Please replace them with actual values.'
            ))

    def _validate_query_params(self, query_params: Dict[str, Any]):
        """Validate and sanitize query parameters"""
        if not query_params or not isinstance(query_params, dict):
            return

        invalid_params = []
        for key, value in query_params.items():
            # Skip null, undefined, or empty values
            if value is None or str(value).strip().lower() in ['null', 'undefined', '']:
                invalid_params.append(key)

        if invalid_params:
            self.errors.append(ValidationError(
                'queryParams',
                'invalid_query_params',
                f'Query parameters contain null/undefined/empty values: {", ".join(invalid_params)}'
            ))

    def _validate_url_format(self, base_url: str, path: str):
        """Validate URL format and prevent malformed URLs"""
        if not base_url or not path:
            return

        # Check for "undefined" or "null" in URL
        combined_url = f"{base_url}/{path}".lower()
        if 'undefined' in combined_url or 'null' in combined_url:
            self.errors.append(ValidationError(
                'url',
                'malformed_url',
                'URL contains "undefined" or "null" - please provide valid values'
            ))

        # Check for double slashes (except after protocol)
        url_without_protocol = base_url.replace('https://', '').replace('http://', '')
        if '//' in url_without_protocol or '//' in path:
            self.errors.append(ValidationError(
                'url',
                'double_slashes',
                'URL contains double slashes - please check baseUrl and path'
            ))

        # Validate baseUrl ends with single /
        if not base_url.endswith('/') and path and not path.startswith('/'):
            self.errors.append(ValidationError(
                'url',
                'missing_slash',
                'BaseUrl should end with "/" or path should start with "/"'
            ))

    def _validate_dates(self, data: Any, field_prefix: str):
        """Validate date values follow YYYY-MM-DD format"""
        if not data or not isinstance(data, dict):
            return

        date_pattern = r'^\d{4}-\d{2}-\d{2}$'
        date_fields = ['date', 'checkIn', 'checkOut', 'startDate', 'endDate', 'createdAt', 'updatedAt']

        for key, value in data.items():
            # Check if field name suggests it's a date
            if any(date_field.lower() in key.lower() for date_field in date_fields):
                if isinstance(value, str) and value.strip():
                    value = value.strip()

                    # Check format
                    if not re.match(date_pattern, value):
                        self.errors.append(ValidationError(
                            f'{field_prefix}.{key}',
                            'invalid_date_format',
                            f'Date must follow YYYY-MM-DD format, got: {value}'
                        ))
                    else:
                        # Validate actual date
                        try:
                            year, month, day = map(int, value.split('-'))
                            datetime(year, month, day)
                        except ValueError:
                            self.errors.append(ValidationError(
                                f'{field_prefix}.{key}',
                                'invalid_date_value',
                                f'Invalid date value: {value} (e.g., month > 12, day > 31)'
                            ))

    def _validate_headers(self, headers: Dict[str, str], method: str):
        """Validate headers and ensure defaults are present"""
        if not isinstance(headers, dict):
            headers = {}

        # Check for empty or undefined header values
        invalid_headers = []
        for key, value in headers.items():
            if not value or str(value).strip().lower() in ['null', 'undefined', '']:
                invalid_headers.append(key)

        if invalid_headers:
            self.errors.append(ValidationError(
                'headers',
                'invalid_header_values',
                f'Headers contain empty/null/undefined values: {", ".join(invalid_headers)}'
            ))

        # Check for duplicate headers (case-insensitive)
        header_keys_lower = [k.lower() for k in headers.keys()]
        if len(header_keys_lower) != len(set(header_keys_lower)):
            self.errors.append(ValidationError(
                'headers',
                'duplicate_headers',
                'Headers contain duplicate keys (case-insensitive)'
            ))


def validate_api_request(request_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate API request configuration

    Args:
        request_data: Dictionary containing API request configuration

    Returns:
        Dictionary with validation results: {'valid': bool, 'errors': List[dict]}
    """
    validator = APIRequestValidator()
    return validator.validate(request_data)
