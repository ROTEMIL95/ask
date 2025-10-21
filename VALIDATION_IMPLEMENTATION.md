# API Validation System Implementation

## Overview
Comprehensive validation system for API request configuration and generated code, implementing all requested validation rules with proper error handling and real date calculations.

## Implementation Summary

### 1. Backend Request Validator
**File:** `Backend/validators/api_request_validator.py`

**Features:**
- ✅ **Basic Required Fields**: Validates baseUrl, path, method are mandatory and non-empty
- ✅ **HTTP Method Logic**:
  - GET/DELETE must not include body
  - POST/PUT/PATCH must include valid JSON body
  - HEAD/OPTIONS no body validation
  - Normalizes methods to uppercase
- ✅ **Authentication Rules**:
  - Bearer: requires token
  - Basic: requires username AND password
  - Header: requires headerName AND headerValue
  - None: ensures no auth fields present
  - Rejects multiple auth types
- ✅ **Path Validation**: Detects unresolved placeholders like `{id}`, `{user}`
- ✅ **Query Parameters**: Skips null/undefined/empty values, prevents malformed URLs
- ✅ **URL Normalization**: Prevents `/undefined/`, `/null/`, double slashes
- ✅ **Date Validation**: Enforces YYYY-MM-DD format, validates actual dates
- ✅ **Headers**: Adds defaults (Content-Type, Accept), skips empty values, prevents duplicates

**Error Format:**
```json
{
  "valid": false,
  "errors": [
    {
      "field": "baseUrl",
      "code": "missing_base_url",
      "message": "Base URL is required and cannot be empty, null, or undefined"
    }
  ]
}
```

### 2. Backend Code Output Validator
**File:** `Backend/validators/code_output_validator.py`

**Features:**
- ✅ Checks for "undefined"/"null" in generated URLs
- ✅ Validates date formats in code (YYYY-MM-DD)
- ✅ Verifies proper authentication implementation:
  - JavaScript: btoa() usage
  - Python: base64 encoding
  - cURL: -u flag or Authorization header
- ✅ Detects placeholder URLs (example.com)
- ✅ Ensures required headers present (Content-Type for POST/PUT/PATCH)
- ✅ Validates code block formatting

**Returns:**
```json
{
  "valid": true,
  "errors": [],
  "warnings": [
    {
      "language": "javascript",
      "code": "placeholder_url",
      "message": "Code contains placeholder URL..."
    }
  ]
}
```

### 3. Backend Routes Integration
**File:** `Backend/routes/api_routes.py`

**Critical Changes:**

#### Date Handling Fix (Lines 603-615)
```python
# Get REAL current date and time for context
now = datetime.now()
current_date = now.strftime("%Y-%m-%d")  # 2025-10-20
current_datetime = now.strftime("%Y-%m-%d %H:%M:%S UTC")

# Calculate common relative dates
tomorrow = (now + timedelta(days=1)).strftime("%Y-%m-%d")  # 2025-10-21
next_week = (now + timedelta(days=7)).strftime("%Y-%m-%d")  # 2025-10-27
```

#### Enhanced System Prompt (Lines 617-673)
Added **CRITICAL VALIDATION RULES** section:
1. **DATES**: Must use YYYY-MM-DD, calculate dynamically from current date (2025-10-20)
2. **URLs**: Never use "undefined", "null", or "example.com"
3. **HTTP METHODS**: Enforce body requirements
4. **AUTHENTICATION**: Proper encoding (btoa, base64, -u flag)
5. **TEMPLATE LITERALS**: Only use actual variable names, not URLs

#### Validation Integration (Lines 688-697)
```python
# Validate API request configuration (if provided)
if api_config:
    validation_result = validate_api_request(api_config)
    if not validation_result['valid']:
        return jsonify({
            'error': 'VALIDATION_FAILED',
            'details': 'API request configuration is invalid',
            'validation_errors': validation_result['errors']
        }), 400
```

#### Post-Generation Validation (Lines 777-816)
```python
# Extract code snippets for validation
snippets = {}
if answer:
    for block in re.finditer(r'```(\w+)\n([\s\S]*?)```', answer):
        lang = block.group(1).lower()
        code = block.group(2).strip()
        if lang == 'bash' or lang == 'sh':
            snippets['curl'] = code
        else:
            snippets[lang] = code

# Validate generated code output
code_validation = validate_generated_code(answer, snippets)

# Return validation results
return jsonify({
    'answer': answer,
    'model': model_name,
    'usage': usage_info,
    'validation': {
        'valid': code_validation['valid'],
        'errors': code_validation['errors'],
        'warnings': code_validation['warnings']
    }
})
```

### 4. Frontend Request Validator
**File:** `Frontend/src/validators/apiRequestValidator.jsx`

**Features:**
- ✅ Client-side validation matching backend rules
- ✅ Immediate feedback to users
- ✅ Prevents invalid requests from reaching backend
- ✅ Same validation logic as backend for consistency

**Usage:**
```javascript
import { validateApiRequest } from '@/validators/apiRequestValidator.jsx';

const result = validateApiRequest({
  baseUrl: 'https://api.example.com',
  path: '/users/{id}',  // Will fail - unresolved placeholder
  method: 'GET',
  body: null
});

if (!result.valid) {
  console.error(result.errors);
}
```

### 5. Frontend Component Update
**File:** `Frontend/src/components/ApiDocumentationInput.jsx`

**Changes:**
- ✅ Imported validation function
- ✅ Added `apiConfig` prop for comprehensive validation
- ✅ New `validateApiConfiguration()` method
- ✅ Enhanced error display with detailed error list
- ✅ Visual feedback with AlertCircle icon

