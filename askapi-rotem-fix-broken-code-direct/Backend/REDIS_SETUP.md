# Redis Rate Limiting Setup

This Flask app uses Upstash Redis for rate limiting via REST API.

## Environment Variables Required

Add these to your `.env` file:

```bash
# Upstash Redis Configuration
UPSTASH_REDIS_REST_URL=https://your-database-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_rest_token_here
```

## Getting Upstash Redis Credentials

1. Go to [Upstash Console](https://console.upstash.com/)
2. Create a new Redis database
3. Copy the REST URL and REST Token from the database details
4. Add them to your `.env` file

## Rate Limiting Configuration

- **Default Limit**: 20 requests per minute per IP
- **Ask Endpoint**: 20 requests per minute per IP
- **Feedback Endpoint**: 3 requests per day per IP
- **API Key Endpoint**: 10 requests per day per IP

## Testing Redis Connection

Use the test endpoint to verify Redis is working:

```bash
curl https://your-backend-url/test-redis
```

Expected response:
```json
{
  "message": "Redis connection test",
  "redis_configured": true,
  "set_result": true,
  "get_result": "test_value",
  "incr_result": 1,
  "timestamp": "2024-01-01T12:00:00"
}
```

## Fallback Behavior

If Redis credentials are not provided, the app will:
- Use in-memory storage for rate limiting
- Log a warning message
- Continue to function normally

## Security Notes

- Never commit your `.env` file to version control
- Keep your Redis token secure
- The REST API uses Bearer token authentication
- All Redis operations are logged for debugging 