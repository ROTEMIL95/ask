# TalkAPI Project Documentation

## Project Overview

TalkAPI is a full-stack web application that transforms natural language queries into executable API calls. Users can paste API documentation (OpenAPI/Swagger, Postman collections, or plain text), ask questions in natural language, and receive generated code in JavaScript, Python, and cURL formats. The application uses Claude AI (Anthropic) for intelligent code generation and supports direct API execution through a proxy system.

## Architecture

### Tech Stack

#### Frontend
- **Framework**: React 18 with Vite
- **UI Components**: Shadcn/ui (Tailwind CSS based)
- **Styling**: Tailwind CSS
- **State Management**: React Context API (AuthContext, UserProvider)
- **Routing**: React Router v6
- **Authentication**: Supabase Auth
- **Deployment**: Netlify

#### Backend
- **Framework**: Flask (Python)
- **AI Model**: Anthropic Claude 3.5 Sonnet (claude-3-5-sonnet-20241022)
- **Authentication**: Supabase
- **Rate Limiting**: Flask-Limiter with Redis (Upstash)
- **Payment Processing**: Tranzila Gateway
- **File Processing**: PyPDF2, python-docx, pandas, Pillow
- **OCR**: Google Cloud Vision API
- **Deployment**: Render

#### Database & Services
- **Database**: Supabase (PostgreSQL)
- **Redis**: Upstash (for rate limiting)
- **File Storage**: Local processing (temporary)
- **External APIs**: OpenWeatherMap, OpenAI (optional fallback)

## Project Structure

```
askapi-main/
├── Frontend/                 # React application
│   ├── src/
│   │   ├── pages/           # Page components
│   │   │   ├── Home.jsx     # Main application page with TalkAPI tool
│   │   │   ├── Pricing.jsx  # Subscription plans
│   │   │   ├── Login.jsx    # Authentication
│   │   │   └── ...
│   │   ├── components/      # Reusable components
│   │   │   ├── UsageTracker.jsx
│   │   │   ├── FeedbackPopup.jsx
│   │   │   ├── PublicApiSelector.jsx
│   │   │   └── ui/          # Shadcn UI components
│   │   ├── api/             # API integration
│   │   │   ├── askApi.jsx   # Claude API integration
│   │   │   └── proxyApi.jsx # CORS proxy for external APIs
│   │   ├── lib/
│   │   │   └── supabase.js  # Supabase client configuration
│   │   └── hooks/           # Custom React hooks
│   ├── public/
│   └── dist/                # Build output
│
├── Backend/                  # Flask application
│   ├── app.py               # Main Flask application
│   ├── routes/              # API route blueprints
│   │   ├── api_routes.py    # Core API (/ask, /get-api-key)
│   │   ├── auth_routes.py   # Authentication endpoints
│   │   ├── file_routes.py   # File processing
│   │   ├── ocr_routes.py    # OCR processing
│   │   ├── proxy_routes.py  # CORS proxy
│   │   └── payment_routes.py # Payment processing
│   ├── limiter_config.py    # Rate limiting configuration
│   ├── supabase_client.py   # Supabase integration
│   └── .env                 # Environment variables
│
└── Documentation/
    ├── README.md
    ├── DEPLOYMENT.md
    └── DEVELOPMENT.md
```

## Core Features

### 1. AI-Powered Code Generation
- **Input**: API documentation (OpenAPI, Swagger, plain text)
- **Processing**: Claude 3.5 Sonnet analyzes documentation and user queries
- **Output**: Executable code in JavaScript (fetch), Python (requests), and cURL
- **Smart Features**:
  - Automatic API key placeholder handling
  - Proper header and body formatting
  - Template literal evaluation for dynamic parameters

### 2. File Processing
- **Supported Formats**:
  - Documents: PDF, Word (.docx), Excel (.xlsx), PowerPoint (.pptx)
  - Text files: .txt, .md, .json, .xml, .csv, .rtf
  - Images: PNG, JPG, GIF, BMP, WEBP (with OCR)
- **Processing Pipeline**:
  1. File upload to backend
  2. Text extraction based on file type
  3. GPT-powered summarization for API documentation
  4. Automatic population of API documentation field

### 3. API Execution
- **Direct Execution**: Run generated API calls directly from the browser
- **CORS Proxy**: Backend proxy handles CORS issues for external APIs
- **Supported APIs**:
  - OpenWeatherMap (with auto API key)
  - OpenAI/Anthropic
  - Any REST API with proper CORS headers
- **Security**: API keys managed server-side, never exposed to client

