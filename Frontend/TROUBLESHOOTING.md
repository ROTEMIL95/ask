# API Execution Troubleshooting Guide

## 🔍 Debugging Steps

### 1. Check Generated Code
- Click the "🔍 Debug Info" button to see what URL and headers are being generated
- Check the browser console for detailed logs

### 2. Common Issues and Solutions

#### Issue: "Network error - unable to reach the API endpoint"

**Possible Causes:**
1. **Invalid URL**: The generated code contains an invalid URL
2. **CORS Issue**: The API server doesn't allow requests from your domain
3. **API Server Down**: The target API server is not responding
4. **Network Connectivity**: Your internet connection is down

**Solutions:**
1. **Check the URL**: Look at the debug info to see what URL is being called
2. **Test the URL**: Try opening the URL directly in your browser
3. **Check CORS**: If it's an external API, they need to allow your domain
4. **Use a different API**: Try selecting a different API from the public API selector

#### Issue: "OpenAI API key not configured"

**Solution:**
1. Make sure you've created the `.env` file in the Backend directory
2. Ensure your OpenAI API key is correctly set in the `.env` file
3. Restart your backend server after adding the `.env` file

#### Issue: "CORS policy blocked the request"

**Solution:**
1. This happens when external APIs don't allow requests from your domain
2. Try using a different API or contact the API provider
3. For testing, you can use browser extensions to disable CORS (development only)

### 3. Testing Steps

1. **Select OpenAI API** from the public API selector
2. **Ask a simple question** like "Create a chat completion"
3. **Click "🔍 Debug Info"** to see what's being generated
4. **Check the console logs** for detailed information
5. **Try the "Run this API Request"** button

### 4. Console Logs to Check

Look for these logs in your browser console:
- `🔍 Parsed code:` - Shows the extracted URL and headers
- `🚀 executeApiCall - URL:` - Shows the target URL
- `📡 Making fetch request to:` - Shows the actual request being made
- `🔑 Automatically replaced OpenAI API key` - Confirms API key replacement

### 5. Manual Testing

You can test the API manually:

1. **Open browser console** (F12)
2. **Copy the generated JavaScript code**
3. **Paste it in the console** and run it
4. **Check for errors** in the console

### 6. Backend Status

Check if your backend is running:
- Backend status should show "Connected" (green)
- OpenAI status should show "Connected" (green)
- If not, click "🔄 Refresh Status"

### 7. Common URLs to Test

**OpenAI API:**
```
https://api.openai.com/v1/chat/completions
```

**Test with curl:**
```bash
curl -X POST https://api.openai.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{"model":"gpt-5","messages":[{"role":"user","content":"Hello"}]}'
```

### 8. Environment Setup

Make sure your `.env` file in the Backend directory contains:
```env
OPENAI_API_KEY=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
OPENAI_PROJECT_ID=your-project-id-here
FLASK_ENV=production
FLASK_DEBUG=False
```

### 9. Still Having Issues?

1. **Check browser console** for detailed error messages
2. **Try a different browser** to rule out browser-specific issues
3. **Check your internet connection**
4. **Verify the API key is valid** by testing it directly
5. **Contact support** with the specific error message and console logs 