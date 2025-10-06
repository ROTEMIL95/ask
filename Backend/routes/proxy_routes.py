"""
Proxy Routes - API proxy and external service functionality
"""
from flask import Blueprint, request, jsonify, Response
from datetime import datetime
from limiter_config import get_limiter, add_bonus_calls
import requests
import yaml
import os
from functools import wraps
from collections import defaultdict
import time as _time
import json as _json

# Create blueprint
proxy_bp = Blueprint('proxy', __name__)

# Get limiter instance
limiter = get_limiter(None)  # Will be configured in main app

# --- Security Config ---
# Load allowed API keys and domains from environment or config file
ALLOWED_API_KEYS = set(os.getenv('ALLOWED_API_KEYS', '').split(',')) if os.getenv('ALLOWED_API_KEYS') else set()
ALLOWED_ORIGINS = set(os.getenv('ALLOWED_ORIGINS', '').split(',')) if os.getenv('ALLOWED_ORIGINS') else set()
ALLOWED_PROXY_DOMAINS = set(os.getenv('ALLOWED_PROXY_DOMAINS', '').split(',')) if os.getenv('ALLOWED_PROXY_DOMAINS') else set()

# Optionally load from YAML config (for scalability)
try:
    with open('security_config.yaml', 'r') as f:
        config = yaml.safe_load(f)
        ALLOWED_API_KEYS.update(config.get('api_keys', []))
        ALLOWED_ORIGINS.update(config.get('origins', []))
        ALLOWED_PROXY_DOMAINS.update(config.get('proxy_domains', []))
except Exception:
    pass

