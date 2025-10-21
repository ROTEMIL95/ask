"""
Proxy Routes - API proxy and external service functionality
"""
from flask import Blueprint, request, jsonify, Response
from datetime import datetime
from limiter_config import get_limiter, add_bonus_calls
from utils.security import is_safe_url, validate_request_size, validate_headers
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
# Load allowed API keys from environment or config file
ALLOWED_API_KEYS = set(os.getenv('ALLOWED_API_KEYS', '').split(',')) if os.getenv('ALLOWED_API_KEYS') else set()
ALLOWED_ORIGINS = set(os.getenv('ALLOWED_ORIGINS', '').split(',')) if os.getenv('ALLOWED_ORIGINS') else set()

# NOTE: ALLOWED_PROXY_DOMAINS is intentionally NOT enforced
# The proxy allows ALL external domains with SSRF protection (blocks localhost, private IPs, metadata services)
# This is by design to allow users to call any public API

# Optionally load from YAML config (for scalability)
try:
    with open('security_config.yaml', 'r') as f:
        config = yaml.safe_load(f)
        ALLOWED_API_KEYS.update(config.get('api_keys', []))
        ALLOWED_ORIGINS.update(config.get('origins', []))
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

# Helper: Proxy target domain whitelist check (DEPRECATED - not used)
# Domain whitelisting is intentionally disabled to allow any public API
# Security is enforced via SSRF protection instead
def is_proxy_domain_allowed(url):
    """
    DEPRECATED: This function is not used.
    All public domains are allowed. Security is enforced via SSRF protection.
    """
    return True  # Allow all domains (SSRF protection handles security)

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
@limiter.limit("100 per minute")  # Enhanced rate limiting
def proxy_api():
    """
    Proxy external API calls to bypass CORS restrictions

    Security features:
    - SSRF protection (blocks localhost, private IPs, metadata services)
    - Request size limits
    - Header validation
    - Rate limiting
    """
    try:
        # Handle OPTIONS request for CORS
        if request.method == 'OPTIONS':
            return ('', 204)

        # Parse and validate target URL
        data = request.get_json()
        print(f"🔍 Proxy request received:")
        print(f"🔍 Request data: {data}")
    except Exception as e:
        print(f"❌ Error in proxy_api initial setup: {str(e)}")
        import traceback
        print(f"❌ Traceback: {traceback.format_exc()}")
        return jsonify({'error': f'Internal error: {str(e)}'}), 500
    
    if not data:
        return jsonify({'error': 'Request data is required'}), 400

    url = data.get('url')
    print(f"🔍 Target URL: {url}")
    
    if not url:
        return jsonify({'error': 'URL is required'}), 400

    method = data.get('method', 'GET')
    headers = data.get('headers', {})
    body = data.get('body')
    
    print(f"🔍 Method: {method}")
    print(f"🔍 Headers: {list(headers.keys()) if headers else 'None'}")
    print(f"🔍 Body type: {type(body).__name__}")

    # 1. SSRF Protection - validate URL is safe
    # In development mode, allow localhost for testing
    import os
    flask_env = os.getenv('FLASK_ENV')
    flask_debug = os.getenv('FLASK_DEBUG')
    is_dev_mode = flask_env == 'development' or flask_debug == '1'
    
    print(f"🔍 Environment check:")
    print(f"   FLASK_ENV: {flask_env}")
    print(f"   FLASK_DEBUG: {flask_debug}")
    print(f"   is_dev_mode: {is_dev_mode}")
    
    url_safe, url_message = is_safe_url(url)
    print(f"🔍 URL safety check result: safe={url_safe}, message={url_message}")
    
    # Check if URL is localhost/127.0.0.1 and we're in dev mode
    is_localhost_url = any(host in url.lower() for host in ['localhost', '127.0.0.1', '0.0.0.0'])
    print(f"🔍 Is localhost URL: {is_localhost_url}")
    
    if not url_safe:
        # If it's a localhost URL and we're in dev mode, allow it
        if is_localhost_url and is_dev_mode:
            print(f"⚠️ DEVELOPMENT MODE: Allowing localhost URL: {url}")
        else:
            print(f"🚫 Blocked unsafe URL: {url} - Reason: {url_message}")
            print(f"🚫 Dev mode: {is_dev_mode}, Localhost: {is_localhost_url}")
            return jsonify({
                'error': 'URL blocked for security reasons',
                'details': url_message,
                'suggestion': 'Ensure you are not trying to access localhost, private networks, or metadata services'
            }), 403

    print(f"✅ URL security check passed: {url}")

    # 2. Validate request body size
    body_valid, body_message = validate_request_size(body)
    if not body_valid:
        print(f"🚫 Request body too large: {body_message}")
        return jsonify({
            'error': 'Request body too large',
            'details': body_message,
            'suggestion': 'Reduce the size of your request body'
        }), 413

    print(f"✅ Request size check passed: {body_message}")

    # 3. Validate headers
    headers_valid, headers_message = validate_headers(headers)
    if not headers_valid:
        print(f"🚫 Invalid headers: {headers_message}")
        return jsonify({
            'error': 'Invalid request headers',
            'details': headers_message,
            'suggestion': 'Check your headers for invalid characters or excessive length'
        }), 400

    print(f"✅ Headers validation passed")

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

        # Enhanced logging: Show body content
        body_preview = str(body)[:500] if body else 'None'
        print(f"📄 Body content (first 500 chars): {body_preview}")
        print(f"📏 Body length: {len(str(body)) if body else 0}")

        # If body is a string, try to parse it as JSON
        if isinstance(body, str):
            print(f"🔍 Body is a string, attempting JSON parse...")
            try:
                parsed_body = _json.loads(body)
                request_kwargs['json'] = parsed_body
                print(f"✅ Body parsed from string to JSON: {type(parsed_body).__name__}")
                print(f"📊 Parsed body keys: {list(parsed_body.keys()) if isinstance(parsed_body, dict) else 'N/A'}")
            except _json.JSONDecodeError as e:
                print(f"❌ JSON parse error: {str(e)}")
                print(f"❌ Error at position: {e.pos if hasattr(e, 'pos') else 'unknown'}")
                print(f"❌ Problematic section: {body[max(0, e.pos-50):min(len(body), e.pos+50)] if hasattr(e, 'pos') else 'N/A'}")
                print(f"⚠️ Sending as raw data instead")
                request_kwargs['data'] = body
        elif isinstance(body, dict):
            request_kwargs['json'] = body
            print(f"✅ Body is already a dict, using json parameter")
            print(f"📊 Body keys: {list(body.keys())}")
        else:
            request_kwargs['data'] = body
            print(f"⚠️ Body is neither string nor dict (type: {type(body).__name__}), using data parameter")
    
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
        import traceback
        print(f"❌ Traceback: {traceback.format_exc()}")
        return jsonify({'error': f'Request failed: {str(e)}'}), 500
    except Exception as e:
        print(f"❌ Proxy error: {str(e)}")
        import traceback
        print(f"❌ Traceback: {traceback.format_exc()}")
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

