/**
 * Contact API - Handle contact form submissions
 */

// Get the backend URL from environment or use default
const getBackendUrl = () => {
    const configured = import.meta.env.VITE_BACKEND_URL;
    if (configured && configured.trim()) return configured.trim();

    // Development fallback
    if (import.meta.env.DEV) return 'http://localhost:5000';

    // Production fallback
    return 'https://askapi-0vze.onrender.com';
};

/**
 * Send contact form email
 * @param {Object} formData - Contact form data
 * @param {string} formData.name - Sender's name
 * @param {string} formData.email - Sender's email
 * @param {string} formData.subject - Email subject
 * @param {string} formData.message - Email message
 * @returns {Promise<Object>} Response with success status and message
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

        const result = await response.json();

        if (!response.ok) {
            // Check if we should fallback to mailto
            if (result.fallback) {
                throw new Error('FALLBACK_REQUIRED');
            }
            throw new Error(result.error || 'Failed to send message');
        }

        return result;
    } catch (error) {
        console.error('Error sending contact email:', error);
        throw error;
    }
};
