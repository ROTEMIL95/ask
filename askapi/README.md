# 🧠 TalkAPI – Natural Language to API Generator

TalkAPI is a developer-first tool that helps you convert natural language into working API calls – instantly.  
It’s designed as a SaaS-ready platform with demo capabilities, user-specific API keys, and full OpenAI integration.

## 🚀 What is TalkAPI?

TalkAPI allows users to:
- Upload or connect to their API documentation (Swagger, Postman, raw JSON)
- Ask questions or make requests in plain English
- Get valid code snippets, sample requests, and actual responses
- Test with live execution, rate-limited via their own API keys

## 🔧 Features

- ✅ Built-in OpenAI integration (server-side)
- ✅ Supabase for auth, storage, and rate tracking
- ✅ Redis-based rate limiting
- ✅ Demo mode with capped usage
- ✅ Netlify-ready React frontend
- ✅ Python backend (FastAPI / Flask)
- ✅ Deployment setup with Render and Netlify

## 📁 Folder Structure

Frontend:
- /src
- /public
- index.html
- netlify.toml

Backend:
- app.py
- check_key.py
- check_user_usage.py
- limiter_config.py
- supabase_client.py
- supabase_init.py

Setup:
- .env
- ENVIRONMENT_SETUP.md
- SUPABASE_SETUP.md
- REDIS_SETUP.md
- render.yaml

## 🛠 How to Run Locally

1. Clone the repo  
git clone https://github.com/ROTEMIL95/askapi.git

2. Backend (Python):  
cd Backend  
pip install -r requirements.txt  
python app.py

3. Frontend (React):  
cd Frontend  
npm install  
npm run dev

## 🔐 API Key Usage

- Demo mode uses internal OpenAI key (rate-limited)
- Full mode requires user-provided API keys
- Keys are never exposed; validation and rate checks included

## 📦 Deployment

- ✅ Netlify for frontend
- ✅ Render or Docker for backend
- ✅ Includes setup guides for Supabase, Redis, and deployment

## 🧠 Built With

- OpenAI API  
- React  
- Supabase  
- Python (FastAPI / Flask)  
- Redis  
- Netlify  
- Render  

## ✨ Contributors

- Sharon Avital – Founder, Product  
- Rotem Iiuz – Lead Developer  
- OpenAI – Language Intelligence

## 📬 Contact

office@1000-2000.com  
https://talkapi.ai

## 📜 License

© 2025 TalkAPI by 1000-2000 by me Ltd. All rights reserved.  
For demo and private use only unless agreed otherwise.
