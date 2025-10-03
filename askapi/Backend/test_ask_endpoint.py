#!/usr/bin/env python3
"""
Test script for the ask endpoint to verify the analysis request fix
"""

import requests
import json

def test_analysis_request():
    """Test the ask endpoint with an analysis request"""
    
    url = "http://localhost:5000/ask"
    
    # Test data that should trigger analysis mode
    test_data = {
        "question": "You are Claude, an expert in API documentation analysis. From the following extracted lines, return ONLY the essential parts: API endpoints, parameters, authentication, headers, request/response bodies, status codes, and key usage instructions.",
        "doc": "This is a test API documentation for testing purposes."
    }
    
    headers = {
        "Content-Type": "application/json",
        "X-User-Id": ""  # Anonymous user
    }
    
    try:
        print("🔍 Testing analysis request to /ask endpoint...")
        print(f"URL: {url}")
        print(f"Data: {json.dumps(test_data, indent=2)}")
        print(f"Headers: {headers}")
        
        response = requests.post(url, json=test_data, headers=headers)
        
        print(f"\n📊 Response Status: {response.status_code}")
        print(f"📊 Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            response_data = response.json()
            print(f"✅ Success! Response: {json.dumps(response_data, indent=2)}")
            
            # Check if it's the expected format for analysis requests
            if "answer" in response_data:
                print("✅ Analysis request format detected - fix is working!")
            else:
                print("⚠️ Unexpected response format")
                
        else:
            print(f"❌ Error response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection failed - make sure the backend is running on http://localhost:5000")
    except Exception as e:
        print(f"❌ Test failed with error: {e}")

if __name__ == "__main__":
    test_analysis_request()