# Helper: API key required decorator
def require_api_key(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        api_key = request.headers.get('X-API-Key') or request.args.get('api_key')
        if not api_key or api_key not in ALLOWED_API_KEYS:
            return jsonify({'error': 'Missing or invalid API key'}), 401
        return f(*args, **kwargs)
    return decorated

# Helper: Proxy target domain whitelist check
def is_proxy_domain_allowed(url):
    try:
        from urllib.parse import urlparse
        parsed = urlparse(url)
        domain = parsed.hostname
        if not domain:
            return False
        for allowed in ALLOWED_PROXY_DOMAINS:
            if allowed and allowed in domain:
                return True
        return False
    except Exception:
        return False

# Helper: Rate limit per API key (simple in-memory, for demo; use Redis for prod)
RATE_LIMITS = defaultdict(lambda: {'count': 0, 'reset': 0})
RATE_LIMIT = int(os.getenv('API_KEY_RATE_LIMIT', '100'))  # requests per window
RATE_WINDOW = int(os.getenv('API_KEY_RATE_WINDOW', '60'))  # seconds

def check_rate_limit(api_key):
    now = int(_time.time())
    rl = RATE_LIMITS[api_key]
    if now > rl['reset']:
        rl['count'] = 0
        rl['reset'] = now + RATE_WINDOW
    rl['count'] += 1
    if rl['count'] > RATE_LIMIT:
        return False, rl['reset'] - now
    return True, rl['reset'] - now

@proxy_bp.route('/proxy-api', methods=['POST', 'OPTIONS'])
def proxy_api():
    """Proxy external API calls to bypass CORS restrictions"""
    # Handle OPTIONS request for CORS
    if request.method == 'OPTIONS':
        return ('', 204)
    
    # Parse and validate target URL
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request data is required'}), 400
    
    url = data.get('url')
    if not url:
        return jsonify({'error': 'URL is required'}), 400
    
    # For development: Allow common API domains
    # In production, you should use proper domain whitelisting
    allowed_domains = [
        'api.openweathermap.org',
        'api.openai.com',
        'api.anthropic.com',
        'jsonplaceholder.typicode.com',
        'api.github.com',
        'api.stripe.com',
        'maps.googleapis.com'
    ]
    
    # Check if the URL is from an allowed domain
    from urllib.parse import urlparse
    parsed_url = urlparse(url)
    is_allowed = any(domain in parsed_url.hostname for domain in allowed_domains) if parsed_url.hostname else False
    
    # For development, allow all domains if ALLOWED_PROXY_DOMAINS is empty
    if not ALLOWED_PROXY_DOMAINS or not is_allowed:
        # In development mode, allow all domains
        pass  # Remove domain restriction for development
    
    method = data.get('method', 'GET')
    headers = data.get('headers', {})
    body = data.get('body')

    # SSRF protection: only allow http/https
    if not url.startswith(('http://', 'https://')):
        return jsonify({'error': 'Invalid URL protocol'}), 400

    # Auto-inject API keys for known services
    if 'api.anthropic.com' in url:
        print(f"🔍 Anthropic API detected. Original headers: {headers}")
        # Inject Anthropic API key from environment
        anthropic_key = os.getenv('ANTHROPIC_API_KEY')
        if anthropic_key:
            print(f"✅ Anthropic API key found (length: {len(anthropic_key)})")

            # Check for x-api-key with different casing
            api_key_header = None
            for key in headers.keys():
                if key.lower() == 'x-api-key':
                    api_key_header = key
                    break

            # Replace placeholder API keys or add if missing
            if api_key_header:
                original_key = headers[api_key_header]
                # List of known placeholders
                placeholders = [
                    'YOUR_API_KEY',
                    'YOUR_API_KEY_HERE',
                    'your-api-key-here',
                    '${apiKey}',
                    'apiKey',
                    'your_api_key',
                    'YOUR-API-KEY',
                    '<your-api-key>'
                ]

                # Check if the key looks valid (starts with sk- for Anthropic and has good length)
                is_valid_key = (
                    original_key and
                    len(original_key) >= 20 and
                    original_key not in placeholders and
                    (original_key.startswith('sk-') or len(original_key) > 50)
                )

                if is_valid_key:
                    # User provided their own valid API key, use it!
                    print(f"✅ Using user-provided API key (length: {len(original_key)})")
                    # Keep the user's key as-is
                elif original_key in placeholders or not original_key or len(original_key) < 20:
                    # Placeholder or invalid key, use server's key
                    headers[api_key_header] = anthropic_key
                    print(f"🔄 Replaced placeholder/invalid '{original_key}' with server's API key")
                else:
                    # Suspicious key that doesn't match our patterns, use server's key for safety
                    headers[api_key_header] = anthropic_key
                    print(f"⚠️ Suspicious key detected, using server's API key instead")
            else:
                # Add the API key if not present
                headers['x-api-key'] = anthropic_key
                print(f"➕ Added x-api-key header")

            # Ensure required Anthropic headers
            anthropic_version_header = None
            for key in headers.keys():
                if key.lower() == 'anthropic-version':
                    anthropic_version_header = key
                    break

            if not anthropic_version_header:
                headers['anthropic-version'] = '2023-06-01'
                print(f"➕ Added anthropic-version header")

            print(f"📤 Final headers for Anthropic: {list(headers.keys())}")
        else:
            print(f"❌ ANTHROPIC_API_KEY not found in environment")
            return jsonify({'error': 'Anthropic API key not configured on server'}), 500

    # Prepare request
    request_kwargs = {
        'headers': headers,
        'timeout': 30
    }

    if body and method.upper() not in ['GET', 'HEAD']:
        print(f"📦 Processing request body (type: {type(body).__name__})")

        # If body is a string, try to parse it as JSON
        if isinstance(body, str):
            try:
                parsed_body = _json.loads(body)
                request_kwargs['json'] = parsed_body
                print(f"✅ Body parsed from string to JSON: {type(parsed_body).__name__}")
            except _json.JSONDecodeError as e:
                print(f"⚠️ Body is not valid JSON, sending as raw data: {str(e)}")
                request_kwargs['data'] = body
        elif isinstance(body, dict):
            request_kwargs['json'] = body
            print(f"✅ Body is already a dict, using json parameter")
        else:
            request_kwargs['data'] = body
            print(f"⚠️ Body is neither string nor dict, using data parameter")
    
    try:
        print(f"🚀 Making request to: {url}")
        print(f"📮 Method: {method.upper()}")
        print(f"📑 Request kwargs: {list(request_kwargs.keys())}")

        response = requests.request(method.upper(), url, **request_kwargs)

        print(f"📡 Response status: {response.status_code}")
        print(f"📊 Response headers: {list(response.headers.keys())}")

        try:
            response_data = response.json()
            print(f"✅ Response is JSON")
        except:
            response_data = response.text
            print(f"📄 Response is text (length: {len(response_data)})")

        result = {
            'status': response.status_code,
            'statusText': 'OK' if response.status_code == 200 else response.reason,
            'headers': dict(response.headers),
            'data': response_data,
            'url': url
        }

        print(f"📤 Returning proxy response")
        return jsonify(result)
    except requests.exceptions.RequestException as e:
        print(f"❌ Request exception: {str(e)}")
        return jsonify({'error': f'Request failed: {str(e)}'}), 500
    except Exception as e:
        print(f"❌ Proxy error: {str(e)}")
        return jsonify({'error': f'Proxy error: {str(e)}'}), 500


@proxy_bp.route('/proxy-openai-completions', methods=['POST', 'OPTIONS'])
def proxy_openai_completions():
    """Forward OpenAI chat completion request exactly like Postman.

    - Accepts raw JSON body matching OpenAI API (no wrapping)
    - Forwards via requests.post with json=payload
    - Sets headers: Authorization: Bearer <KEY>, Content-Type: application/json
    - Returns raw response body and status
    - Logs frontend JSON (string) and forwarded dict; prints simple diff if structure differs
    """
    if request.method == 'OPTIONS':
        return ('', 204)

    try:
        # Log the exact JSON string the frontend sent
        frontend_raw = request.get_data(as_text=True) or ''
        print("[OpenAI Proxy] Frontend JSON (raw):", frontend_raw)

        # Parse into Python dict
        payload = request.get_json(silent=True)
        if payload is None:
            return jsonify({'error': 'Invalid or missing JSON body'}), 400

        # Sanity adjustments for GPT-5
        forward_payload = dict(payload)
        forward_payload['model'] = 'gpt-5'
        # Normalize token parameter
        if 'max_tokens' in forward_payload:
            forward_payload['max_completion_tokens'] = forward_payload.pop('max_tokens')
        # Optionally remove unsupported params
        # Keep temperature unless model rejects, but remove if explicitly requested via header flag
        if request.headers.get('X-Remove-Temperature') == '1':
            forward_payload.pop('temperature', None)

        # Log the dict we'll forward
        print("[OpenAI Proxy] Forward payload (dict):", forward_payload)

        # Quick structural diff vs. expected Postman shape
        def _short_diff(a: dict, b: dict):
            diffs = []
            a_keys = set(a.keys())
            b_keys = set(b.keys())
            for k in sorted(a_keys - b_keys):
                diffs.append(f"extra_in_frontend:{k}")
            for k in sorted(b_keys - a_keys):
                diffs.append(f"missing_in_frontend:{k}")
            # Shallow compare model
            if a.get('model') != b.get('model'):
                diffs.append(f"model:{a.get('model')}!= {b.get('model')}")
            # Messages check
            a_msgs = a.get('messages')
            b_msgs = b.get('messages')
            if not isinstance(a_msgs, list):
                diffs.append('messages:not_list')
            elif isinstance(b_msgs, list) and a_msgs:
                if a_msgs[0].get('role') != b_msgs[0].get('role'):
                    diffs.append('messages[0].role:mismatch')
                if not a_msgs[0].get('content'):
                    diffs.append('messages[0].content:empty')
            return diffs

        expected_shape = {
            'model': 'gpt-5',
            'messages': [{'role': 'user', 'content': '...'}]
        }
        diffs = _short_diff(forward_payload, expected_shape)
        if diffs:
            print('[OpenAI Proxy] Shape diff vs Postman JSON:', ', '.join(diffs))

        # Prepare OpenAI call
        openai_key = os.getenv('OPENAI_API_KEY')
        if not openai_key:
            return jsonify({'error': 'Server missing OPENAI_API_KEY'}), 500

        headers = {
            'Authorization': f'Bearer {openai_key}',
            'Content-Type': 'application/json'
        }

        url = 'https://api.openai.com/v1/chat/completions'

        # Forward EXACTLY as JSON
        r = requests.post(url, headers=headers, json=forward_payload, timeout=60)

        # Relay raw body and status
        resp = Response(response=r.content, status=r.status_code, mimetype=r.headers.get('Content-Type', 'application/json'))
        # Let global CORS config handle headers; add minimal safety
        resp.headers['Access-Control-Expose-Headers'] = 'Content-Type'
        return resp
    except requests.exceptions.RequestException as e:
        return jsonify({'error': f'OpenAI request failed: {str(e)}'}), 502
    except Exception as e:
        return jsonify({'error': f'Proxy error: {str(e)}'}), 500

@proxy_bp.route('/proxy-docs', methods=['GET'])
@limiter.limit("10 per minute")
def proxy_docs():
    """Fetch external documentation to bypass CORS restrictions"""
    try:
        url = request.args.get('url')
        if not url:
            return jsonify({'error': 'URL parameter is required'}), 400
        
        # Validate URL
        if not url.startswith(('http://', 'https://')):
            return jsonify({'error': 'Invalid URL protocol'}), 400
        
        # Fetch the documentation
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        
        content_type = response.headers.get('content-type', '')
        
        # Return the content
        return jsonify({
            'status': response.status_code,
            'content_type': content_type,
            'content': response.text,
            'url': url
        })
        
    except requests.exceptions.RequestException as e:
        return jsonify({'error': f'Failed to fetch documentation: {str(e)}'}), 500
    except Exception as e:
        return jsonify({'error': f'Proxy error: {str(e)}'}), 500

@proxy_bp.route('/feedback', methods=['POST'])
@limiter.limit("5 per minute")
def feedback():
    """Submit feedback and reward user with bonus API calls"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Feedback data is required'}), 400
        
        rating = data.get('rating')
        feedback_text = data.get('feedback', '')
        email = data.get('email', '')
        user_id = data.get('userId', '')
        
        if not rating or not isinstance(rating, int) or rating < 1 or rating > 5:
            return jsonify({'error': 'Valid rating (1-5) is required'}), 400
        
        # Store feedback (you can implement database storage here)
        feedback_data = {
            'rating': rating,
            'feedback': feedback_text,
            'email': email,
            'user_id': user_id,
            'timestamp': datetime.now().isoformat()
        }
        
        # Add bonus calls for the user
        bonus_added = add_bonus_calls(5)  # Give 5 bonus calls
        
        return jsonify({
            'message': 'Feedback submitted successfully!',
            'bonus_calls_added': 5 if bonus_added else 0,
            'feedback': feedback_data
        })
        
    except Exception as e:
        print(f"Error in /feedback endpoint: {e}")
        return jsonify({'error': 'Failed to submit feedback'}), 500