/**
 * API Request Validator - Client-side validation
 * Validates API request configuration before sending to backend
 */

/**
 * Structured validation error
 */
class ValidationError {
    constructor(field, code, message) {
        this.field = field;
        this.code = code;
        this.message = message;
    }

    toObject() {
        return {
            field: this.field,
            code: this.code,
            message: this.message
        };
    }
}

/**
 * API Request Validator
 */
class APIRequestValidator {
    static VALID_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
    static METHODS_WITHOUT_BODY = ['GET', 'DELETE', 'HEAD', 'OPTIONS'];
    static METHODS_WITH_BODY = ['POST', 'PUT', 'PATCH'];

    constructor() {
        this.errors = [];
    }

    /**
     * Validate API request configuration
     * @param {Object} requestData - API request configuration
     * @returns {Object} - Validation results: {valid: boolean, errors: Array}
     */
    validate(requestData) {
        this.errors = [];

        // Extract request components
        const baseUrl = (requestData.baseUrl || '').trim();
        const path = (requestData.path || '').trim();
        const method = (requestData.method || '').trim().toUpperCase();
        const body = requestData.body;
        const queryParams = requestData.queryParams || {};
        const headers = requestData.headers || {};
        const auth = requestData.auth || {};

        // 1. Basic Required Fields
        this._validateRequiredFields(baseUrl, path, method);

        // 2. HTTP Method Logic
        this._validateMethodLogic(method, body);

        // 3. Authentication Rules
        this._validateAuth(auth);

        // 4. Path and Query Validation
        this._validatePath(path);
        this._validateQueryParams(queryParams);
        this._validateUrlFormat(baseUrl, path);

        // 5. Date Validation
        this._validateDates(body, 'body');
        this._validateDates(queryParams, 'queryParams');
        this._validateDates(headers, 'headers');

        // 6. Headers Validation
        this._validateHeaders(headers, method);

        return {
            valid: this.errors.length === 0,
            errors: this.errors.map(err => err.toObject())
        };
    }

    _validateRequiredFields(baseUrl, path, method) {
        if (!baseUrl || ['null', 'undefined', ''].includes(baseUrl.toLowerCase())) {
            this.errors.push(new ValidationError(
                'baseUrl',
                'missing_base_url',
                'Base URL is required and cannot be empty, null, or undefined'
            ));
        }

        if (!path || ['null', 'undefined', ''].includes(path.toLowerCase())) {
            this.errors.push(new ValidationError(
                'path',
                'missing_path',
                'Path is required and cannot be empty, null, or undefined'
            ));
        }

        if (!method || ['null', 'undefined', ''].includes(method.toLowerCase())) {
            this.errors.push(new ValidationError(
                'method',
                'missing_method',
                'HTTP method is required and cannot be empty, null, or undefined'
            ));
        } else if (!APIRequestValidator.VALID_METHODS.includes(method)) {
            this.errors.push(new ValidationError(
                'method',
                'invalid_method',
                `Invalid HTTP method. Must be one of: ${APIRequestValidator.VALID_METHODS.join(', ')}`
            ));
        }
    }

    _validateMethodLogic(method, body) {
        if (APIRequestValidator.METHODS_WITHOUT_BODY.includes(method)) {
            if (body !== null && body !== undefined && body !== '') {
                this.errors.push(new ValidationError(
                    'body',
                    'unexpected_body',
                    `${method} requests must not include a body`
                ));
            }
        } else if (APIRequestValidator.METHODS_WITH_BODY.includes(method)) {
            if (body === null || body === undefined || body === '') {
                this.errors.push(new ValidationError(
                    'body',
                    'missing_body',
                    `${method} requests must include a valid JSON body`
                ));
            } else if (typeof body === 'string') {
                try {
                    const parsed = JSON.parse(body);
                    if (typeof parsed !== 'object' || Array.isArray(parsed)) {
                        this.errors.push(new ValidationError(
                            'body',
                            'invalid_body_format',
                            'Request body must be a JSON object'
                        ));
                    }
                } catch (e) {
                    this.errors.push(new ValidationError(
                        'body',
                        'invalid_json',
                        'Request body must be valid JSON'
                    ));
                }
            } else if (typeof body !== 'object' || Array.isArray(body)) {
                this.errors.push(new ValidationError(
                    'body',
                    'invalid_body_type',
                    'Request body must be a JSON object'
                ));
            }
        }
    }

    _validateAuth(auth) {
        if (!auth || typeof auth !== 'object') {
            return;
        }

        const authType = (auth.type || '').toLowerCase();

        if (authType === 'bearer') {
            const token = (auth.token || '').trim();
            if (!token || ['null', 'undefined', ''].includes(token.toLowerCase())) {
                this.errors.push(new ValidationError(
                    'auth.token',
                    'missing_bearer_token',
                    'Bearer token is required when auth type is "bearer"'
                ));
            }
        } else if (authType === 'basic') {
            const username = (auth.username || '').trim();
            const password = (auth.password || '').trim();

            if (!username || ['null', 'undefined', ''].includes(username.toLowerCase())) {
                this.errors.push(new ValidationError(
                    'auth.username',
                    'missing_username',
                    'Username is required for basic authentication'
                ));
            }

            if (!password || ['null', 'undefined', ''].includes(password.toLowerCase())) {
                this.errors.push(new ValidationError(
                    'auth.password',
                    'missing_password',
                    'Password is required for basic authentication'
                ));
            }
        } else if (authType === 'header') {
            const headerName = (auth.headerName || '').trim();
            const headerValue = (auth.headerValue || '').trim();

            if (!headerName || ['null', 'undefined', ''].includes(headerName.toLowerCase())) {
                this.errors.push(new ValidationError(
                    'auth.headerName',
                    'missing_header_name',
                    'Header name is required for header authentication'
                ));
            }

            if (!headerValue || ['null', 'undefined', ''].includes(headerValue.toLowerCase())) {
                this.errors.push(new ValidationError(
                    'auth.headerValue',
                    'missing_header_value',
                    'Header value is required for header authentication'
                ));
            }
        } else if (authType === 'none') {
            const authFields = ['token', 'username', 'password', 'headerName', 'headerValue'];
            if (authFields.some(field => auth[field])) {
                this.errors.push(new ValidationError(
                    'auth',
                    'unexpected_auth_fields',
                    'Auth type is "none" but authentication fields are present'
                ));
            }
        }
    }

