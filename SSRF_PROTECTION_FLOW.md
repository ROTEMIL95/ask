# SSRF Protection Flow - Complete Documentation

## Overview
This document describes the complete Server-Side Request Forgery (SSRF) protection flow in TalkAPI, from when a user clicks "Run this API Request" to when the request is validated or blocked.

---

## Flow Diagram

```
User clicks "Run API Request" (Frontend)
    ↓
Frontend: parseGeneratedCode() - Extract URL, method, headers, body
    ↓
Frontend: validateApiUrl() - Basic URL validation
    ↓
Frontend: proxyApiCall() - Send to backend proxy
    ↓
Backend: /proxy-api endpoint receives request
    ↓
Backend: SSRF Protection validation
    ↓
[PASS] → Forward to target API → Return response
[FAIL] → Return 403 Forbidden with error details
```

---

## Step-by-Step Flow

### 1. Frontend: User Clicks "Run this API Request"
**File:** `Frontend/src/pages/Home.jsx`
**Function:** `handleRunApiCall()`

```javascript
// Line ~1877
const handleRunApiCall = async () => {
    setIsExecuting(true);
    
    // Step 1: Parse the generated code
    const currentCode = generatedCode[selectedLanguage];
    let parsedCode;
    
    if (selectedLanguage === 'javascript') {
        parsedCode = parseGeneratedCode(currentCode);
    } else if (selectedLanguage === 'python') {
        parsedCode = parsePythonCode(currentCode);
    } else if (selectedLanguage === 'curl') {
        parsedCode = parseCurlCode(currentCode);
    }
    
    // parsedCode contains: { url, method, headers, body }
}
```

**Output:** `{ url, method, headers, body }`

---

### 2. Frontend: Parse Generated Code
**File:** `Frontend/src/pages/Home.jsx`
**Function:** `parseGeneratedCode(code)`

