// React imports (if needed for future React-specific functionality)
import { useCallback } from 'react';

/**
 * Fix and normalize API URLs
 * @param {string} url - The URL to fix
 * @param {string} baseUrl - Optional base URL to prepend to relative paths
 * @returns {string} The fixed URL
 */
export const fixApiUrl = (url, baseUrl = '') => {
    if (!url) return url;
    
    // Fix common placeholder URLs
    if (url.includes('api.example.com') || url.includes('example.com')) {
        return url.replace(/https?:\/\/[^\/]+\/v1\/messages/g, 'https://api.anthropic.com/v1/messages');
    }
    
    // Handle relative URLs
    if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
    }
    
    // Handle URLs without protocol
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return `https://${url}`;
    }
    
    return url;
};

/**
 * Validate API URLs and return validation result
 * @param {string} url - The URL to validate
 * @param {string} baseUrl - Optional base URL for validation context
 * @returns {Object} Validation result with valid, error, and fixed URL
 */
export const validateApiUrl = (url, baseUrl = '') => {
    if (!url) return { valid: false, error: 'No URL provided' };
    
    // Check for placeholder URLs
    if (url.includes('api.example.com') || url.includes('example.com')) {
        return { 
            valid: false, 
            error: 'Placeholder URL detected. Please regenerate the API call.',
            fixed: fixApiUrl(url, baseUrl)
        };
    }
    
    try {
        // If URL is relative, prepend base URL
        let fullUrl = url;
        if (url.startsWith('/')) {
            if (!baseUrl) {
                return {
                    valid: false,
                    error: 'Relative URL provided but no base URL available. Please provide a complete URL.'
                };
            }
            fullUrl = `${baseUrl}${url}`;
        }

        // Special handling for Swagger Petstore
        if (fullUrl.includes('petstore.swagger.io')) {
            if (!fullUrl.includes('/v2')) {
                fullUrl = fullUrl.replace('petstore.swagger.io', 'petstore.swagger.io/v2');
            }
            // Ensure HTTPS
            if (fullUrl.startsWith('http://')) {
                fullUrl = fullUrl.replace('http://', 'https://');
            }
        }

        // Handle URLs without protocol
        if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
            fullUrl = `https://${fullUrl}`;
        }
        
        // Check if it's a valid HTTP/HTTPS URL
        const parsedUrl = new URL(fullUrl);
        
        // Validate protocol
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
            return {
                valid: false,
                error: 'URL must use HTTP or HTTPS protocol'
            };
        }

        // Clean up double slashes (except after protocol)
        fullUrl = fullUrl.replace(/([^:])\/+/g, '$1/');

        return {
            valid: true,
            url: fullUrl
        };
    } catch (error) {
        return { valid: false, error: 'Invalid URL format' };
    }
};

/**
 * React hook for testing API URLs with proper error handling and CORS support
 * @param {Object} options - Default options to use for all requests
 * @returns {Function} Memoized test function
 */
export const useTestApiUrl = (defaultOptions = {}) => {
    return useCallback(async (url, options = {}) => {
        try {
            // Validate and fix URL first
            const validation = validateApiUrl(url);
            if (!validation.valid) {
                throw new Error(validation.error);
            }
            
            // Use the fixed URL if provided
            const finalUrl = validation.url || url;
            
            // Merge default options with provided options
            const finalOptions = {
                method: options.method || defaultOptions.method || 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...defaultOptions.headers,
                    ...options.headers
                },
                mode: 'cors',
                ...defaultOptions,
                ...options
            };
            
            // For OPTIONS requests, add CORS headers
            if (finalOptions.method === 'OPTIONS') {
                finalOptions.headers = {
                    ...finalOptions.headers,
                    'Access-Control-Request-Method': 'GET,POST,PUT,DELETE,OPTIONS',
                    'Access-Control-Request-Headers': 'Content-Type,Authorization'
                };
            }
            

            const response = await fetch(finalUrl, finalOptions);
            
            // Check if response is ok (status in 200-299 range)
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            // Try to parse response as JSON
            let data;
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                data = await response.text();
            }
            
            return { 
                accessible: true, 
                status: response.status,
                cors: response.headers.get('access-control-allow-origin') !== null,
                data,
                headers: Object.fromEntries(response.headers.entries())
            };
        } catch (error) {

            return { 
                accessible: false, 
                error: error.message,
                details: error.stack
            };
        }
    }, [defaultOptions]);
};

// For non-React usage, also export the plain function
export const testApiUrl = async (url, options = {}) => {
    try {
        // Validate and fix URL first
        const validation = validateApiUrl(url);
        if (!validation.valid) {
            throw new Error(validation.error);
        }
        
        // Use the fixed URL if provided
        const finalUrl = validation.url || url;
        
        // Merge default options with provided options
        const finalOptions = {
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            mode: 'cors',
            ...options
        };
        
        // For OPTIONS requests, add CORS headers
        if (finalOptions.method === 'OPTIONS') {
            finalOptions.headers = {
                ...finalOptions.headers,
                'Access-Control-Request-Method': 'GET,POST,PUT,DELETE,OPTIONS',
                'Access-Control-Request-Headers': 'Content-Type,Authorization'
            };
        }
        

        const response = await fetch(finalUrl, finalOptions);
        
        // Check if response is ok (status in 200-299 range)
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Try to parse response as JSON
        let data;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            data = await response.text();
        }
        
        return { 
            accessible: true, 
            status: response.status,
            cors: response.headers.get('access-control-allow-origin') !== null,
            data,
            headers: Object.fromEntries(response.headers.entries())
        };
    } catch (error) {

        return { 
            accessible: false, 
            error: error.message,
            details: error.stack
        };
    }
};