    _validatePath(path) {
        if (!path) return;

        // Check for unresolved placeholders like {id}, {user}
        const placeholderPattern = /\{[a-zA-Z_][a-zA-Z0-9_]*\}/g;
        const placeholders = path.match(placeholderPattern);

        if (placeholders && placeholders.length > 0) {
            this.errors.push(new ValidationError(
                'path',
                'unresolved_placeholders',
                `Path contains unresolved placeholders: ${placeholders.join(', ')}. Please replace them with actual values.`
            ));
        }
    }

    _validateQueryParams(queryParams) {
        if (!queryParams || typeof queryParams !== 'object') return;

        const invalidParams = [];
        for (const [key, value] of Object.entries(queryParams)) {
            if (value === null || value === undefined ||
                String(value).trim().toLowerCase() === '' ||
                ['null', 'undefined'].includes(String(value).trim().toLowerCase())) {
                invalidParams.push(key);
            }
        }

        if (invalidParams.length > 0) {
            this.errors.push(new ValidationError(
                'queryParams',
                'invalid_query_params',
                `Query parameters contain null/undefined/empty values: ${invalidParams.join(', ')}`
            ));
        }
    }

    _validateUrlFormat(baseUrl, path) {
        if (!baseUrl || !path) return;

        // Check for "undefined" or "null" in URL
        const combinedUrl = `${baseUrl}/${path}`.toLowerCase();
        if (combinedUrl.includes('undefined') || combinedUrl.includes('null')) {
            this.errors.push(new ValidationError(
                'url',
                'malformed_url',
                'URL contains "undefined" or "null" - please provide valid values'
            ));
        }

        // Check for double slashes (except after protocol)
        const urlWithoutProtocol = baseUrl.replace(/https?:\/\//, '');
        if (urlWithoutProtocol.includes('//') || path.includes('//')) {
            this.errors.push(new ValidationError(
                'url',
                'double_slashes',
                'URL contains double slashes - please check baseUrl and path'
            ));
        }

        // Validate baseUrl ends with / or path starts with /
        if (!baseUrl.endsWith('/') && path && !path.startsWith('/')) {
            this.errors.push(new ValidationError(
                'url',
                'missing_slash',
                'BaseUrl should end with "/" or path should start with "/"'
            ));
        }
    }

    _validateDates(data, fieldPrefix) {
        if (!data || typeof data !== 'object') return;

        const datePattern = /^\d{4}-\d{2}-\d{2}$/;
        const dateFields = ['date', 'checkIn', 'checkOut', 'startDate', 'endDate', 'createdAt', 'updatedAt'];

        for (const [key, value] of Object.entries(data)) {
            // Check if field name suggests it's a date
            if (dateFields.some(dateField => key.toLowerCase().includes(dateField.toLowerCase()))) {
                if (typeof value === 'string' && value.trim()) {
                    const trimmedValue = value.trim();

                    // Check format
                    if (!datePattern.test(trimmedValue)) {
                        this.errors.push(new ValidationError(
                            `${fieldPrefix}.${key}`,
                            'invalid_date_format',
                            `Date must follow YYYY-MM-DD format, got: ${trimmedValue}`
                        ));
                    } else {
                        // Validate actual date
                        const [year, month, day] = trimmedValue.split('-').map(Number);
                        const dateObj = new Date(year, month - 1, day);

                        if (dateObj.getFullYear() !== year ||
                            dateObj.getMonth() !== month - 1 ||
                            dateObj.getDate() !== day) {
                            this.errors.push(new ValidationError(
                                `${fieldPrefix}.${key}`,
                                'invalid_date_value',
                                `Invalid date value: ${trimmedValue} (e.g., month > 12, day > 31)`
                            ));
                        }
                    }
                }
            }
        }
    }

    _validateHeaders(headers, method) {
        if (typeof headers !== 'object') return;

        // Check for empty or undefined header values
        const invalidHeaders = [];
        for (const [key, value] of Object.entries(headers)) {
            if (!value || ['null', 'undefined', ''].includes(String(value).trim().toLowerCase())) {
                invalidHeaders.push(key);
            }
        }

        if (invalidHeaders.length > 0) {
            this.errors.push(new ValidationError(
                'headers',
                'invalid_header_values',
                `Headers contain empty/null/undefined values: ${invalidHeaders.join(', ')}`
            ));
        }

        // Check for duplicate headers (case-insensitive)
        const headerKeysLower = Object.keys(headers).map(k => k.toLowerCase());
        const uniqueKeys = new Set(headerKeysLower);
        if (headerKeysLower.length !== uniqueKeys.size) {
            this.errors.push(new ValidationError(
                'headers',
                'duplicate_headers',
                'Headers contain duplicate keys (case-insensitive)'
            ));
        }
    }
}

/**
 * Validate API request configuration
 * @param {Object} requestData - API request configuration
 * @returns {Object} - Validation results: {valid: boolean, errors: Array}
 */
export function validateApiRequest(requestData) {
    const validator = new APIRequestValidator();
    return validator.validate(requestData);
}

export default validateApiRequest;
