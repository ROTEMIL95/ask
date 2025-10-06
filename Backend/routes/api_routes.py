"""
API Routes - Core API functionality (TalkAPI)
"""
from utils.monthly_quota import check_and_decrement
from supabase_client import supabase_manager
from flask import Blueprint, request, jsonify, make_response
from datetime import datetime
from limiter_config import get_limiter
from dotenv import load_dotenv
from anthropic import Anthropic
import os, sys, io, json, re

# --- Env & stdout ---
load_dotenv()
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8")

# --- LLM client ---
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
if not ANTHROPIC_API_KEY:
    print("⚠️ ANTHROPIC_API_KEY missing – /ask will return 500 until set.")

# Initialize Anthropic client using the template
client = Anthropic(
    # defaults to os.environ.get("ANTHROPIC_API_KEY")
    api_key=ANTHROPIC_API_KEY,
)
MODEL_NAME = "claude-sonnet-4-5-20250929"  # Updated to specific version

# --- Blueprint & limiter (app will init later) ---
api_bp = Blueprint("api", __name__)
limiter = get_limiter(None)

# --- System prompt (for backward compatibility) ---
def generate_system_prompt(api_config, user_question, api_analysis=None):
    """Generate a dynamic system prompt based on API configuration and analysis"""
    base_prompt = """You are TalkAPI's API-integration planner & code generator.
You MUST ALWAYS provide code examples in three languages: JavaScript (fetch), Python (requests), and cURL.
Each code example MUST be wrapped in triple backticks with the language specified.

Before generating code, I will analyze the API requirements and provide guidance:
"""

    # Add API analysis results if available
    if api_analysis:
        base_prompt += "\nAPI Analysis Results:"
        
        # Add base URLs
        if api_analysis.get('urls'):
            base_prompt += "\nBase URLs detected:"
            for url in api_analysis['urls']:
                base_prompt += f"\n- {url}"
        
        # Add endpoints
        if api_analysis.get('endpoints'):
            base_prompt += "\nEndpoints available:"
            for endpoint in api_analysis['endpoints']:
                base_prompt += f"\n- {endpoint}"
        
        # Add authentication requirements
        if api_analysis.get('security_requirements'):
            base_prompt += "\nAuthentication Required:"
            for req in api_analysis['security_requirements']:
                base_prompt += f"\n- Type: {req['type']}"
                if req.get('name'):
                    base_prompt += f"\n  Header: {req['name']}"
        
        # Add OpenAPI info if available
        if api_analysis.get('is_openapi'):
            base_prompt += "\nOpenAPI/Swagger Format Detected:"
            if api_analysis.get('openapi_data'):
                info = api_analysis['openapi_data'].get('info', {})
                base_prompt += f"\n- Title: {info.get('title', 'Untitled')}"
                base_prompt += f"\n- Version: {info.get('version', 'unknown')}"
                if info.get('description'):
                    base_prompt += f"\n- Description: {info['description']}"

    # Add API-specific details and user's question
    if api_config:
        base_prompt += f"""
API Details:
- Name: {api_config.get('apiName', 'default')}
- Base URL: {api_config.get('baseUrl', '')}
- Authentication: {'Required' if api_config.get('hasApiKey') else 'Not Required'}
- Documentation: {api_config.get('docsUrl', '')}
- Available Methods: {', '.join(api_config.get('methods', ['GET', 'POST']))}
- Auth Type: {api_config.get('authType', 'none')}
- API Version: {api_config.get('version', 'latest')}

User's Question: "{user_question}"

Use these details to generate accurate code examples. Include proper:
1. Base URL and endpoints
2. Authentication headers (if required)
3. Request parameters and body format
4. Error handling
5. Response parsing
"""

    # Format the base URL and endpoint - ensure no template variables
    raw_base_url = api_config.get('baseUrl', 'https://api.anthropic.com')
    
    # Remove any template variable syntax and use direct URLs
    base_url = raw_base_url.replace('${BASE_URL}', 'https://api.example.com')
    base_url = base_url.replace('${baseUrl}', 'https://api.example.com')
    base_url = base_url.replace('${apiUrl}', 'https://api.example.com')
    base_url = base_url.replace('${url}', 'https://api.example.com')
    
    # Clean up any remaining template literal syntax
    import re
    base_url = re.sub(r'\$\{[^}]+\}', 'https://api.example.com', base_url)
    base_url = base_url.replace('`', '').replace('${', '').replace('}', '')
    
    # Clean up any curly brace template syntax that might remain
    base_url = re.sub(r'\{[^}]+\}', 'https://api.example.com', base_url)
    base_url = base_url.replace('{', '').replace('}', '')
    base_url = base_url.rstrip('/')
    
    # If base_url still contains template variables, is empty, or is invalid, use a default
    if any(char in base_url for char in ['${', '`', '{', '}']) or base_url == '' or not base_url.startswith('http'):
        base_url = 'https://api.example.com'
    
    # Remove any existing endpoint from base_url to avoid duplication
    if base_url.endswith('/v1/messages'):
        base_url = base_url.replace('/v1/messages', '')
    
    endpoint = '/v1/messages'  # Default endpoint for Anthropic
    method = api_config.get('methods', ['POST'])[0]  # Get first available method or POST
    model = api_config.get('version', 'claude-sonnet-4-5-20250929')
    
    # Prepare auth headers based on API config and analysis
    auth_headers = []
    
    # Add headers from API config
    # Always use placeholders for generated code examples
    api_key_placeholder = 'YOUR_API_KEY'
    username_placeholder = 'YOUR_USERNAME'
    password_placeholder = 'YOUR_PASSWORD'
    
    if api_config:
        auth_type = api_config.get('authType', 'none')
        
        if auth_type == 'basic':
            # Basic Authentication (username:password)
            auth_headers.append(f"'Authorization': 'Basic ' + btoa('{username_placeholder}:{password_placeholder}')")
        elif api_config.get('hasApiKey'):
            if auth_type == 'bearer':
                auth_headers.append(f"'Authorization': 'Bearer {api_key_placeholder}'")
            elif auth_type == 'x-api-key':
                auth_headers.append(f"'X-API-Key': '{api_key_placeholder}'")
            elif auth_type == 'api_key':
                auth_headers.append(f"'X-API-Key': '{api_key_placeholder}'")
            else:
                auth_headers.append(f"'Authorization': 'Bearer {api_key_placeholder}'")
    
    # Add headers from API analysis
    if api_analysis and api_analysis.get('security_requirements'):
        for req in api_analysis['security_requirements']:
            if req['type'] == 'api_key':
                auth_headers.append(f"'{req['name']}': '{api_key_placeholder}'")
            elif req['type'] == 'bearer':
                auth_headers.append(f"'Authorization': 'Bearer {api_key_placeholder}'")
            elif req['type'] == 'basic':
                auth_headers.append(f"'Authorization': 'Basic ' + btoa('{username_placeholder}:{password_placeholder}')")
    
    # Ensure we have at least one auth header if auth is required
    if (api_config and api_config.get('hasApiKey')) or (api_analysis and api_analysis.get('security_requirements')):
        if not auth_headers:
            auth_headers.append(f"'X-API-Key': '{api_key_placeholder}'")
    
    # Join all unique headers
    auth_headers = list(set(auth_headers))  # Remove duplicates
    auth_headers_str = ', '.join(auth_headers) if auth_headers else ''
    
    # Prepare code examples as separate strings to avoid nested f-strings
    code_intro = "\nYour response MUST include these three code blocks with the actual API configuration:\n"
    
    # JavaScript code
    # Handle Basic Auth separately for proper code generation
    js_auth_setup = ""
    js_headers_list = ["'Content-Type': 'application/json'"]
    
    if api_config and api_config.get('authType') == 'basic':
        js_auth_setup = ""
        # For Basic Auth, encode directly without variables
        js_headers_list.insert(0, f"'Authorization': 'Basic ' + btoa('{username_placeholder}:{password_placeholder}')")
    elif auth_headers_str:
        # Clean up the headers for JavaScript format
        for header in auth_headers_str.split(','):
            header = header.strip()
            if 'btoa(' not in header:  # Skip Basic Auth headers already handled above
                js_headers_list.insert(0, header)
    
    js_headers_formatted = ',\n        '.join(js_headers_list)
    
    js_code = f"""
```javascript
// JavaScript example using fetch
{js_auth_setup}const response = await fetch('{base_url}{endpoint}', {{
    method: '{method}',
    headers: {{
        {js_headers_formatted}
    }},
    body: JSON.stringify({{
        model: {json.dumps(model)},
        max_tokens: 1024,
        messages: [
            {{
                role: 'user',
                content: {json.dumps(user_question)}
            }}
        ]
    }})
}});

if (!response.ok) {{
    throw new Error('HTTP error! status: ' + response.status);
}}

const data = await response.json();
console.log('API Response:', data);
```"""

    # Add the code blocks to the prompt
    base_prompt += code_intro
    base_prompt += js_code

    # Python code
    # Handle Basic Auth separately for proper code generation
    py_imports = "import requests"
    py_auth_setup = ""
    py_headers_list = ["'Content-Type': 'application/json'"]
    
    if api_config and api_config.get('authType') == 'basic':
        py_imports = "import requests\nimport base64"
        py_auth_setup = ""
        # For Basic Auth, encode directly without variables
        py_headers_list.insert(0, f"'Authorization': 'Basic ' + base64.b64encode('{username_placeholder}:{password_placeholder}'.encode()).decode()")
    elif auth_headers_str:
        # Clean up the headers for Python format  
        for header in auth_headers_str.split(','):
            header = header.strip()
            if 'btoa(' not in header:  # Skip Basic Auth headers already handled above
                py_headers_list.insert(0, header)
    
    py_headers_formatted = ',\n        '.join(py_headers_list)
    
    py_code = f"""
```python
# Python example using requests
{py_imports}{py_auth_setup}
response = requests.{method.lower()}(
    '{base_url}{endpoint}',
    headers={{
        {py_headers_formatted}
    }},
    json={{
        'model': {json.dumps(model)},
        'max_tokens': 1024,
        'messages': [
            {{
                'role': 'user',
                'content': {json.dumps(user_question)}
            }}
        ]
    }}
)

response.raise_for_status()  # Raises an HTTPError for bad responses
data = response.json()
print('API Response:', data)
```"""

    base_prompt += py_code

    # cURL code
    # Handle Basic Auth separately for proper cURL command
    curl_auth = ""
    curl_headers = ["-H 'Content-Type: application/json'"]
    
    if api_config and api_config.get('authType') == 'basic':
        curl_auth = f"-u {username_placeholder}:{password_placeholder}"
    elif auth_headers:
        for header in auth_headers:
            # Convert 'Header': 'value' to -H 'Header: value'
            header = header.replace("'", "")
            if 'btoa(' not in header:  # Skip Basic Auth headers already handled above
                curl_headers.append(f"-H '{header}'")
    
    curl_headers_str = " \\\n    ".join(curl_headers)
    curl_auth_str = f" \\\n    {curl_auth}" if curl_auth else ""
    
    # Prepare request data as proper JSON (inline)
    request_data_json = json.dumps({
        "model": model,
        "max_tokens": 1024,
        "messages": [
            {
                "role": "user",
                "content": user_question
            }
        ]
    }, indent=2)
    
    curl_code = f"""
```bash
# cURL example

curl -X {method} '{base_url}{endpoint}'{curl_auth_str} \\
    {curl_headers_str} \\
    -d '{request_data_json}'
```"""

    base_prompt += curl_code
    base_prompt += "\n\nThe code examples above use the actual values from your API configuration."
    base_prompt += "\nInclude proper error handling and response parsing in each example."
    
    return base_prompt

