# Security Configuration

## API Security Measures

### 1. Rate Limiting
- **Global limits**: 200 requests per day, 50 per hour
- **Ask endpoint**: 10 requests per minute
- **Purpose**: Prevents abuse and DoS attacks

### 2. CORS Configuration
- **Specific origins**: Only allows requests from configured domains
- **Methods**: Only GET and POST allowed
- **Headers**: Only Content-Type header allowed
- **Purpose**: Prevents unauthorized cross-origin requests

### 3. Input Validation
- **Request size**: Maximum 1MB per request
- **Question length**: Maximum 5000 characters
- **Empty validation**: Prevents empty questions
- **Purpose**: Prevents resource exhaustion and invalid data

### 4. Environment Variables
- **API keys**: Stored in environment variables, not in code
- **Sensitive data**: Never committed to version control
- **Purpose**: Keeps secrets secure

### 5. Error Handling
- **Graceful failures**: Proper error responses without exposing internals
- **Rate limit errors**: Clear feedback when limits exceeded
- **Purpose**: Prevents information leakage

## Deployment Security

### Environment Variables Required
```bash
OPENAI_API_KEY=your_openai_api_key
OPENAI_PROJECT_ID=your_project_id
```

### CORS Origins to Update
In `app.py`, update the CORS origins to include your actual frontend domain:
```python
CORS(app, origins=[
    "http://localhost:3000",  # Development
    "http://localhost:5173",  # Vite dev server
    "https://your-actual-frontend-domain.com", 
    "*",
    back # Production
], methods=["GET", "POST"], allow_headers=["Content-Type"])
```

## Best Practices

1. **Never expose API keys in frontend code**
2. **Use HTTPS in production**
3. **Monitor API usage and logs**
4. **Regularly update dependencies**
5. **Consider adding authentication for sensitive endpoints**

## Monitoring

- Check `/health` endpoint for backend status
- Check `/check-openai` for OpenAI connection status
- Monitor rate limit headers in responses 