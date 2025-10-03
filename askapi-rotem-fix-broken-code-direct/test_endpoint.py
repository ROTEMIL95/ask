#!/usr/bin/env python3
"""
Simple test script to verify the /file-to-text endpoint
"""

import requests
import json

def test_endpoint():
    """Test if the /file-to-text endpoint is accessible"""
    
    # Test URL - change this to your backend URL
    backend_url = "https://askapi-tuir.onrender.com"
    
    print("🧪 Testing /file-to-text endpoint availability")
    print("=" * 50)
    
    try:
        # First, test if the backend is accessible
        print(f"🔍 Testing backend connectivity to: {backend_url}")
        response = requests.get(f"{backend_url}/")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Backend is accessible")
            print(f"📝 Backend message: {data.get('message', 'N/A')}")
            print(f"📝 Available endpoints: {list(data.get('endpoints', {}).keys())}")
            
            # Check if /file-to-text is in the endpoints list
            endpoints = data.get('endpoints', {})
            if 'POST /file-to-text' in endpoints:
                print("✅ /file-to-text endpoint is listed in available endpoints")
            else:
                print("❌ /file-to-text endpoint is NOT listed in available endpoints")
                print("📝 Available endpoints:")
                for endpoint in endpoints:
                    print(f"   - {endpoint}")
        else:
            print(f"❌ Backend not accessible. Status: {response.status_code}")
            print(f"📝 Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error testing backend: {str(e)}")
    
    print("\n" + "=" * 50)
    print("🧪 Endpoint availability test completed")

if __name__ == "__main__":
    test_endpoint() 