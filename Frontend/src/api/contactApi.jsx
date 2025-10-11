import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

/**
 * Send contact form email
 * @param {Object} formData - Contact form data
 * @param {string} formData.name - Sender name
 * @param {string} formData.email - Sender email
 * @param {string} formData.subject - Email subject
 * @param {string} formData.message - Email message
 * @returns {Promise<Object>} Response data
 */
export const sendContactEmail = async (formData) => {
    try {
        const response = await axios.post(
            `${API_BASE_URL}/send-contact-email`,
            formData,
            {
                headers: {
                    'Content-Type': 'application/json',
                },
                timeout: 10000, // 10 second timeout
            }
        );

        return {
            success: true,
            data: response.data,
        };
    } catch (error) {
        console.error('Error sending contact email:', error);

        // Return error details for fallback handling
        return {
            success: false,
            error: error.response?.data?.error || error.message || 'Failed to send email',
            shouldFallback: true,
        };
    }
};
