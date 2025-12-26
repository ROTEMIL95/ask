import { useState, useCallback } from 'react';

// Get the backend URL from environment or use default
const getBackendUrl = () => {
    // Prefer explicit env var
    const configured = import.meta.env.VITE_BACKEND_URL;
    if (configured && configured.trim()) return configured.trim();

    // Development fallback
    if (import.meta.env.DEV) return 'http://localhost:5000';

    // Production fallback (Render)
    return 'https://askapi-0vze.onrender.com';
};


// Function to get API keys from the backend
export const analyzeApiDoc = async (doc) => {
    try {
        const response = await fetch(`${getBackendUrl()}/analyze-api`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'https://talkapi.ai'
            },
            credentials: 'include',
            body: JSON.stringify({ doc })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Failed to analyze API documentation`);
        }

        const data = await response.json();
        return data;
    } catch (error) {

        throw new Error(`Failed to analyze API documentation: ${error.message}`);
    }
};

export const getApiKey = async (service) => {
    try {
        const response = await fetch(`${getBackendUrl()}/get-api-key`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'https://talkapi.ai'
            },
            credentials: 'include',
            body: JSON.stringify({ service })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Failed to get ${service} API key`);
        }

        const data = await response.json();
        return data.api_key;
    } catch (error) {

        throw new Error(`Failed to get ${service} API key: ${error.message}`);
    }
};

// OCR function to process uploaded images (kept for separate OCR functionality)
export const processImageOCR = async (imageFile) => {
    try {

        const formData = new FormData();
        formData.append('image', imageFile);
        

        const response = await fetch(`${getBackendUrl()}/ocr`, {
            method: 'POST',
            body: formData,
        });


        if (!response.ok) {
            let errorMessage = 'OCR processing failed';
            
            // Check content type to determine how to read the response
            const contentType = response.headers.get('content-type');
            
            if (contentType && contentType.includes('application/json')) {
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } catch (parseError) {

                    errorMessage = `OCR error (${response.status}): Invalid response format`;
                }
            } else {
                // Handle HTML/text error responses
                try {
                    const errorText = await response.text();

                    if (response.status === 500) {
                        errorMessage = 'OCR service is temporarily unavailable. Please try again in a few minutes.';
                    } else if (response.status === 404) {
                        errorMessage = 'OCR endpoint not found. Please check if the backend is running.';
                    } else {
                        errorMessage = `OCR error (${response.status}): ${errorText.substring(0, 100)}`;
                    }
                } catch (textError) {

                    errorMessage = `OCR error (${response.status}): Unable to read error details`;
                }
            }
            
            throw new Error(errorMessage);
        }

        const data = await response.json();

        return data;
    } catch (error) {

        throw error;
    }
};

// File processing function - uses file-to-text endpoint for all files
export const processFileToText = async (file) => {
    try {

        // Use file-to-text endpoint for all file types
        const endpoint = '/file-to-text';
        const formData = new FormData();
        formData.append('file', file);
        

        const response = await fetch(`${getBackendUrl()}${endpoint}`, {
            method: 'POST',
            body: formData,
        });


        if (!response.ok) {
            let errorMessage = 'File processing failed';
            
            // Check content type to determine how to read the response
            const contentType = response.headers.get('content-type');
            
            if (contentType && contentType.includes('application/json')) {
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } catch (parseError) {

                    errorMessage = `File processing error (${response.status}): Invalid response format`;
                }
            } else {
                // Handle HTML/text error responses
                try {
                    const errorText = await response.text();

                    if (response.status === 500) {
                        errorMessage = 'File processing service is temporarily unavailable. Please try again in a few minutes.';
                    } else if (response.status === 404) {
                        errorMessage = 'File processing endpoint not found. Please check if the backend is running.';
                    } else {
                        errorMessage = `File processing error (${response.status}): ${errorText.substring(0, 100)}`;
                    }
                } catch (textError) {

                    errorMessage = `File processing error (${response.status}): Unable to read error details`;
                }
            }
            
            throw new Error(errorMessage);
        }

        const data = await response.json();

        return data;
    } catch (error) {

        throw error;
    }
};