```javascript
// Line ~900
const parseGeneratedCode = (code) => {
    try {
        // Extract URL from fetch() call
        const urlMatch = code.match(/fetch\s*\(\s*['"`]([^'"`]+)['"`]/);
        let url = urlMatch ? urlMatch[1] : null;
        
        // Extract method
        const methodMatch = code.match(/method:\s*['"`](\w+)['"`]/);
        const method = methodMatch ? methodMatch[1].toUpperCase() : 'POST';
        
        // Extract headers
        const headersMatch = code.match(/headers:\s*\{([^}]+)\}/s);
        let headers = {};
        if (headersMatch) {
            const headerContent = headersMatch[1];
            const headerLines = headerContent.split(',');
            headerLines.forEach(line => {
                const match = line.match(/['"`]([^'"`]+)['"`]:\s*['"`]([^'"`]+)['"`]/);
                if (match) {
                    headers[match[1]] = match[2];
                }
            });
        }
        
        // Extract body
        const bodyMatch = code.match(/body:\s*JSON\.stringify\((\{[\s\S]*?\})\)/);
        let body = null;
        if (bodyMatch) {
            try {
                body = JSON.parse(bodyMatch[1]);
            } catch (e) {
                body = bodyMatch[1];
            }
        }
        
        return { url, method, headers, body, originalCode: code };
    } catch (e) {
        console.error('Error parsing generated code:', e);
        return null;
    }
};
```

**Output:** Structured request object with URL, method, headers, and body

---

### 3. Frontend: Validate URL
**File:** `Frontend/src/pages/Home.jsx`
**Function:** `validateApiUrl(url)`

```javascript
// Basic validation before sending to backend
const validateApiUrl = (url) => {
    if (!url) return { valid: false, error: 'URL is required' };
    
    // Check for valid protocol
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return { valid: false, error: 'URL must start with http:// or https://' };
    }
    
    return { valid: true };
};
```

---

### 4. Frontend: Call Backend Proxy
**File:** `Frontend/src/api/proxyApi.jsx`
**Function:** `proxyApiCall(requestData)`

```javascript
// Line ~123
export const proxyApiCall = async (requestData) => {
    try {
        const response = await fetch(`${BACKEND_URL}/proxy-api`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
        });
        
        // requestData = { url, method, headers, body }
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        throw error;
    }
};
```

**Request to Backend:**
```json
POST /proxy-api
Content-Type: application/json

{
    "url": "https://api.anthropic.com/v1/messages",
    "method": "POST",
    "headers": {
        "Content-Type": "application/json",
        "x-api-key": "YOUR_API_KEY",
        "anthropic-version": "2023-06-01"
    },
    "body": {
        "model": "claude-sonnet-4-5-20250929",
        "max_tokens": 1000,
        "messages": [...]
    }
}
```

---

### 5. Backend: Receive Request at /proxy-api
**File:** `Backend/routes/proxy_routes.py`
**Function:** `proxy_api()`
**Line:** 76

```python
@proxy_bp.route('/proxy-api', methods=['POST', 'OPTIONS'])
@limiter.limit("100 per minute")
def proxy_api():
    # Handle CORS preflight
    if request.method == 'OPTIONS':
        return ('', 204)
    
    # Parse request
    data = request.get_json()
    print(f"🔍 Proxy request received:")
    print(f"🔍 Request data: {data}")
    
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
```

---

### 6. Backend: SSRF Protection Validation
**File:** `Backend/routes/proxy_routes.py`
**Lines:** 114-146

```python
    # Check if in development mode
    import os
    flask_env = os.getenv('FLASK_ENV')
    flask_debug = os.getenv('FLASK_DEBUG')
    is_dev_mode = flask_env == 'development' or flask_debug == '1'
    
    print(f"🔍 Environment check:")
    print(f"   FLASK_ENV: {flask_env}")
    print(f"   FLASK_DEBUG: {flask_debug}")
    print(f"   is_dev_mode: {is_dev_mode}")
    
    # Call SSRF protection function
    url_safe, url_message = is_safe_url(url)
    print(f"🔍 URL safety check result: safe={url_safe}, message={url_message}")
    
    # Check if URL is localhost
    is_localhost_url = any(host in url.lower() for host in ['localhost', '127.0.0.1', '0.0.0.0'])
    print(f"🔍 Is localhost URL: {is_localhost_url}")
    
    # Decision point
    if not url_safe:
        # Special case: Allow localhost in dev mode
        if is_localhost_url and is_dev_mode:
            print(f"⚠️ DEVELOPMENT MODE: Allowing localhost URL: {url}")
        else:
            # BLOCK THE REQUEST
            print(f"🚫 Blocked unsafe URL: {url} - Reason: {url_message}")
            print(f"🚫 Dev mode: {is_dev_mode}, Localhost: {is_localhost_url}")
            return jsonify({
                'error': 'URL blocked for security reasons',
                'details': url_message,
                'suggestion': 'Ensure you are not trying to access localhost, private networks, or metadata services'
            }), 403
    
    print(f"✅ URL security check passed: {url}")
```

---

### 7. Backend: SSRF Protection Logic
**File:** `Backend/utils/security.py`
**Class:** `SSRFProtection`
**Method:** `is_safe_url(url)`

#### 7.1 Blocked Hostnames
```python
DANGEROUS_HOSTS = [
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    '[::1]',
    '::1',
    '169.254.169.254',      # AWS EC2 metadata
    'metadata.google.internal',  # GCP metadata
    'metadata',
    'metadata.azure.com',   # Azure metadata
]
```

#### 7.2 Private IP Patterns (Blocked)
```python
PRIVATE_IP_PATTERNS = [
    r'^10\.',                          # 10.0.0.0/8
    r'^172\.(1[6-9]|2[0-9]|3[01])\.',  # 172.16.0.0/12
    r'^192\.168\.',                     # 192.168.0.0/16
    r'^fc00:',                          # IPv6 unique local
    r'^fe80:',                          # IPv6 link-local
    r'^::1$',                           # IPv6 loopback
    r'^0\.0\.0\.0',
    r'^127\.',                          # All 127.x.x.x
]
```

#### 7.3 Validation Steps
```python
@classmethod
def is_safe_url(cls, url: str) -> Tuple[bool, str]:
    # Step 1: Check if URL exists
    if not url:
        return False, "URL is required"
    
    # Step 2: Protocol validation
    if not url.startswith(('http://', 'https://')):
        return False, "Only HTTP and HTTPS protocols are allowed"
    
    # Step 3: Parse URL
    try:
        parsed = urlparse(url)
    except Exception as e:
        return False, f"Invalid URL format: {str(e)}"
    
    hostname = (parsed.hostname or '').lower()
    
    if not hostname:
        return False, "URL must contain a valid hostname"
    
    # Step 4: Check dangerous hostnames (exact match)
    if hostname in cls.DANGEROUS_HOSTS:
        return False, f"Access to {hostname} is blocked for security reasons"
    
    # Step 5: Check for localhost variants (substring match)
    if 'localhost' in hostname:
        return False, "Access to localhost is blocked for security reasons"
    
    # Step 6: Check for metadata services
    metadata_keywords = ['metadata', 'meta-data', 'instance-data']
    if any(keyword in hostname for keyword in metadata_keywords):
        return False, "Access to metadata services is blocked for security reasons"
    
    # Step 7: Check for private IP addresses (regex patterns)
    for pattern in cls.PRIVATE_IP_PATTERNS:
        if re.match(pattern, hostname):
            return False, f"Access to private IP addresses is blocked for security reasons"
    
    # Step 8: Check for obfuscated IP addresses
    suspicious_patterns = [
        r'^0x7f',           # Hex: 0x7f000001 = 127.0.0.1
        r'^0177',           # Octal: 0177.0.0.1 = 127.0.0.1
        r'^2130706433',     # Decimal: 2130706433 = 127.0.0.1
    ]
    for pattern in suspicious_patterns:
        if re.match(pattern, hostname):
            return False, "Suspicious IP address format blocked"
    
    # Step 9: Check for DNS rebinding (too many octets)
    if hostname.count('.') > 3 and hostname.replace('.', '').isdigit():
        return False, "Invalid IP address format"
    
    # URL is safe!
    return True, "URL passed security validation"
```

---

## SSRF Block Examples

### Example 1: Localhost Block
```
Input:  http://localhost:5000/api/endpoint
Result: BLOCKED
Reason: "Access to localhost is blocked for security reasons"
Code:   403

Exception: In development mode (FLASK_DEBUG=1), localhost is ALLOWED
```

### Example 2: Private IP Block
```
Input:  http://192.168.1.100/admin
Result: BLOCKED
Reason: "Access to private IP addresses is blocked for security reasons"
Code:   403
```

### Example 3: Metadata Service Block
```
Input:  http://169.254.169.254/latest/meta-data/
Result: BLOCKED
Reason: "Access to 169.254.169.254 is blocked for security reasons"
Code:   403
```

### Example 4: Obfuscated Localhost Block
```
Input:  http://0x7f000001/
Result: BLOCKED
Reason: "Suspicious IP address format blocked"
Code:   403
```

### Example 5: Valid Public API (Allowed)
```
Input:  https://api.anthropic.com/v1/messages
Result: ALLOWED
Reason: "URL passed security validation"
Code:   200 (forwards request)
```

---

## Development Mode Exception

When running in development mode:
- **FLASK_ENV=development** OR **FLASK_DEBUG=1**
- Localhost URLs (`localhost`, `127.0.0.1`, `0.0.0.0`) are **ALLOWED**
- Private IPs are still **BLOCKED**
- Metadata services are still **BLOCKED**

```python
is_dev_mode = flask_env == 'development' or flask_debug == '1'

if not url_safe:
    if is_localhost_url and is_dev_mode:
        print(f"⚠️ DEVELOPMENT MODE: Allowing localhost URL: {url}")
        # Continue with request
    else:
        return 403  # Block request
```

---

## Error Response Format

When a URL is blocked, the backend returns:

```json
{
    "error": "URL blocked for security reasons",
    "details": "Access to localhost is blocked for security reasons",
    "suggestion": "Ensure you are not trying to access localhost, private networks, or metadata services"
}
```

Status Code: **403 Forbidden**

---

## Debugging SSRF Blocks

To debug SSRF blocks, check the Flask server logs for:

```
🔍 Proxy request received:
🔍 Request data: {...}
🔍 Target URL: http://localhost:5000
🔍 Method: POST
🔍 Headers: ['Content-Type', 'x-api-key']
🔍 Body type: dict
🔍 Environment check:
   FLASK_ENV: development
   FLASK_DEBUG: 1
   is_dev_mode: True
🔍 URL safety check result: safe=False, message=Access to localhost is blocked for security reasons
🔍 Is localhost URL: True
⚠️ DEVELOPMENT MODE: Allowing localhost URL: http://localhost:5000
✅ URL security check passed: http://localhost:5000
```

---

## Security Considerations

### Why Block These URLs?

1. **Localhost/127.0.0.1**: Prevents attackers from accessing internal services running on the server
2. **Private IPs (10.x, 192.168.x, 172.16-31.x)**: Prevents access to internal network resources
3. **Metadata Services (169.254.169.254)**: Prevents stealing cloud credentials (AWS, GCP, Azure)
4. **Obfuscated IPs**: Prevents bypassing filters using hex/octal/decimal notation

### Production vs Development

- **Production**: Strict blocking, no exceptions
- **Development**: Localhost allowed for testing, but still blocks private IPs and metadata services

---

## Related Files

1. **Frontend**:
   - `Frontend/src/pages/Home.jsx` - parseGeneratedCode(), validateApiUrl(), handleRunApiCall()
   - `Frontend/src/api/proxyApi.jsx` - proxyApiCall()

2. **Backend**:
   - `Backend/routes/proxy_routes.py` - /proxy-api endpoint
   - `Backend/utils/security.py` - SSRFProtection class, is_safe_url()

3. **Configuration**:
   - `Backend/config.py` - Environment variables
   - `Backend/.env` - FLASK_ENV, FLASK_DEBUG settings

---

## Summary

The SSRF protection flow consists of:
1. Frontend parses generated code → extracts URL
2. Frontend sends request to `/proxy-api`
3. Backend validates URL using SSRFProtection.is_safe_url()
4. If unsafe: Return 403 with error details
5. If safe OR (localhost + dev mode): Forward request to target API
6. Return API response to frontend

This multi-layer approach ensures that TalkAPI cannot be used to attack internal services or steal cloud credentials while still allowing legitimate API calls to public services.