**New Props:**
```javascript
apiConfig = null  // Optional API config for comprehensive validation
```

**Error Display:**
```jsx
{validationError && (
    <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Validation Error</AlertTitle>
        <AlertDescription>
            {validationError}
            {validationErrors.length > 0 && (
                <ul className="mt-2 ml-4 list-disc space-y-1">
                    {validationErrors.map((err, idx) => (
                        <li key={idx}>
                            <strong>{err.field}</strong>: {err.message}
                        </li>
                    ))}
                </ul>
            )}
        </AlertDescription>
    </Alert>
)}
```

## Validation Rules Implemented

### ✅ Basic Required Fields
- baseUrl, path, method are mandatory
- Stop execution if missing, empty, "null", or "undefined"

### ✅ HTTP Method Logic
- GET/DELETE → no body
- POST/PUT/PATCH → valid JSON body required
- HEAD/OPTIONS → no validation
- All methods normalized to uppercase

### ✅ Authentication Rules
- bearer → require token
- basic → require username AND password
- header → require headerName AND headerValue
- none → no auth fields present
- Reject multiple auth types

### ✅ Path and Query Validation
- No unresolved placeholders: `{id}`, `{user}`
- Skip null/undefined/empty query params
- Prevent malformed URLs: `/by-id/null`, `/undefined/resource`, `//`
- Ensure baseUrl ends with `/` before appending path

### ✅ Date Validation
- Format: YYYY-MM-DD only
- Reject invalid dates: 2025-13-40, 0000-00-00
- Auto-trim whitespace
- **Real date calculations** from current date (2025-10-20)

### ✅ Headers
- Default headers when missing:
  - `Content-Type: application/json` for POST/PUT/PATCH
  - `Accept: application/json` always
- Skip empty/undefined values
- No duplicate headers
- Custom headers must have non-empty key and value

### ✅ Sanity Checks
- No URLs containing "undefined" or "null"
- No empty/invalid body objects
- No methods/paths with spaces or unsafe characters
- Clear error messages: `missing_base_url`, `invalid_auth_token`, `empty_body_for_post`

### ✅ Best Practices
- Trim all string inputs before validation
- Enforce consistent casing and quoting
- User-friendly feedback
- Never run/render until validation passes

## Date Fix Details

### Problem
Previously, the system used `datetime.now()` but generated hardcoded or incorrect dates in examples.

### Solution
1. **Calculate real dates** at request time:
   - Current: 2025-10-20
   - Tomorrow: 2025-10-21
   - Next week: 2025-10-27

2. **Pass to system prompt** with clear examples:
   ```
   Current date: 2025-10-20 (use this as 'today')
   Tomorrow: 2025-10-21
   Next week: 2025-10-27
   ```

3. **Instructions for dynamic calculation**:
   - JavaScript: `const checkIn = new Date(); checkIn.setDate(checkIn.getDate() + 1);`
   - Python: `from datetime import datetime, timedelta; check_in = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')`
   - cURL: Use actual date strings like "2025-10-21"

## Testing

### Backend Validator Test
```python
from validators.api_request_validator import validate_api_request

result = validate_api_request({
    'baseUrl': 'https://api.example.com',
    'path': '/users',
    'method': 'POST',
    'body': {'name': 'John'},
    'auth': {'type': 'bearer', 'token': 'abc123'}
})

assert result['valid'] == True
```

### Frontend Validator Test
```javascript
import { validateApiRequest } from '@/validators/apiRequestValidator.jsx';

const result = validateApiRequest({
    baseUrl: 'https://api.example.com',
    path: '/users/{id}',  // Should fail
    method: 'GET'
});

console.log(result);
// { valid: false, errors: [...] }
```

## Error Code Reference

| Code | Field | Message |
|------|-------|---------|
| `missing_base_url` | baseUrl | Base URL is required |
| `missing_path` | path | Path is required |
| `missing_method` | method | HTTP method is required |
| `invalid_method` | method | Invalid HTTP method |
| `unexpected_body` | body | GET/DELETE must not include body |
| `missing_body` | body | POST/PUT/PATCH requires body |
| `invalid_json` | body | Body must be valid JSON |
| `missing_bearer_token` | auth.token | Bearer token required |
| `missing_username` | auth.username | Username required for basic auth |
| `missing_password` | auth.password | Password required for basic auth |
| `unresolved_placeholders` | path | Path contains {id}, {user}, etc. |
| `malformed_url` | url | URL contains "undefined" or "null" |
| `invalid_date_format` | [field] | Date must be YYYY-MM-DD |
| `invalid_date_value` | [field] | Invalid date (e.g., month > 12) |

## File Structure

```
Backend/
├── validators/
│   ├── __init__.py
│   ├── api_request_validator.py    ✅ Pre-generation validation
│   └── code_output_validator.py    ✅ Post-generation validation
└── routes/
    └── api_routes.py                ✅ Updated with validators & real dates

Frontend/
└── src/
    ├── validators/
    │   └── apiRequestValidator.jsx   ✅ Client-side validation
    └── components/
        └── ApiDocumentationInput.jsx ✅ Enhanced with validation display
```

## Next Steps

1. **Testing**: Create comprehensive test cases for all validation rules
2. **Documentation**: Update API documentation with validation error codes
3. **Monitoring**: Track validation failures in logs to identify common issues
4. **User Feedback**: Monitor user experience with new validation messages

## Summary

✅ All validation requirements implemented
✅ Real date calculations (2025-10-20) integrated
✅ Three-layer validation: Pre-generation, LLM prompt, Post-generation
✅ Comprehensive error messages with codes
✅ Frontend and backend consistency
✅ User-friendly error display
