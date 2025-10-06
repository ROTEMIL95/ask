# CORS Configuration for Development

## Overview
The backend now automatically allows localhost origins when in development mode, fixing CORS issues during local development.

## How It Works

### Automatic Detection
The backend automatically detects development mode when:
- `DEVELOPMENT_MODE=true` in environment variables
- `FLASK_ENV=development` 
- `NODE_ENV=development`
- Not running on Render (production)

### Allowed Origins in Development
When development mode is detected, these origins are automatically allowed:
- `http://localhost:3000` (React default)
- `http://localhost:5173` (Vite default)
- `http://localhost:5000` (Flask default)
- `http://localhost:8080` (Common dev port)
- `http://127.0.0.1:3000`
- `http://127.0.0.1:5173`
- `http://127.0.0.1:5000`
- `http://127.0.0.1:8080`

### Production Origins
- `https://talkapi.ai` (always allowed)
- Any origins specified in `ALLOWED_ORIGINS` environment variable

## Setup for Development

### Option 1: Environment Variable
```bash
export DEVELOPMENT_MODE=true
```

### Option 2: Copy Development Config
```bash
cd Backend
cp .env.development .env
```

### Option 3: Set Flask Environment
```bash
export FLASK_ENV=development
```

## Verification
When the backend starts in development mode, you'll see this log message:
```
INFO:app:Development mode detected - adding localhost origins
INFO:app:CORS configured for origins: ['https://talkapi.ai', 'http://localhost:5173', ...]
```

## Security
- Production deployments (Render) will NOT include localhost origins
- Only production domains are allowed in production
- Development mode is automatically disabled in production environments