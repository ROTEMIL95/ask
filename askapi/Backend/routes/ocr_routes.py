"""
OCR Routes - Image processing and OCR functionality
"""
from flask import Blueprint, request, jsonify
from limiter_config import get_limiter

# Create blueprint
ocr_bp = Blueprint('ocr', __name__)

# Get limiter instance
limiter = get_limiter(None)  # Will be configured in main app

# Global vision client (will be set from main app)
vision_client = None

def set_vision_client(client):
    """Set the vision client from main app"""
    global vision_client
    vision_client = client

def process_ocr_image(image_data):
    """
    OCR functionality using Google Cloud Vision API with API-focused filtering
    """
    global vision_client
    
    if vision_client is None:
        return {
            "success": False,
            "error": "Google Cloud Vision API is not configured. Please set up the gcloud-key.json file in the root directory."
        }
    
    try:
        print(f"🔍 OCR Debug: Starting OCR processing with Google Cloud Vision API")
        
        from google.cloud import vision
        import re
        
        # API-related keywords to search for (case-insensitive)
        api_keywords = [
            "authentication", "authorization", "token", "API key", "endpoint", 
            "base URL", "GET", "POST", "PUT", "DELETE", "parameters", "response", 
            "status code", "example", "error", "request", "header", "body"
        ]
        
        # Extended API-related patterns for filtering
        api_patterns = [
            r'\b(GET|POST|PUT|DELETE|PATCH)\b',  # HTTP methods
            r'curl',  # curl commands
            r'api|url|http|https',  # API/URL terms
            r'endpoint|parameter|request|response',  # API concepts
            r'status|code|error|success|fail',  # Status codes
            r'json|xml|format|type',  # Data formats
            r'header|body|content-type',  # Request/response parts
            r'example|usage|documentation',  # Documentation terms
            r'[{}()[\]<>]',  # Code brackets
            r'["\']\w+["\']\s*:',  # JSON-like structures
        ]
        
        # Create image object
        image = vision.Image(content=image_data)
        
        # Perform text detection
        response = vision_client.text_detection(image=image)
        texts = response.text_annotations
        
        if response.error.message:
            print(f"❌ OCR Debug: Google Cloud Vision API error: {response.error.message}")
            return {
                "success": False,
                "error": f"OCR processing failed: {response.error.message}"
            }
        
        if texts:
            # The first text annotation contains all detected text
            all_text = texts[0].description
            print(f"✅ OCR Debug: Text extracted successfully, length: {len(all_text)}")
            print(f"🔍 OCR Debug: First 200 characters: {all_text[:200]}...")
            
            # Filter text to focus on API documentation
            lines = all_text.split('\n')
            filtered_lines = []
            highlighted_lines = []
            total_lines = len(lines)
            kept_lines = 0
            
            print(f"🔍 OCR Debug: Processing {total_lines} lines for API content...")
            
            for line_num, line in enumerate(lines):
                line = line.strip()
                
                # Skip empty lines
                if not line:
                    continue
                
                # Skip very short lines (less than 10 characters)
                if len(line) < 10:
                    continue
                
                # Check if line contains API-related content
                line_lower = line.lower()
                is_api_related = False
                
                # Check API keywords
                for keyword in api_keywords:
                    if keyword.lower() in line_lower:
                        is_api_related = True
                        break
                
                # Check API patterns
                if not is_api_related:
                    for pattern in api_patterns:
                        if re.search(pattern, line, re.IGNORECASE):
                            is_api_related = True
                            break
                
                # If line is API-related, keep it
                if is_api_related:
                    filtered_lines.append(line)
                    kept_lines += 1
                    print(f"  ✅ KEPT: '{line[:100]}...'")
                    
                    # Add to highlights if it contains API keywords
                    for keyword in api_keywords:
                        if keyword.lower() in line_lower:
                            highlighted_line = f"Line {line_num + 1}: {line}"
                            if highlighted_line not in highlighted_lines:
                                highlighted_lines.append(highlighted_line)
                            break
                else:
                    print(f"  ❌ FILTERED: '{line[:100]}...'")
            
            # Combine filtered lines
            filtered_text = '\n'.join(filtered_lines)
            
            print(f"✅ OCR Debug: Text filtering successful")
            print(f"🔍 OCR Debug: Total lines processed: {total_lines}")
            print(f"🔍 OCR Debug: Lines kept: {kept_lines}")
            print(f"🔍 OCR Debug: Filtering ratio: {kept_lines}/{total_lines} = {kept_lines/total_lines*100:.1f}%")
            print(f"🔍 OCR Debug: Filtered text length: {len(filtered_text)} characters")
            print(f"🔍 OCR Debug: Found {len(highlighted_lines)} highlighted lines with API keywords")
            
            if filtered_text.strip():
                return {
                    "success": True,
                    "text": filtered_text.strip(),
                    "highlights": highlighted_lines,
                    "filtering_stats": {
                        "total_lines": total_lines,
                        "kept_lines": kept_lines,
                        "filtering_ratio": f"{kept_lines/total_lines*100:.1f}%"
                    }
                }
            else:
                return {
                    "success": False,
                    "error": "No API-related content could be extracted from the image. Please try with a clearer image or upload a PDF file instead."
                }
        else:
            print(f"❌ OCR Debug: No text found in image")
            return {
                "success": False,
                "error": "No text could be extracted from the image. Please try with a clearer image or upload a PDF file instead."
            }
            
    except Exception as e:
        print(f"❌ OCR Debug: Exception occurred: {str(e)}")
        return {
            "success": False,
            "error": f"OCR processing failed: {str(e)}. Please check your Google Cloud Vision API setup."
        }

