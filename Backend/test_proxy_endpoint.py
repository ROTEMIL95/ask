"""
Test script to verify proxy-api endpoint is working
"""
import requests
import json

def test_proxy_api():
    """Test the proxy-api endpoint with a simple request"""
    
    backend_url = "http://localhost:5000"
    
    # Test 1: Simple GET request to a public API
    print("=" * 60)
    print("TEST 1: Simple GET request to httpbin.org")
    print("=" * 60)
    
    test_data = {
        "url": "https://httpbin.org/get",
        "method": "GET",
        "headers": {},
        "body": None
    }
    
    try:
        response = requests.post(
            f"{backend_url}/proxy-api",
            json=test_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        print()
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        print()
    
    # Test 2: POST request to Anthropic API
    print("=" * 60)
    print("TEST 2: POST request to Anthropic API")
    print("=" * 60)
    
    test_data = {
        "url": "https://api.anthropic.com/v1/messages",
        "method": "POST",
        "headers": {
            "Content-Type": "application/json",
            "x-api-key": "YOUR_API_KEY",
            "anthropic-version": "2023-06-01"
        },
        "body": {
            "model": "claude-sonnet-4-5-20250929",
            "max_tokens": 100,
            "messages": [
                {
                    "role": "user",
                    "content": "Say hello in one word"
                }
            ]
        }
    }
    
    try:
        response = requests.post(
            f"{backend_url}/proxy-api",
            json=test_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        print()
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        print()
    
    # Test 3: Blocked URL (localhost)
    print("=" * 60)
    print("TEST 3: Blocked URL (localhost) - Should fail in production")
    print("=" * 60)
    
    test_data = {
        "url": "http://localhost:8080/api",
        "method": "GET",
        "headers": {},
        "body": None
    }
    
    try:
        response = requests.post(
            f"{backend_url}/proxy-api",
            json=test_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        print()
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        print()

if __name__ == "__main__":
    print("\n" + "="*60)
    print("Testing /proxy-api endpoint")
    print("="*60 + "\n")
    test_proxy_api()
    print("\nTests completed\n")

