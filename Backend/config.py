import os

class Config:
    # --- AI Models ---
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
    LLM_MODEL = os.getenv("LLM_MODEL", "claude-sonnet-4-5-20250929")

    # --- Supabase ---
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
    SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

    # --- Payments (Tranzila) ---
    TRANZILA_SUPPLIER = os.getenv("TRANZILA_SUPPLIER")
    TRANZILA_PUBLIC_API_KEY = os.getenv("TRANZILA_PUBLIC_API_KEY")
    TRANZILA_SECRET_API_KEY = os.getenv("TRANZILA_SECRET_API_KEY")
    WEBHOOK_SECRET = os.getenv("WEBHOOK_SECRET")

    # --- Redis / Rate limiting ---
    UPSTASH_REDIS_REST_URL = os.getenv("UPSTASH_REDIS_REST_URL")
    UPSTASH_REDIS_REST_TOKEN = os.getenv("UPSTASH_REDIS_REST_TOKEN")

    # --- Security ---
    ALLOWED_ORIGINS = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "").split(",") if o.strip()]
    ALLOWED_PROXY_DOMAINS = [d.strip() for d in os.getenv("ALLOWED_PROXY_DOMAINS", "").split(",") if d.strip()]
    
    # --- Development ---
    DEVELOPMENT_MODE = os.getenv("DEVELOPMENT_MODE", "false").lower() in ("true", "1", "yes")

    # --- OCR ---
    VISION_KEY_B64 = os.getenv("VISION_KEY_B64")