# Initialize as empty, will be set per request
system_prompt = ""

# --- Helpers ---
def _collect_text(msg):
    out = []
    for part in getattr(msg, "content", []) or []:
        if getattr(part, "type", "") == "text":
            out.append(part.text)
    return "".join(out).strip()

def _strip_fences(s: str) -> str:
    if "```" in s:
        m = re.search(r"```(?:json)?\s*(\{[\s\S]*?\})\s*```", s)
        if m:
            return m.group(1)
        m = re.search(r"(\{[\s\S]*?\})", s)
        if m:
            return m.group(1)
    else:
        m = re.search(r"(\{[\s\S]*?\})", s)
        if m:
            return m.group(1)
    return s

def _validate_plan(plan: dict) -> dict:
    plan.setdefault("description", "API integration approach")
    plan.setdefault("endpoints", [])
    plan.setdefault("method", "GET")
    if isinstance(plan["method"], str):
        plan["method"] = plan["method"].upper()
        if plan["method"] not in ["GET", "POST", "PUT", "DELETE", "PATCH"]:
            plan["method"] = "GET"
    if not isinstance(plan["endpoints"], list):
        plan["endpoints"] = []
    return plan

def _ensure_six_snippets(snips: dict) -> dict:
    keys = ["javascript", "python", "curl", "csharp", "java", "go"]
    snips = snips or {}
    for k in keys:
        snips.setdefault(k, "")
    return snips