### 4. User Management
- **Authentication**: Email/password with Supabase Auth
- **User Profiles**: Stored in Supabase with usage tracking
- **Usage Limits**:
  - Free tier: 10 API calls/day
  - Pro tier: 100 API calls/day
  - Feedback bonus: +5 calls per feedback submission
- **History Tracking**: Save and favorite API call history (Pro feature)

### 5. Payment Integration
- **Provider**: Tranzila payment gateway (Israeli payment processor)
- **Currency**: Israeli Shekels (ILS)
- **Plans**:
  - Free: 50 API requests total, basic features
  - Pro (₪19/month ≈ $5.70): 500 code generations, 2000 API runs, saved history, priority support
- **Payment Flow**:
  1. **Initial Payment**: ₪1 validation charge, returns card token
  2. **Recurring Setup**: Creates Standing Transaction Order (STO) with monthly ₪19 charges
  3. **User Upgrade**: Supabase profile updated to Pro plan with STO ID stored
- **Technical Implementation**:
  - Service Key authentication for Supabase operations
  - Row Level Security (RLS) bypass for admin operations
  - Card tokenization for secure recurring payments
  - Automatic subscription management via STO system

## API Endpoints

### Core API Routes (`/api`)
- `GET /` - API information and available endpoints
- `POST /ask` - Generate code from natural language (Claude AI)
- `GET /health` - Health check
- `POST /get-api-key` - Retrieve API keys for external services
- `POST /feedback` - Submit feedback and get bonus API calls

### Authentication Routes (`/auth`)
- `POST /auth/signin` - User login
- `POST /auth/signup` - User registration
- `POST /auth/signout` - User logout
- `GET /auth/user` - Get current user
- `GET /auth/session` - Session validation

### File Processing Routes
- `POST /file-to-text` - Extract text from documents
- `POST /ocr` - OCR processing for images

### Proxy Routes
- `POST /proxy-api` - CORS proxy for external API calls
- `GET /proxy-docs` - Fetch external documentation

### Payment Routes
- `POST /payment/pay` - Initialize payment and setup recurring billing
- `POST /payment/cancel` - Cancel recurring subscription 
- `GET /payment/callback` - Payment completion callback
- `POST /payment/webhook` - Tranzila webhook handler

## Environment Configuration

### Frontend (.env)
```bash
VITE_BACKEND_URL=https://askapi-0vze.onrender.com  # Production backend
VITE_SUPABASE_URL=https://sszjvdosdhjhnsaahqyr.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Backend (.env)
```bash
# AI Configuration
ANTHROPIC_API_KEY=sk-ant-api03-...
LLM_MODEL=claude-3-5-sonnet-20241022
OPENAI_API_KEY=sk-proj-...  # Fallback option

# Database
SUPABASE_URL=https://sszjvdosdhjhnsaahqyr.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...

# Redis (Rate Limiting)
UPSTASH_REDIS_REST_URL=https://enjoyed-walrus-24481.upstash.io
UPSTASH_REDIS_REST_TOKEN=AV-hAAIjc...

# External APIs
OPENWEATHERMAP_API_KEY=d1f4a5d4c0c7259ecc3371c5c2946d36
GOOGLE_APPLICATION_CREDENTIALS=/path/to/gcloud-key.json

# Payment (Tranzila Gateway)
TRANZILA_SUPPLIER=fxpsharon333tok
TRANZILA_PUBLIC_API_KEY=x04iHYkER0sgqwKq85WbrDemNNBc97gLwXqNMrXNBbodx15KsaohpiV4hoQu6Bz33aU2AZuMMKc
TRANZILA_SECRET_API_KEY=[secure_key]
```

## Development Workflow

### Local Development Setup

1. **Backend Setup**:
```bash
cd Backend
python -m venv venv
source venv/Scripts/activate  # Windows
pip install -r requirements.txt
python app.py
```

2. **Frontend Setup**:
```bash
cd Frontend
npm install
npm run dev
```

3. **Environment Variables**:
   - Copy `.env.example` to `.env` in both Frontend and Backend
   - Add required API keys and configuration

### Common Development Tasks

#### Running Tests
```bash
# Backend tests
cd Backend
python test_api.py
python test_supabase.py

