// Utility functions for testing and fixing API URLs

export const fixApiUrl = (url) => {
    if (!url) return url;
    
    // Fix common placeholder URLs
    if (url.includes('api.example.com') || url.includes('example.com')) {
        return url.replace(/https?:\/\/[^\/]+\/chat\/completions/g, 'https://api.openai.com/v1/chat/completions')
                  .replace(/https?:\/\/[^\/]+\/completions/g, 'https://api.openai.com/v1/chat/completions');
    }
    
    return url;
};

export const validateApiUrl = (url) => {
    if (!url) return { valid: false, error: 'No URL provided' };
    
    // Check for placeholder URLs
    if (url.includes('api.example.com') || url.includes('example.com')) {
        return { 
            valid: false, 
            error: 'Placeholder URL detected. Please regenerate the API call.',
            fixed: fixApiUrl(url)
        };
    }
    
    // Check if it's a valid HTTP/HTTPS URL
    try {
        new URL(url);
        return { valid: true };
    } catch (error) {
        return { valid: false, error: 'Invalid URL format' };
    }
};

export const testApiUrl = async (url) => {
    try {
        const response = await fetch(url, { method: 'OPTIONS' });
        return { 
            accessible: true, 
            status: response.status,
            cors: response.headers.get('access-control-allow-origin') !== null
        };
    } catch (error) {
        return { 
            accessible: false, 
            error: error.message 
        };
    }
}; 