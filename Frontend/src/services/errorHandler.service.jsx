/**
 * Error Handler Service
 * Provides comprehensive error handling, categorization, and user-friendly messages
 */

/**
 * Error Categories
 */
export const ErrorCategory = {
    NETWORK: 'NETWORK',
    TIMEOUT: 'TIMEOUT',
    VALIDATION: 'VALIDATION',
    CLIENT_ERROR: 'CLIENT_ERROR',      // 4xx
    SERVER_ERROR: 'SERVER_ERROR',      // 5xx
    AUTHENTICATION: 'AUTHENTICATION',  // 401, 403
    RATE_LIMIT: 'RATE_LIMIT',         // 429
    UNKNOWN: 'UNKNOWN'
};

/**
 * Structured Error Response
 */
export class ApiError {
    constructor({
        category,
        statusCode = null,
        message,
        userMessage,
        details = {},
        originalError = null,
        suggestions = [],
        requestId = null,
        timestamp = new Date().toISOString()
    }) {
        this.category = category;
        this.statusCode = statusCode;
        this.message = message;              // Technical message
        this.userMessage = userMessage;      // User-friendly message
        this.details = details;
        this.originalError = originalError;
        this.suggestions = suggestions;
        this.requestId = requestId;
        this.timestamp = timestamp;
    }

    /**
     * Get formatted error message for display
     */
    getDisplayMessage() {
        let display = `${this.userMessage}`;

        if (this.statusCode) {
            display = `${this.getStatusText()} - ${display}`;
        }

        if (this.suggestions && this.suggestions.length > 0) {
            display += '\n\nSuggestions:\n' + this.suggestions.map(s => `• ${s}`).join('\n');
        }

        if (this.requestId) {
            display += `\n\nRequest ID: ${this.requestId}`;
        }

        display += `\nTimestamp: ${new Date(this.timestamp).toLocaleString()}`;

        return display;
    }

    /**
     * Get HTTP status text
     */
    getStatusText() {
        if (!this.statusCode) return '';

        const statusTexts = {
            400: '400 Bad Request',
            401: '401 Unauthorized',
            403: '403 Forbidden',
            404: '404 Not Found',
            409: '409 Conflict',
            422: '422 Unprocessable Entity',
            429: '429 Too Many Requests',
            500: '500 Internal Server Error',
            502: '502 Bad Gateway',
            503: '503 Service Unavailable',
            504: '504 Gateway Timeout'
        };

        return statusTexts[this.statusCode] || `${this.statusCode} Error`;
    }

    /**
     * Get icon emoji based on category
     */
    getIcon() {
        const icons = {
            [ErrorCategory.NETWORK]: '🌐',
            [ErrorCategory.TIMEOUT]: '⏱️',
            [ErrorCategory.VALIDATION]: '⚠️',
            [ErrorCategory.CLIENT_ERROR]: '❌',
            [ErrorCategory.SERVER_ERROR]: '🔥',
            [ErrorCategory.AUTHENTICATION]: '🔒',
            [ErrorCategory.RATE_LIMIT]: '⏳',
            [ErrorCategory.UNKNOWN]: '❓'
        };

        return icons[this.category] || '❓';
    }

    /**
     * Convert to plain object
     */
    toJSON() {
        return {
            category: this.category,
            statusCode: this.statusCode,
            message: this.message,
            userMessage: this.userMessage,
            details: this.details,
            suggestions: this.suggestions,
            requestId: this.requestId,
            timestamp: this.timestamp
        };
    }
}

/**
 * Error Handler Class
 */
export class ErrorHandler {
    /**
     * Handle and categorize an error from fetch/API call
     * @param {Error} error - Original error
     * @param {Response} response - Fetch response object (if available)
     * @param {Object} context - Additional context
     * @returns {ApiError}
     */
    static async handleApiError(error, response = null, context = {}) {
        // Network errors (no response)
        if (!response) {
            return this.handleNetworkError(error, context);
        }

        // Extract response details
        const statusCode = response.status;
        let responseBody = null;
        let requestId = response.headers?.get('X-Request-ID') || null;

        // Try to parse response body
        try {
            const contentType = response.headers?.get('content-type');
            if (contentType?.includes('application/json')) {
                responseBody = await response.json();
                requestId = requestId || responseBody.request_id || responseBody.requestId;
            } else {
                responseBody = { text: await response.text() };
            }
        } catch (parseError) {
            responseBody = { error: 'Could not parse response' };
        }

        // Categorize by status code
        if (statusCode === 401 || statusCode === 403) {
            return this.handleAuthError(statusCode, responseBody, requestId, context);
        }

        if (statusCode === 429) {
            return this.handleRateLimitError(responseBody, requestId, context);
        }

        if (statusCode >= 400 && statusCode < 500) {
            return this.handleClientError(statusCode, responseBody, requestId, context);
        }

        if (statusCode >= 500) {
            return this.handleServerError(statusCode, responseBody, requestId, context);
        }

        // Unknown error
        return this.handleUnknownError(error, statusCode, responseBody, requestId, context);
    }