# --- NEW: detect and parse OpenAPI/Swagger ---
def _is_openapi_spec(doc: str) -> bool:
    try:
        data = json.loads(doc)
        return "openapi" in data or "swagger" in data
    except Exception:
        return False

def _parse_openapi_spec(doc: str) -> dict:
    try:
        spec = json.loads(doc)
        paths = spec.get("paths", {})
        
        # Extract all endpoints and their methods
        endpoints = []
        for path, methods in paths.items():
            for method, details in methods.items():
                endpoint = {
                    "path": path,
                    "method": method.upper(),
                    "summary": details.get("summary", ""),
                    "parameters": details.get("parameters", []),
                    "security": details.get("security", [])
                }
                endpoints.append(endpoint)

        # Extract security schemes
        security_schemes = spec.get("components", {}).get("securitySchemes", {})
        auth_types = []
        for scheme_name, scheme in security_schemes.items():
            scheme_type = scheme.get("type", "").lower()
            if scheme_type == "apikey":
                auth_types.append({
                    "type": "api_key",
                    "name": scheme.get("name"),
                    "in": scheme.get("in")  # header, query, or cookie
                })
            elif scheme_type == "http":
                auth_types.append({
                    "type": scheme.get("scheme", "").lower(),  # bearer or basic
                    "format": scheme.get("bearerFormat")  # JWT, etc.
                })
            elif scheme_type == "oauth2":
                auth_types.append({
                    "type": "oauth2",
                    "flows": scheme.get("flows", {})
                })

        return {
            "info": {
                "title": spec.get("info", {}).get("title", "Untitled"),
                "version": spec.get("info", {}).get("version", "unknown"),
                "description": spec.get("info", {}).get("description", "")
            },
            "servers": spec.get("servers", []),
            "endpoints": endpoints,
            "auth_types": auth_types,
            "openapi_version": spec.get("openapi") or spec.get("swagger")
        }
    except Exception as e:
        return {
            "error": f"Failed to parse OpenAPI spec: {e}",
            "endpoints": [],
            "auth_types": []
        }

