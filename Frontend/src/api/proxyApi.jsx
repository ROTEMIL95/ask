import { useState, useCallback } from 'react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

// Function to sanitize error messages for user display
const sanitizeErrorMessage = (errorMessage) => {
  if (!errorMessage) return 'An unexpected error occurred'
  
  // Convert to lowercase for easier matching
  const message = errorMessage.toLowerCase()
  
  if (message.includes('network error') || message.includes('fetch')) {
    return 'Connection error. Please check your internet connection and try again.'
  }
  
  if (message.includes('timeout')) {
    return 'Request timed out. Please try again.'
  }
  
  if (message.includes('invalid url')) {
    return 'Invalid URL provided. Please check the URL format.'
  }
  
  if (message.includes('rate limit') || message.includes('429')) {
    return 'Too many requests. Please wait a moment before trying again.'
  }
  
  // Default user-friendly message for unknown errors
  return 'Something went wrong. Please try again.'
}

/**
 * Custom hook for proxy API operations
 */
export const useProxyApi = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    /**
     * Make a proxy API call through the backend
     * @param {Object} requestData - The request data
     * @param {string} requestData.url - The target URL
     * @param {string} requestData.method - HTTP method (GET, POST, etc.)
     * @param {Object} requestData.headers - Request headers
     * @param {Object|string} requestData.body - Request body
     * @returns {Promise<Object>} - The response from the proxy
     */
    const proxyApiCall = useCallback(async (requestData) => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await fetch(`${BACKEND_URL}/proxy-api`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error || `HTTP error! status: ${response.status}`;
                throw new Error(errorMessage);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            const sanitizedError = sanitizeErrorMessage(error.message);
            setError(sanitizedError);
            throw new Error(sanitizedError);
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Fetch external documentation through the backend
     * @param {string} url - The URL of the documentation to fetch
     * @returns {Promise<Object>} - The documentation content
     */
    const fetchDocumentation = useCallback(async (url) => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await fetch(`${BACKEND_URL}/proxy-docs?url=${encodeURIComponent(url)}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error || `HTTP error! status: ${response.status}`;
                throw new Error(errorMessage);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            const sanitizedError = sanitizeErrorMessage(error.message);
            setError(sanitizedError);
            throw new Error(sanitizedError);
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        proxyApiCall,
        fetchDocumentation,
        loading,
        error
    };
};

/**
 * Standalone functions for direct use
 */
export const proxyApiCall = async (requestData) => {
    try {
        const response = await fetch(`${BACKEND_URL}/proxy-api`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.error || `HTTP error! status: ${response.status}`;
            throw new Error(errorMessage);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        throw new Error(sanitizeErrorMessage(error.message));
    }
};

export const fetchDocumentation = async (url) => {
    try {
        const response = await fetch(`${BACKEND_URL}/proxy-docs?url=${encodeURIComponent(url)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.error || `HTTP error! status: ${response.status}`;
            throw new Error(errorMessage);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        throw new Error(sanitizeErrorMessage(error.message));
    }
}; 