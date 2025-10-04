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


// Note: API keys should never be fetched to the frontend for security reasons
// The backend handles API keys internally when processing requests

// OCR function to process uploaded images (kept for separate OCR functionality)
export const processImageOCR = async (imageFile) => {
    try {
        console.log('🔍 OCR Debug: Starting image OCR processing');
        console.log('🔍 OCR Debug: File name:', imageFile.name);
        console.log('🔍 OCR Debug: File size:', imageFile.size, 'bytes');
        
        const formData = new FormData();
        formData.append('image', imageFile);
        
        console.log('🔍 OCR Debug: Backend URL:', getBackendUrl());

        const response = await fetch(`${getBackendUrl()}/ocr`, {
            method: 'POST',
            body: formData,
        });

        console.log('🔍 OCR Debug: Response status:', response.status);

        if (!response.ok) {
            let errorMessage = 'OCR processing failed';
            
            // Check content type to determine how to read the response
            const contentType = response.headers.get('content-type');
            
            if (contentType && contentType.includes('application/json')) {
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } catch (parseError) {
                    console.error('❌ OCR Debug: Failed to parse JSON error response:', parseError);
                    errorMessage = `OCR error (${response.status}): Invalid response format`;
                }
            } else {
                // Handle HTML/text error responses
                try {
                    const errorText = await response.text();
                    console.error('❌ OCR Debug: Error response:', errorText.substring(0, 200));
                    
                    if (response.status === 500) {
                        errorMessage = 'OCR service is temporarily unavailable. Please try again in a few minutes.';
                    } else if (response.status === 404) {
                        errorMessage = 'OCR endpoint not found. Please check if the backend is running.';
                    } else {
                        errorMessage = `OCR error (${response.status}): ${errorText.substring(0, 100)}`;
                    }
                } catch (textError) {
                    console.error('❌ OCR Debug: Failed to read error response:', textError);
                    errorMessage = `OCR error (${response.status}): Unable to read error details`;
                }
            }
            
            throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log('✅ OCR Debug: OCR successful');
        console.log('🔍 OCR Debug: Extracted text length:', data.text ? data.text.length : 0);
        
        return data;
    } catch (error) {
        console.error('❌ OCR Debug: Error processing OCR:', error);
        throw error;
    }
};

// File processing function - uses file-to-text endpoint for all files
export const processFileToText = async (file) => {
    try {
        console.log('🔍 File Debug: Starting file processing');
        console.log('🔍 File Debug: File name:', file.name);
        console.log('🔍 File Debug: File size:', file.size, 'bytes');
        
        // Use file-to-text endpoint for all file types
        const endpoint = '/file-to-text';
        const formData = new FormData();
        formData.append('file', file);
        
        console.log('🔍 File Debug: Using endpoint:', endpoint);
        
        const response = await fetch(`${getBackendUrl()}${endpoint}`, {
            method: 'POST',
            body: formData,
        });

        console.log('🔍 File Debug: Response status:', response.status);

        if (!response.ok) {
            let errorMessage = 'File processing failed';
            
            // Check content type to determine how to read the response
            const contentType = response.headers.get('content-type');
            
            if (contentType && contentType.includes('application/json')) {
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } catch (parseError) {
                    console.error('❌ File Debug: Failed to parse JSON error response:', parseError);
                    errorMessage = `File processing error (${response.status}): Invalid response format`;
                }
            } else {
                // Handle HTML/text error responses
                try {
                    const errorText = await response.text();
                    console.error('❌ File Debug: Error response:', errorText.substring(0, 200));
                    
                    if (response.status === 500) {
                        errorMessage = 'File processing service is temporarily unavailable. Please try again in a few minutes.';
                    } else if (response.status === 404) {
                        errorMessage = 'File processing endpoint not found. Please check if the backend is running.';
                    } else {
                        errorMessage = `File processing error (${response.status}): ${errorText.substring(0, 100)}`;
                    }
                } catch (textError) {
                    console.error('❌ File Debug: Failed to read error response:', textError);
                    errorMessage = `File processing error (${response.status}): Unable to read error details`;
                }
            }
            
            throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log('✅ File Debug: File processing successful');
        console.log('🔍 File Debug: Extracted text length:', data.text ? data.text.length : 0);
        
        return data;
    } catch (error) {
        console.error('❌ File Debug: Error processing file:', error);
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
            const apiConfig = {
                apiName: selectedApi?.apiName?.toLowerCase() || defaultApiName,
                baseUrl: selectedApi?.baseUrl || defaultBaseUrl,
                hasApiKey: Boolean(selectedApi?.demoKey || selectedApi?.apiKey),
                docsUrl: selectedApi?.docsUrl || '',
                // Include additional API details if available
                endpoints: selectedApi?.endpoints || [],
                methods: selectedApi?.methods || ['GET', 'POST'],
                headers: selectedApi?.headers || {},
                authType: selectedApi?.authType || 'none',
                parameters: selectedApi?.parameters || {},
                version: selectedApi?.version || 'latest'
            };

            // Production backend expects field "question" and complete API config
            const requestBody = { 
                question: question,
                provider_hint: apiConfig
            };

            // Debug logging to see what's being sent (without sensitive data)
            console.log('🔍 Debug: selectedApi:', selectedApi ? {
                apiName: selectedApi.apiName,
                docsUrl: selectedApi.docsUrl,
                baseUrl: selectedApi.baseUrl,
                hasApiKey: !!selectedApi.demoKey
            } : null);
            console.log('🔍 Debug: provider_hint:', requestBody.provider_hint);

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
                console.warn('Response missing answer field:', data);
                throw new Error('Invalid response format: missing answer field');
            }

            // Extract code snippets using regex
            const codeBlocks = data.answer.match(/```(\w+)[\s\S]*?```/g) || [];
            
            // If no code blocks found, try to extract from text
            if (codeBlocks.length === 0) {
                console.warn('No code blocks found in response, attempting to extract from text');
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
        console.error('Error submitting feedback:', error);
        throw error;
    }
};