# --- API Analysis Functions ---
def analyze_api_doc(text: str) -> dict:
    """Analyze API documentation text for URLs, endpoints, auth requirements, etc."""
    # Regular expressions for different patterns
    url_pattern = r'https?://[^\s<>"\']+[a-zA-Z0-9]'
    endpoint_pattern = r'["\']/([\w\/_-]+)(?:\{[\w-]+\})*["\']'
    auth_pattern = r'(api[_-]?key|auth[_-]?token|bearer|x-api-key|basic[_-]?auth|username|password|credentials)'
    method_pattern = r'(GET|POST|PUT|DELETE|PATCH)\s+[\'"]/?[\w\/_-]+[\'"]'
    param_pattern = r'["\'](\{[\w-]+\})["\']'

    # Extract patterns
    urls = list(set(re.findall(url_pattern, text, re.IGNORECASE)))
    endpoints = list(set(re.findall(endpoint_pattern, text, re.IGNORECASE)))
    auth_types = list(set(re.findall(auth_pattern, text, re.IGNORECASE)))
    methods = list(set(m.group(1) for m in re.finditer(method_pattern, text, re.IGNORECASE)))
    path_params = list(set(re.findall(param_pattern, text, re.IGNORECASE)))

    # Check if it's OpenAPI/Swagger format
    is_openapi = False
    openapi_data = None
    try:
        data = json.loads(text)
        if "swagger" in data or "openapi" in data:
            is_openapi = True
            openapi_data = _parse_openapi_spec(text)
    except json.JSONDecodeError:
        pass

    # Analyze security requirements
    security_requirements = []
    has_basic_auth = False
    
    for auth in auth_types:
        auth = auth.lower()
        if "basic" in auth or "username" in auth or "password" in auth or "credentials" in auth:
            if not has_basic_auth:  # Avoid duplicates
                security_requirements.append({
                    "type": "basic",
                    "location": "header",
                    "name": "Authorization"
                })
                has_basic_auth = True
        elif "api" in auth and "key" in auth:
            security_requirements.append({
                "type": "api_key",
                "location": "header",
                "name": "x-api-key"
            })
        elif "bearer" in auth:
            security_requirements.append({
                "type": "bearer",
                "location": "header",
                "name": "Authorization"
            })

    # Build response
    analysis = {
        "urls": urls,
        "endpoints": [e.strip('"\'"') for e in endpoints],
        "auth_types": auth_types,
        "methods": methods,
        "path_params": [p.strip('"\'"') for p in path_params],
        "security_requirements": security_requirements,
        "is_openapi": is_openapi,
        "openapi_data": openapi_data if is_openapi else None,
        "timestamp": datetime.utcnow().isoformat()
    }

    return analysis