@proxy_bp.route('/proxy-docs', methods=['GET', 'OPTIONS'])
@limiter.limit("10 per minute")
def proxy_docs():
    """Fetch external documentation to bypass CORS restrictions"""
    # Handle OPTIONS request for CORS
    if request.method == 'OPTIONS':
        return ('', 204)

    try:
        url = request.args.get('url')
        if not url:
            return jsonify({'error': 'URL parameter is required'}), 400

        # Validate URL protocol
        if not url.startswith(('http://', 'https://')):
            return jsonify({'error': 'Invalid URL protocol'}), 400

        # SSRF Protection - validate URL is safe
        url_safe, url_message = is_safe_url(url)
        if not url_safe:
            print(f"🚫 Blocked unsafe URL in /proxy-docs: {url} - Reason: {url_message}")
            return jsonify({
                'error': 'URL blocked for security reasons',
                'details': url_message
            }), 403

        print(f"📚 Fetching documentation from: {url}")

        # Fetch the documentation
        response = requests.get(url, timeout=30, allow_redirects=True)

        print(f"📡 Response status: {response.status_code}")

        # Handle non-200 responses gracefully
        content_type = response.headers.get('content-type', '')

        # Return the content even if status is not 200 (let frontend handle it)
        return jsonify({
            'status': response.status_code,
            'content_type': content_type,
            'content': response.text,
            'url': url,
            'ok': response.status_code >= 200 and response.status_code < 300
        })

    except requests.exceptions.Timeout as e:
        print(f"⏱️ Timeout fetching documentation from {url}: {str(e)}")
        return jsonify({'error': 'Request timed out while fetching documentation'}), 504
    except requests.exceptions.RequestException as e:
        print(f"❌ Request exception in /proxy-docs: {str(e)}")
        return jsonify({
            'error': f'Failed to fetch documentation: {str(e)}',
            'url': url
        }), 500
    except Exception as e:
        print(f"❌ Unexpected error in /proxy-docs: {str(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
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