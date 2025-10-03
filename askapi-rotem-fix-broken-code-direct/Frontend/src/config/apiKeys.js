// Secure API Key Management
// API keys are stored securely on the backend and retrieved when needed

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL && import.meta.env.VITE_BACKEND_URL.trim()) || 'http://localhost:5000';

// Helper function to get API key securely from backend
export const getApiKey = async (service) => {
    try {
        const response = await fetch(`${BACKEND_URL}/get-api-key`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ service })
        });

        if (!response.ok) {
            // Do not log key retrieval errors to avoid exposing sensitive info
            await response.json().catch(() => ({}));
            return null;
        }

        const data = await response.json();
        return data.api_key;
    } catch (error) {
        // Silently handle API key retrieval errors without logging sensitive info
        return null;
    }
};

// Helper function to check if API key is available
export const isApiKeyConfigured = async (service) => {
    const key = await getApiKey(service);
    return key !== null;
}; 