# --- Routes ---
@api_bp.route("/analyze-api", methods=["POST", "OPTIONS"])
def analyze_api():
    """Analyze API documentation for URLs, endpoints, auth requirements, etc."""
    if request.method == "OPTIONS":
        return '', 204

    try:
        payload = request.get_json(force=True)
        doc = payload.get("doc", "").strip()
        
        if not doc:
            return jsonify({"error": "Missing API documentation"}), 400

        analysis = analyze_api_doc(doc)
        return jsonify(analysis), 200

    except Exception as e:
        print(f"Error in /analyze-api endpoint: {e}")
        import traceback
        print(f"Full traceback: {traceback.format_exc()}")
        return jsonify({'error': f'Failed to analyze API documentation: {str(e)}'}), 500

@api_bp.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "healthy",
        "message": "Flask server is running",
        "timestamp": datetime.now().isoformat()
    })

@api_bp.route("/routes", methods=["GET"])
def routes_list():
    return jsonify({
        "routes": ["/health", "/routes", "/ask", "/cors-test"]
    })

@api_bp.route("/cors-test", methods=["GET", "POST", "OPTIONS"])
def cors_test():
    """Simple endpoint to test CORS configuration"""
    if request.method == "OPTIONS":
        return '', 204
    return jsonify({
        "message": "CORS test successful",
        "method": request.method,
        "origin": request.headers.get("Origin", "unknown")
    })

@api_bp.route("/get-api-key", methods=["POST", "OPTIONS"])
def get_api_key():
    if request.method == "OPTIONS":
        return '', 204
        
    try:
        payload = request.get_json(force=True) or {}
        service = payload.get("service", "").strip()
        if not service:
            return jsonify({"error": "Missing 'service' parameter"}), 400
        if service == "anthropic":
            api_key = os.getenv("ANTHROPIC_API_KEY", "")
        elif service == "openweathermap":
            api_key = os.getenv("OPENWEATHERMAP_API_KEY", "")
        else:
            return jsonify({"error": f"Unsupported service: {service}"}), 400
        if not api_key:
            return jsonify({"error": f"API key not configured for {service}"}), 404
        return jsonify({"api_key": api_key}), 200
    except Exception as e:
        return jsonify({"error": "GET_API_KEY_FAILED", "details": str(e)}), 500