@ocr_bp.route('/ocr', methods=['POST', 'OPTIONS'])
@limiter.limit("10 per minute")
def ocr_endpoint():
    # Handle CORS preflight request
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    """Process uploaded images with OCR"""
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image provided'}), 400
        
        image_file = request.files['image']
        if image_file.filename == '':
            return jsonify({'error': 'No image selected'}), 400
        
        # Read image data
        image_data = image_file.read()
        
        # Process with OCR function
        result = process_ocr_image(image_data)
        
        if result.get('success'):
            # Automatically send the filtered API documentation to Claude for expert analysis
            try:
                print(f"🤖 Sending OCR-extracted API docs to Claude for expert analysis...")
                
                # Import the Anthropic client
                from anthropic import Anthropic
                import os
                
                # Get API key and create client
                anthropic_api_key = os.getenv("ANTHROPIC_API_KEY", "")
                if not anthropic_api_key:
                    print(f"❌ Anthropic API key not configured")
                    return jsonify({
                        'success': False,
                        'error': 'Anthropic API not configured for automatic analysis'
                    }), 500
                
                client = Anthropic(api_key=anthropic_api_key)
                model_name = os.getenv("LLM_MODEL", "claude-3-5-sonnet-latest")
                
                # Create expert system prompt for API documentation analysis
                expert_system_prompt = """You are an expert API documentation analyst and code generator. 

Your task is to analyze the provided API documentation and:
1. Identify the key API endpoints, methods, and parameters
2. Understand the authentication and data flow
3. Generate working code examples in multiple programming languages
4. Provide clear explanations and best practices

CRITICAL: Return ONLY a valid JSON object with this structure:
{
  "analysis": {
    "summary": "Brief overview of the API",
    "endpoints": ["List of main endpoints found"],
    "authentication": "Authentication method used",
    "data_format": "Primary data format (JSON, XML, etc.)"
  },
  "code_examples": {
    "javascript": "Complete JavaScript fetch code",
    "python": "Complete Python requests code", 
    "curl": "Complete cURL command",
    "csharp": "Complete C# HttpClient code",
    "java": "Complete Java HTTP client code",
    "go": "Complete Go HTTP client code"
  },
  "recommendations": [
    "Best practice recommendation 1",
    "Best practice recommendation 2"
  ]
}

Rules:
- Return ONLY the JSON object above
- No markdown, no explanations outside the JSON
- Generate working, runnable code examples
- Focus on the most important endpoints from the documentation"""
                
                # Create user message with the filtered API documentation
                user_message = f"""Please analyze this API documentation extracted from an uploaded file:

{result['text']}

Generate expert analysis and working code examples based on this documentation."""
                
                # Send to Claude
                print(f"📤 Sending to Claude model: {model_name}")
                print(f"📤 System prompt length: {len(expert_system_prompt)}")
                print(f"📤 User message length: {len(user_message)}")
                
                claude_response = client.messages.create(
                    model=model_name,
                    system=expert_system_prompt,
                    max_tokens=4000,
                    temperature=0.1,
                    messages=[{"role": "user", "content": user_message}]
                )
                
                # Extract Claude's response
                claude_text = ""
                for part in claude_response.content:
                    if part.type == "text":
                        claude_text += part.text
                
                print(f"✅ Claude response received: {len(claude_text)} characters")
                
                # Try to parse Claude's JSON response
                try:
                    import json
                    claude_data = json.loads(claude_text)
                    print(f"✅ Successfully parsed Claude's JSON response")
                    
                    # Return Claude's expert analysis
                    return jsonify({
                        'success': True,
                        'message': 'OCR processing completed and sent to Claude for expert analysis',
                        'ocr_result': {
                            'text': result['text'],
                            'highlights': result.get('highlights', []),
                            'filtering_stats': result.get('filtering_stats', {})
                        },
                        'claude_analysis': claude_data,
                        'processing_flow': 'File Upload → OCR → API Filtering → Claude Analysis → Expert Response'
                    })
                    
                except json.JSONDecodeError:
                    print(f"⚠️ Claude response is not valid JSON, returning raw response")
                    return jsonify({
                        'success': True,
                        'message': 'OCR processing completed and sent to Claude for expert analysis',
                        'ocr_result': {
                            'text': result['text'],
                            'highlights': result.get('highlights', []),
                            'filtering_stats': result.get('filtering_stats', {})
                        },
                        'claude_raw_response': claude_text,
                        'processing_flow': 'File Upload → OCR → API Filtering → Claude Analysis → Raw Response'
                    })
                
            except Exception as claude_error:
                print(f"❌ Error sending to Claude: {claude_error}")
                # Fallback: return OCR result without Claude analysis
                return jsonify({
                    'success': True,
                    'text': result['text'],
                    'message': 'OCR processing completed with API-focused filtering (Claude analysis failed)',
                    'highlights': result.get('highlights', []),
                    'filtering_stats': result.get('filtering_stats', {}),
                    'claude_error': str(claude_error)
                })
        else:
            return jsonify({
                'success': False,
                'error': result.get('error', 'OCR processing failed')
            }), 400
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'OCR endpoint error: {str(e)}'
        }), 500