// Custom hook for API calls
export const useAskApi = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const askQuestion = useCallback(async (question, userId = null, apiDoc = null, selectedApi = null) => {
        setLoading(true);
        setError(null);

        try {
            // Get environment variables
            const defaultBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://api.anthropic.com';
            const defaultApiName = import.meta.env.VITE_API_NAME || 'anthropic';
            
            // Prepare dynamic API configuration based on selected API
            // This describes the TARGET API (what user wants to integrate with)
            // TalkAPI uses its own Anthropic key to generate the code examples
            const apiKey = selectedApi?.demoKey || selectedApi?.apiKey || '';
            
            const apiConfig = {
                apiName: selectedApi?.apiName?.toLowerCase() || 'generic-api',
                baseUrl: selectedApi?.baseUrl,  // Use the base URL from selected API (don't provide fallback)
                hasApiKey: Boolean(apiKey),
                apiKey: apiKey,
                docsUrl: selectedApi?.docsUrl || '',
                // Include additional API details if available
                endpoints: selectedApi?.endpoints || [],
                methods: selectedApi?.methods || ['GET', 'POST'],
                headers: selectedApi?.headers || {},
                authType: selectedApi?.authType || (apiKey ? 'x-api-key' : 'none'),
                parameters: selectedApi?.parameters || {},
                version: selectedApi?.version || 'latest',
                // Add support for username/password authentication
                username: selectedApi?.username || '',
                password: selectedApi?.password || ''
            };

            // Production backend expects field "question" and complete API config
            const requestBody = { 
                question: question,
                provider_hint: apiConfig
            };


            const response = await fetch(`${getBackendUrl()}/ask`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Send user ID in header if available, otherwise send empty string for anonymous
                    'X-User-Id': userId || '',
                    'Origin': 'https://talkapi.ai'
                },
                credentials: 'include',
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            // Validate response format
            if (!data.answer) {

                throw new Error('Invalid response format: missing answer field');
            }

            // Extract code snippets using regex
            const codeBlocks = data.answer.match(/```(\w+)[\s\S]*?```/g) || [];
            
            // If no code blocks found, try to extract from text
            if (codeBlocks.length === 0) {

                // Create a basic response structure
                data.snippets = {
                    javascript: "// Example code will be generated once API configuration is complete",
                    python: "# Example code will be generated once API configuration is complete",
                    curl: "# Example code will be generated once API configuration is complete"
                };
            } else {
                // Parse code blocks into snippets
                data.snippets = {};
                codeBlocks.forEach(block => {
                    const lang = block.match(/```(\w+)/)[1].toLowerCase();
                    const code = block.replace(/```\w+\n/, '').replace(/```$/, '').trim();
                    if (lang === 'bash') {
                        data.snippets.curl = code;
                    } else {
                        data.snippets[lang] = code;
                    }
                });
            }

            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        askQuestion,
        loading,
        error,
    };
};

/**
 * Submit feedback and get bonus API calls
 * @param {Object} feedbackData - The feedback data
 * @param {number} feedbackData.rating - Rating from 1-5
 * @param {string} feedbackData.feedback - Optional feedback text
 * @param {string} feedbackData.email - User's email
 * @param {string} feedbackData.userId - User's ID
 * @returns {Promise<Object>} - The response from the backend
 */
export const submitFeedback = async (feedbackData) => {
    try {
        const response = await fetch(`${getBackendUrl()}/feedback`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(feedbackData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {

        throw error;
    }
};

/**
 * Send contact form email via SMTP
 * @param {Object} formData - Contact form data
 * @param {string} formData.name - Sender name
 * @param {string} formData.email - Sender email
 * @param {string} formData.subject - Email subject
 * @param {string} formData.message - Email message
 * @returns {Promise<Object>} Response data with success status
 */
export const sendContactEmail = async (formData) => {
    try {
        const response = await fetch(`${getBackendUrl()}/send-contact-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to send email');
        }

        const data = await response.json();
        return {
            success: true,
            data: data,
        };
    } catch (error) {

        return {
            success: false,
            error: error.message || 'Failed to send email',
            shouldFallback: true,
        };
    }
};
