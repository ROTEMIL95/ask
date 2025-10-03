# API Keys Configuration

## 🔐 Secure API Key Management

This directory contains secure configuration for API keys used in the application.

## Setup Instructions

### 1. Configure Your API Keys

**IMPORTANT**: API keys are now stored securely on the backend in the `.env` file, not in the frontend code.

Create a `.env` file in the Backend directory with your API keys:

```env
OPENAI_API_KEY=sk-your-actual-openai-api-key-here
OPENAI_PROJECT_ID=your-project-id-here
FLASK_ENV=production
FLASK_DEBUG=False
```

**Example:**
```env
OPENAI_API_KEY=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
OPENAI_PROJECT_ID=your-project-id-here
```

### 2. Security Features

- ✅ **Backend storage**: API keys are stored securely on the backend server
- ✅ **No frontend exposure**: Keys are never stored in frontend code
- ✅ **Secure retrieval**: Keys are retrieved via secure backend endpoint
- ✅ **Session storage**: Keys are cached securely in browser session
- ✅ **Automatic replacement**: Placeholders are automatically replaced with real keys
- ✅ **Validation**: Checks ensure keys are properly configured

### 3. How It Works

1. **User selects OpenAI API** from the public API selector
2. **Frontend requests API key** from secure backend endpoint
3. **Backend provides key** from environment variables
4. **Real API key is stored** securely in session storage
5. **Generated code contains placeholder** (`YOUR_API_KEY`)
6. **When executing the request**, the placeholder is automatically replaced with the real key
7. **Users never see the actual key** - it's handled behind the scenes

### 4. Supported APIs

Currently configured:
- **OpenAI API**: For AI language model requests

To add more APIs:
1. Add the key to `API_KEYS` in `apiKeys.js`
2. Update the `handleSelectPublicApi` function in `Home.jsx`
3. Add the API to `PublicApiSelector.jsx`

### 5. Production Deployment

For production, consider using environment variables instead:

```javascript
// In production, use environment variables
export const API_KEYS = {
    OPENAI_API_KEY: import.meta.env.VITE_OPENAI_API_KEY || 'sk-your-actual-openai-api-key-here',
};
```

### 6. Testing

To test the API key functionality:

1. Configure your real API key in the Backend `.env` file
2. Select "OpenAI" from the public API selector
3. Ask a question like "Create a chat completion"
4. Click "Run this API Request"
5. The request should execute with your real API key

### 7. Troubleshooting

**Error: "OpenAI API key not configured"**
- Check that you've added the API key to the Backend `.env` file
- Ensure the key starts with `sk-` and is valid
- Verify the backend is running and accessible

**Error: "Please replace YOUR_API_KEY"**
- This happens for non-OpenAI APIs
- Users need to provide their own API keys for other services

**Error: "Failed to get API key"**
- Check that the backend is running
- Verify the `/get-api-key` endpoint is accessible
- Check backend logs for any errors

## ⚠️ Important Security Notes

1. **Never commit real API keys** to version control
2. **Use environment variables** in production
3. **Rotate keys regularly** for security
4. **Monitor usage** to prevent abuse
5. **Add rate limiting** for production use

## 🔧 Development

For development, you can use the `apiKeys.js` file directly. For production, use environment variables and update the configuration accordingly. 