# Frontend tests
cd Frontend
npm test
```

#### Database Migrations
- Supabase migrations are handled through the Supabase dashboard
- Schema changes should be documented in `Backend/SUPABASE_SETUP.md`

#### Adding New API Endpoints
1. Create route in `Backend/routes/`
2. Register blueprint in `Backend/app.py`
3. Update CORS configuration if needed
4. Document in API Endpoints section

## Deployment

### Frontend (Netlify)
- **Build Command**: `npm run build`
- **Publish Directory**: `dist`
- **Environment Variables**: Set in Netlify dashboard
- **Redirects**: Configured in `public/_redirects` for SPA routing

### Backend (Render)
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `python app.py`
- **Environment Variables**: Set in Render dashboard
- **Health Check**: `/health` endpoint

## Payment Integration Details

### Working Payment Flow (FIXED)
The payment integration is now fully functional with the following technical implementation:

#### 1. Initial Payment Processing
```python
# Card validation with ₪1 charge
payload = {
    "terminal_name": "fxpsharon333tok",
    "txn_currency_code": "ILS", 
    "txn_type": "debit",
    "card_number": "[card_number]",
    "expire_month": int(expire_month),
    "expire_year": int(expire_year),
    "payment_plan": 1,
    "items": [{"code": "1", "name": "TalkAPI Subscription", "unit_price": 1}]
}
```

#### 2. Recurring Payment Setup (STO)
```python
# Standing Transaction Order creation
payload = {
    "terminal_name": "fxpsharon333tok",
    "sto_payments_number": 9999,
    "first_charge_date": "2025-09-25",
    "charge_frequency": "monthly", 
    "charge_dom": 27,
    "client": {"internal_id": 584567, "name": "User Name", "email": "user@email.com"},
    "items": [{"name": "Monthly TalkAPI Subscription", "unit_price": 19, "price_currency": "ILS"}],
    "card": {"token": "e9cd14f1c2a91b96525", "expire_month": 2, "expire_year": 2030}
}
```

#### 3. Supabase Profile Management
```python
# User upgrade with SERVICE_KEY authentication
def update_subscription_after_payment(user_id, sto_id, plan_type='pro'):
    client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)  # Bypass RLS
    
    profile_data = {
        "plan_type": "pro",
        "sto_id": "350569", 
        "subscription_status": "active",
        "daily_limit": 100,
        "payment_method": "credit_card"
    }
    
    response = client.schema('api').table('user_profiles').update(profile_data).eq('email', user_email).execute()
```

#### 4. Database Permissions (Required)
```sql
-- Grant service_role access to user_profiles table
GRANT ALL ON api.user_profiles TO service_role;
```

## Known Issues & Solutions

### 1. CORS Issues
- **Problem**: External API calls blocked by CORS
- **Solution**: Use `/proxy-api` endpoint for external calls

### 2. Match Function Error
- **Problem**: `TypeError: Cannot read properties of undefined (reading 'match')`
- **Solution**: Added defensive checks in `extractCodeSnippet` function

### 3. Supabase RLS Permission Issues (FIXED)
- **Problem**: `permission denied for table user_profiles` with SERVICE_KEY
- **Solution**: Grant proper permissions to service_role in Supabase dashboard

### 4. Rate Limiting
- **Problem**: Redis connection issues
- **Solution**: Fallback to in-memory limiting if Redis unavailable

## Security Considerations

1. **API Keys**: Never exposed to client, managed server-side
2. **Authentication**: JWT-based with Supabase Auth
3. **Rate Limiting**: Per-user limits to prevent abuse
4. **Input Validation**: All user inputs sanitized
5. **CORS**: Strict origin allowlist
6. **File Upload**: Size limits and type validation

## Performance Optimizations

1. **Frontend**:
   - Code splitting with React.lazy
   - Image optimization with WebP format
   - Vite build optimizations

2. **Backend**:
   - Blueprint-based route organization
   - Redis caching for rate limiting
   - Async processing where applicable

## Monitoring & Logging

- **Frontend**: Browser console for debugging
- **Backend**: Flask logger with debug output
- **Error Tracking**: Detailed error messages in development
- **Usage Metrics**: Tracked in Supabase database

## Future Enhancements

1. **Features**:
   - GraphQL support
   - WebSocket API support
   - Team collaboration features
   - API documentation import from URL
   - More AI models (GPT-4, Gemini)

2. **Technical**:
   - Kubernetes deployment
   - Microservices architecture
   - Real-time collaboration
   - Advanced caching strategies
   - WebAssembly for client-side processing

## Support & Resources

- **Documentation**: `/docs` in the application
- **GitHub Issues**: Report bugs and feature requests
- **Email Support**: support@talkapi.ai (Pro users)
- **Community**: Discord server (coming soon)

## License

Proprietary - All rights reserved

---

*Last Updated: August 2025*
*Version: 1.0.0*