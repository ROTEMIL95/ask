# Talkapi Backend

A Flask-based backend service that provides an API endpoint to ask questions using OpenAI's GPT models.

## Features

- **POST /ask** - Ask questions to OpenAI GPT models
- **GET /health** - Health check endpoint
- **GET /** - API information endpoint
- CORS enabled for frontend integration
- Comprehensive error handling
- Environment variable configuration

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Environment Configuration

Create a `.env` file in the Backend directory with your OpenAI API key and project ID:

```env
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_PROJECT_ID=your_openai_project_id_here
FLASK_ENV=production
FLASK_DEBUG=False
```

### 3. Get OpenAI API Key and Project ID

1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key and paste it in your `.env` file
6. Get your Project ID from the OpenAI dashboard
7. Add the Project ID to your `.env` file

## Running the Server

### Development Mode
```bash
python app.py
```

### Production Mode
```bash
export FLASK_ENV=production
python app.py
```

The server will start on `http://0.0.0.0:5000`

## API Endpoints

### POST /ask
Ask a question to OpenAI GPT model.

**Request Body:**
```json
{
  "question": "What is the capital of France?"
}
```

**Response:**
```json
{
  "answer": "The capital of France is Paris.",
  "model": "gpt-5",
  "usage": {
    "prompt_tokens": 15,
    "completion_tokens": 8,
    "total_tokens": 23
  }
}
```

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "message": "Flask server is running"
}
```

### GET /
API information endpoint.

**Response:**
```json
{
  "message": "Talkapi Backend",
  "version": "1.0.0",
  "endpoints": {
    "POST /ask": "Ask a question to OpenAI",
    "GET /health": "Health check endpoint"
  }
}
```

## Error Handling

The API includes comprehensive error handling for:

- Missing or invalid request data
- OpenAI API authentication errors
- Rate limiting
- Invalid requests
- Server errors

All errors return appropriate HTTP status codes and descriptive error messages.

## Configuration

### Model Configuration
You can change the OpenAI model by modifying the `model` parameter in the `/ask` endpoint:

```python
response = openai.ChatCompletion.create(
    model="gpt-5",
    # ... other parameters
)
```

### Token Limits
Adjust the `max_completion_tokens` parameter to control response length:

```python
max_completion_tokens=1000,  # Increase or decrease as needed
```

### Temperature
Control response creativity with the `temperature` parameter:

```python
temperature=0.7,  # 0.0 = deterministic, 1.0 = very creative
```

## Security & CORS

### Dynamic CORS Handling
- The backend uses a dynamic CORS policy. Allowed origins are checked at runtime using a regex-based helper function (`is_origin_allowed`).
- CORS headers are only set if the request's `Origin` is allowed.
- You can customize the allowed origins logic in `is_origin_allowed(origin)` in `app.py`.

### API Key Security
- All sensitive endpoints (like `/proxy-api`) require an API key via the `X-API-Key` header or `api_key` query parameter.
- Allowed API keys are loaded from the `ALLOWED_API_KEYS` environment variable (comma-separated) or from a `security_config.yaml` file.
- Example: `export ALLOWED_API_KEYS="key1,key2,key3"`

### Rate Limiting
- Each API key is rate-limited (default: 100 requests per 60 seconds, configurable via `API_KEY_RATE_LIMIT` and `API_KEY_RATE_WINDOW` env vars).
- Example: `export API_KEY_RATE_LIMIT=100` and `export API_KEY_RATE_WINDOW=60`

### Proxy Domain Whitelisting
- The `/proxy-api` endpoint only allows proxying to domains listed in `ALLOWED_PROXY_DOMAINS` (env/config).
- Example: `export ALLOWED_PROXY_DOMAINS="openai.com,api.openai.com,example.com"`

### Configuration via YAML
- You can also create a `security_config.yaml` file in the backend directory with the following structure:

```yaml
api_keys:
  - key1
  - key2
origins:
  - https://myfrontend.com
  - https://docs.myapi.com
proxy_domains:
  - openai.com
  - api.openai.com
```

### SSRF/Open Proxy Protection
- The backend checks the target URL for `/proxy-api` requests and only allows proxying to whitelisted domains.
- Only `http` and `https` protocols are allowed.

### Example Usage

**Proxy API Request:**
```bash
curl -X POST https://your-backend.com/proxy-api \
  -H "X-API-Key: <your_api_key>" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://api.openai.com/v1/engines", "method": "GET"}'
```

**CORS:**
- Only requests from allowed origins will receive CORS headers and be accepted by browsers.

## Security Notes

- Never commit your `.env` file to version control
- Keep your OpenAI API key secure
- Consider implementing rate limiting for production use
- Use HTTPS in production environments

## Deployment

The server is configured to listen on `0.0.0.0:5000` for deployment compatibility. For production deployment, consider:

1. Using a WSGI server like Gunicorn
2. Setting up a reverse proxy (nginx)
3. Implementing proper logging
4. Adding monitoring and health checks 