@api_bp.route("/ask", methods=["POST", "OPTIONS"])
@limiter.limit("100 per minute", methods=["POST"])  # Only apply rate limit to POST
def ask():
    """Handle /ask endpoint for both OPTIONS and POST requests"""
    # CORS is now handled by Flask-CORS in app.py - no manual handling needed
    if request.method == "OPTIONS":
        return '', 204
    try:
        if not ANTHROPIC_API_KEY:
            return jsonify({
                "error": "ASK_FAILED",
                "details": "Anthropic API key is not configured."
            }), 500

        payload = request.get_json(force=True) or {}
        doc = (payload.get("doc") or "").strip()
        question = (payload.get("question") or "").strip()
        hint = payload.get("provider_hint")
        base_url = None
        if isinstance(hint, dict):
            base_url = hint.get("baseUrl")
            hint = hint.get("apiName", "").strip()
        else:
            hint = (hint or "").strip()

        print(f"🔍 Debug: Question: {question[:100]}... | Doc length: {len(doc)} | Hint: {hint}")

        if not question:
            return jsonify({"error": "Missing 'question'"}), 400

        # --- NEW: direct parse for OpenAPI specs ---
        if doc and _is_openapi_spec(doc):
            print("✅ Detected OpenAPI/Swagger JSON")
            return jsonify(_parse_openapi_spec(doc)), 200

        # quota checks (same as before)
        user_id = request.headers.get("X-User-Id", "")
        try:
            check_and_decrement(supabase_manager, user_id or "anonymous", usage="convert")
        except ValueError as e:
            return jsonify({"error": str(e)}), 402

        # Get current date and time for context
        current_date = datetime.now().strftime("%Y-%m-%d")
        current_datetime = datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC")
        print(f"DEBUG: Current date/time: {current_datetime}")

        # System prompt for consistent behavior
        system_prompt = (
    "You are a world-class API expert and senior software engineer, specializing in designing, "
    "debugging, and optimizing API requests and integrations. "
    "Always generate exactly three complete, production-ready, and runnable code examples for the same request: "
    "1. JavaScript (fetch), 2. Python (requests), 3. cURL. "
    "Ensure 1:1 alignment across all three examples: HTTP method, URL, headers, query parameters, path variables, "
    "and JSON body must be identical. "
    "Follow Postman-style request structure exactly, including HTTP method, URL, headers, and body formatting. "
    "Include all required parameters, headers, and authentication fields as specified in the provided API documentation. "
    "Always include 'Content-Type': 'application/json' in all examples when applicable. "
    "Use placeholders like YOUR_API_KEY with a comment to replace them. "
    "For POST/PUT/PATCH requests, include a sample JSON body based on the documentation. "
    "In JavaScript, always define variables for any parameters, keys, or payload fields at the top, "
    "and always use fetch with an explicit configuration object, never omitting the headers block, "
    "and without adding 'if (!response.ok)' checks that throw before parsing JSON. "
    "Always parse .json() first and use .catch() for error handling. "
    "In Python, always use the requests library with the same headers and JSON payload if applicable. "
    "In cURL, always include the correct -H headers and -d payload when needed. "
    f"Current date: {current_date}. Current date and time: {current_datetime}. "
    "When users reference relative dates such as 'today', 'tomorrow', or 'yesterday', "
    "use the provided current date as the reference. "
    "Always follow best practices for API authentication, security, and efficiency. "
    "Output must be in the following format with no extra explanations: "
    "```javascript\n// JavaScript code here\n```\n"
    "```python\n# Python code here\n```\n"
    "```bash\n# cURL command here\n```"
        )


        
        # Call Anthropic Claude API using the template structure
        model_name = os.getenv("LLM_MODEL", "claude-sonnet-4-5-20250929")
        print(f"DEBUG: Calling Anthropic API with model: {model_name}")
        print(f"DEBUG: System prompt length: {len(system_prompt)} chars")
        print(f"DEBUG: User question length: {len(question)} chars")
        
        # Get API configuration and user's question from request
        api_config = None
        if isinstance(payload.get('provider_hint'), dict):
            api_config = payload['provider_hint']
        
        # First analyze the API documentation
        api_analysis = analyze_api_doc(doc)
        print(f"🔍 API Analysis Results:", api_analysis)

        # Clean and escape the user's question for use in code examples
        cleaned_question = question.replace('"', '\\"').replace('\n', ' ').strip()
        
        # Generate dynamic system prompt with API analysis results
        dynamic_prompt = generate_system_prompt(api_config, cleaned_question, api_analysis)
        print(f"📝 Generated System Prompt:", dynamic_prompt)
        
        # Use enhanced prompt in the request
        message = client.messages.create(
            model=model_name,
            max_tokens=1024,
            system=dynamic_prompt,
            messages=[
                {"role": "user", "content": question}
            ]
        )
        
        # Keep OpenAI code commented for easy revert
        # response = openai_client.chat.completions.create(
        #     model="gpt-4o-mini",
        #     messages=[
        #         {"role": "system", "content": system_prompt},
        #         {"role": "user", "content": question}
        #     ],
        #     max_completion_tokens=2000,  
        # )
        
        print(f"DEBUG: Anthropic API call successful")
        print(f"DEBUG: Response model: {message.model}")
        # Use safe printing for debug output
        try:
            print(f"DEBUG: Message object: {message}")
        except UnicodeEncodeError:
            print("DEBUG: Message object: [Unicode encoding error - response received successfully]")
        
        # Extract answer from Anthropic response using template structure
        answer = ""
        if hasattr(message, 'content') and message.content:
            # Anthropic returns content as a list of message blocks
            if isinstance(message.content, list) and len(message.content) > 0:
                # Get the text from the first content block
                answer = message.content[0].text
                print(f"DEBUG: Extracted answer from content block")
            else:
                print("DEBUG: No content blocks in response!")
        else:
            print("DEBUG: No content in response!")
            
        if answer is None:
            print("DEBUG: Answer is None!")
            answer = ""
        elif answer == "":
            print("DEBUG: Answer is empty string!")
            
        # Check stop reason (Anthropic's equivalent to finish_reason)
        stop_reason = getattr(message, 'stop_reason', 'unknown')
        print(f"DEBUG: Stop reason: {stop_reason}")
            
        print(f"DEBUG: Answer length: {len(answer)} chars")
        
        # Keep OpenAI response handling commented for easy revert
        # if not response.choices or len(response.choices) == 0:
        #     print("DEBUG: No choices in response!")
        #     answer = ""
        # else:
        #     answer = response.choices[0].message.content
        #     finish_reason = getattr(response.choices[0], 'finish_reason', 'unknown')
        #     print(f"DEBUG: Finish reason: {finish_reason}")
        if len(answer) > 0:
            try:
                print(f"DEBUG: First 100 chars of answer: {answer[:100]}...")
            except UnicodeEncodeError:
                print("DEBUG: Answer contains Unicode characters that cannot be printed")
        
        # Extract usage information for Anthropic using template structure
        usage_info = {}
        if hasattr(message, 'usage') and message.usage:
            usage_info = {
                'prompt_tokens': getattr(message.usage, 'input_tokens', 0),
                'completion_tokens': getattr(message.usage, 'output_tokens', 0),
                'total_tokens': getattr(message.usage, 'input_tokens', 0) + getattr(message.usage, 'output_tokens', 0)
            }
        
        return jsonify({
            'answer': answer,
            'model': message.model if hasattr(message, 'model') else model_name,
            'usage': usage_info
        })
        
        # Keep OpenAI usage extraction commented for easy revert
        # usage_info = {}
        # if hasattr(response, 'usage') and response.usage:
        #     usage_info = {
        #         'prompt_tokens': getattr(response.usage, 'prompt_tokens', 0),
        #         'completion_tokens': getattr(response.usage, 'completion_tokens', 0),
        #         'total_tokens': getattr(response.usage, 'total_tokens', 0)
        #     }
        
    except Exception as e:
        print(f"Error in /ask endpoint: {e}")
        # Log more details for debugging
        import traceback
        print(f"Full traceback: {traceback.format_exc()}")
        return jsonify({'error': f'Failed to process request: {str(e)}'}), 500