    /**
     * Handle network errors (connection failed, DNS errors, etc.)
     */
    static handleNetworkError(error, context) {
        const errorMessage = error.message.toLowerCase();

        // Timeout errors
        if (errorMessage.includes('timeout') || errorMessage.includes('aborted')) {
            return new ApiError({
                category: ErrorCategory.TIMEOUT,
                message: error.message,
                userMessage: 'The request took too long to complete.',
                suggestions: [
                    'Check your internet connection',
                    'Try again in a few moments',
                    'The server may be experiencing high load'
                ],
                originalError: error,
                details: context
            });
        }

        // Network errors
        if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
            return new ApiError({
                category: ErrorCategory.NETWORK,
                message: error.message,
                userMessage: 'Cannot connect to the server.',
                suggestions: [
                    'Check your internet connection',
                    'Verify the server URL is correct',
                    'The server may be temporarily unavailable',
                    'Check if your firewall is blocking the connection'
                ],
                originalError: error,
                details: context
            });
        }

        // Generic network error
        return new ApiError({
            category: ErrorCategory.NETWORK,
            message: error.message,
            userMessage: 'A network error occurred while making the request.',
            suggestions: [
                'Check your internet connection',
                'Try again in a few moments'
            ],
            originalError: error,
            details: context
        });
    }

    /**
     * Handle authentication errors (401, 403)
     */
    static handleAuthError(statusCode, responseBody, requestId, context) {
        const errorMessage = responseBody?.error || responseBody?.message || '';
        const details = responseBody?.details || responseBody?.validation_errors || {};

        const suggestions = statusCode === 401 ? [
            'Verify your API key or authentication token is correct',
            'Check if your credentials have expired',
            'Ensure you\'re using the correct authentication method (Bearer, Basic, etc.)'
        ] : [
            'You don\'t have permission to access this resource',
            'Verify your account has the necessary permissions',
            'Contact your API provider if you believe this is an error'
        ];

        return new ApiError({
            category: ErrorCategory.AUTHENTICATION,
            statusCode,
            message: errorMessage || `Authentication failed (${statusCode})`,
            userMessage: statusCode === 401
                ? 'Authentication required or credentials invalid.'
                : 'You don\'t have permission to perform this action.',
            suggestions,
            requestId,
            details: { ...details, ...context }
        });
    }

    /**
     * Handle rate limit errors (429)
     */
    static handleRateLimitError(responseBody, requestId, context) {
        const retryAfter = responseBody?.retry_after || responseBody?.retryAfter;
        const errorMessage = responseBody?.error || responseBody?.message || '';

        const suggestions = [
            'You\'ve made too many requests in a short time',
            retryAfter ? `Please wait ${retryAfter} seconds before trying again` : 'Please wait a moment before trying again',
            'Consider implementing request throttling in your application'
        ];

        return new ApiError({
            category: ErrorCategory.RATE_LIMIT,
            statusCode: 429,
            message: errorMessage || 'Rate limit exceeded',
            userMessage: 'Too many requests. Please slow down.',
            suggestions,
            requestId,
            details: { retryAfter, ...context }
        });
    }

    /**
     * Handle client errors (400-499)
     */
    static handleClientError(statusCode, responseBody, requestId, context) {
        const errorMessage = responseBody?.error || responseBody?.message || '';
        const details = responseBody?.details || {};
        const validationErrors = responseBody?.validation_errors || [];

        const suggestions = [];

        // Validation errors
        if (validationErrors.length > 0) {
            suggestions.push('Please fix the following validation errors:');
            validationErrors.forEach(err => {
                suggestions.push(`  - ${err.field}: ${err.message}`);
            });
        }

        // Specific status code suggestions
        if (statusCode === 400) {
            suggestions.push('Check that all required fields are provided');
            suggestions.push('Verify the request format matches the API specification');
        } else if (statusCode === 404) {
            suggestions.push('Verify the endpoint URL is correct');
            suggestions.push('Check if the resource ID exists');
        } else if (statusCode === 422) {
            suggestions.push('The data you provided is valid but cannot be processed');
            suggestions.push('Check for business logic constraints');
        }

        return new ApiError({
            category: ErrorCategory.VALIDATION,
            statusCode,
            message: errorMessage || `Client error (${statusCode})`,
            userMessage: this.getUserFriendlyMessage(statusCode, errorMessage),
            suggestions: suggestions.length > 0 ? suggestions : ['Please check your request and try again'],
            requestId,
            details: { validationErrors, ...details, ...context }
        });
    }

    /**
     * Handle server errors (500-599)
     */
    static handleServerError(statusCode, responseBody, requestId, context) {
        const errorMessage = responseBody?.error || responseBody?.message || '';
        const details = responseBody?.details || {};

        const suggestions = [
            'The server encountered an error processing your request',
            'Please try again in a few moments',
            'If the problem persists, contact support with the request ID below'
        ];

        return new ApiError({
            category: ErrorCategory.SERVER_ERROR,
            statusCode,
            message: errorMessage || `Server error (${statusCode})`,
            userMessage: 'The server encountered an error. This is not your fault.',
            suggestions,
            requestId,
            details: { ...details, ...context }
        });
    }

    /**
     * Handle unknown errors
     */
    static handleUnknownError(error, statusCode, responseBody, requestId, context) {
        return new ApiError({
            category: ErrorCategory.UNKNOWN,
            statusCode,
            message: error?.message || 'Unknown error occurred',
            userMessage: 'An unexpected error occurred.',
            suggestions: [
                'Please try again',
                'If the problem persists, contact support'
            ],
            requestId,
            originalError: error,
            details: { responseBody, ...context }
        });
    }

    /**
     * Get user-friendly message based on status code and error
     */
    static getUserFriendlyMessage(statusCode, errorMessage) {
        // Try to provide context-aware messages
        const lowerMessage = errorMessage.toLowerCase();

        if (lowerMessage.includes('missing')) {
            return 'Some required information is missing from your request.';
        }

        if (lowerMessage.includes('invalid')) {
            return 'Some of the information you provided is invalid.';
        }

        if (lowerMessage.includes('malformed')) {
            return 'The request format is incorrect.';
        }

        // Default messages by status code
        const defaultMessages = {
            400: 'The request could not be understood. Please check your input.',
            404: 'The requested resource was not found.',
            409: 'There is a conflict with the current state of the resource.',
            422: 'The request data is valid but cannot be processed.'
        };

        return defaultMessages[statusCode] || 'Something went wrong with your request.';
    }

    /**
     * Log error to console (and optionally to backend)
     */
    static logError(apiError, sendToBackend = false) {
        console.group(`${apiError.getIcon()} ${apiError.category} Error`);
        console.error('Message:', apiError.message);
        console.error('User Message:', apiError.userMessage);
        if (apiError.statusCode) {
            console.error('Status:', apiError.statusCode);
        }
        if (apiError.requestId) {
            console.error('Request ID:', apiError.requestId);
        }
        console.error('Timestamp:', apiError.timestamp);
        if (Object.keys(apiError.details).length > 0) {
            console.error('Details:', apiError.details);
        }
        if (apiError.originalError) {
            console.error('Original Error:', apiError.originalError);
        }
        console.groupEnd();

        // TODO: Send to backend logging service if enabled
        if (sendToBackend && apiError.category === ErrorCategory.SERVER_ERROR) {
            // this.sendErrorToBackend(apiError);
        }
    }
}

/**
 * Convenience function to handle fetch errors
 * @param {Promise<Response>} fetchPromise - Fetch promise
 * @param {Object} context - Additional context
 * @returns {Promise<any>} - Parsed response data
 */
export async function handleFetchError(fetchPromise, context = {}) {
    try {
        const response = await fetchPromise;

        if (!response.ok) {
            const apiError = await ErrorHandler.handleApiError(
                new Error(`HTTP error! status: ${response.status}`),
                response,
                context
            );
            ErrorHandler.logError(apiError);
            throw apiError;
        }

        return await response.json();
    } catch (error) {
        // If it's already an ApiError, rethrow it
        if (error instanceof ApiError) {
            throw error;
        }

        // Handle network/parse errors
        const apiError = await ErrorHandler.handleApiError(error, null, context);
        ErrorHandler.logError(apiError);
        throw apiError;
    }
}

export default ErrorHandler;
