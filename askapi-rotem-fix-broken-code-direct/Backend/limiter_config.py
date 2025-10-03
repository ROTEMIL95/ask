import os
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from dotenv import load_dotenv
from flask import request
import datetime
import requests

# Load environment variables
load_dotenv()

UPSTASH_REDIS_TCP_URL = os.getenv('UPSTASH_REDIS_TCP_URL')
UPSTASH_REDIS_REST_URL = os.getenv('UPSTASH_REDIS_REST_URL')
UPSTASH_REDIS_REST_TOKEN = os.getenv('UPSTASH_REDIS_REST_TOKEN')

# Prefer TCP URI if provided, else use REST
if UPSTASH_REDIS_TCP_URL:
    # Use TCP URI for Limiter
    pass
elif UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN:
    # For REST API, we need to construct a proper Redis URI
    url = UPSTASH_REDIS_REST_URL.replace('https://', '').replace('http://', '')
    # Note: REST API is only used for bonus calls, not for Limiter
else:
    # No Redis configuration available
    pass

# Helper: get user key (user_id if logged in, else IP)
def get_user_key():
    from flask import g
    user_id = getattr(g, 'user_id', None)
    if user_id:
        return f"user:{user_id}"
    return f"ip:{get_remote_address()}"

def today_str():
    return datetime.datetime.utcnow().strftime('%Y-%m-%d')

def get_bonus_key():
    return f"bonus:{get_user_key()}:{today_str()}"

def get_bonus_calls():
    if not (UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN):
        return 0
    key = get_bonus_key()
    headers = {
        'Authorization': f'Bearer {UPSTASH_REDIS_REST_TOKEN}',
        'Content-Type': 'application/json'
    }
    try:
        resp = requests.get(f"{UPSTASH_REDIS_REST_URL}/get/{key}", headers=headers)
        if resp.status_code == 200:
            data = resp.json()
            val = data.get('result')
            return int(val) if val else 0
    except Exception:
        pass
    return 0

def add_bonus_calls(amount=5):
    if not (UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN):
        return False
    key = get_bonus_key()
    headers = {
        'Authorization': f'Bearer {UPSTASH_REDIS_REST_TOKEN}',
        'Content-Type': 'application/json'
    }
    try:
        resp = requests.post(f"{UPSTASH_REDIS_REST_URL}/incrby/{key}", headers=headers, json={"num": int(amount), "ex": 86400})
        return resp.status_code == 200
    except Exception:
        return False

def dynamic_daily_limit():
    base = 50
    bonus = get_bonus_calls()
    return f"{base + bonus} per day"

def get_limiter(app=None):
    # Only use TCP URI for Limiter, REST API is handled separately for bonus calls
    if UPSTASH_REDIS_TCP_URL:
        try:
            return Limiter(
                app=app,
                key_func=get_user_key,
                storage_uri=UPSTASH_REDIS_TCP_URL,
                default_limits=[dynamic_daily_limit]
            )
        except Exception as e:
            print(f"Warning: Redis connection failed, falling back to in-memory storage: {e}")
            # Fallback to in-memory storage
            return Limiter(
                app=app,
                key_func=get_user_key,
                default_limits=[dynamic_daily_limit]
            )
    else:
        # Use in-memory storage when no Redis is configured
        return Limiter(
            app=app,
            key_func=get_user_key,
            default_limits=[dynamic_daily_limit]
        ) 