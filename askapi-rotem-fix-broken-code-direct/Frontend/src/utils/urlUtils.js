/**
 * Extracts and formats base URL from API documentation or selected API info
 * @param {string} apiDoc - API documentation URL or content
 * @param {Object} selectedApiInfo - Selected API information
 * @returns {string} Formatted base URL
 */
export const getBaseUrl = (apiDoc, selectedApiInfo) => {
    if (apiDoc?.startsWith('http')) {
        const url = new URL(apiDoc);
        let baseUrl = url.origin + (url.pathname.endsWith('/') ? url.pathname.slice(0, -1) : url.pathname);
        // Ensure /v2 for Swagger Petstore
        if (baseUrl.includes('petstore.swagger.io') && !baseUrl.endsWith('/v2')) {
            baseUrl += '/v2';
        }
        return baseUrl;
    }
    return selectedApiInfo?.baseUrl || '';
};

/**
 * Formats a URL by ensuring it has the correct base URL
 * @param {string} url - The URL to format
 * @param {string} baseUrl - The base URL to use
 * @returns {string} Formatted URL
 */
export const formatUrl = (url, baseUrl) => {
    if (!url) return url;
    if (!baseUrl) return url;

    // If URL is already absolute, return it
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }

    // If URL is relative, add base URL
    if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
    }

    // If URL has no protocol or leading slash, add both
    return `${baseUrl}/${url}`;
};

/**
 * Generates example code with proper URL formatting
 * @param {string} baseUrl - The base URL to use in examples
 * @returns {string} Example code
 */
export const getExampleCode = (baseUrl) => `
Example of correct URL usage:
❌ Wrong: 
fetch('/pet/findByStatus?status=available')

✅ Right:
fetch("${baseUrl}/pet/findByStatus?status=available", {
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json"
  }
})
`;

/**
 * Enhances a question with API context and base URL information
 * @param {string} question - The original question
 * @param {string} apiDoc - API documentation
 * @param {string} baseUrl - The base URL to use
 * @returns {string} Enhanced question
 */
export const enhanceQuestion = (question, apiDoc, baseUrl) => {
    if (!apiDoc) return question;
    return `Using this API documentation:

${apiDoc}

Base URL: ${baseUrl}

${question}

Please provide working code examples that use the actual API endpoints and methods from the documentation. IMPORTANT: Use the complete base URL (${baseUrl}) for all endpoints.`;
};
