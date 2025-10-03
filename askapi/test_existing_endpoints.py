#!/usr/bin/env python3
"""
Test script to verify existing endpoints work
"""

import requests
import json

def test_existing_endpoints():
    """Test if the existing /file-to-text and /ocr endpoints are accessible"""
    
    backend_url = "https://askapi-tuir.onrender.com"
    
    print("🧪 Testing existing endpoints")
    print("=" * 50)
    
    # Test 1: Check if /file-to-text endpoint exists
    print("\n📄 Test 1: /file-to-text endpoint")
    print("-" * 30)
    
    try:
        # Create a dummy PDF file for testing
        test_data = b'%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 12 Tf\n72 720 Td\n(Test PDF) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000204 00000 n \ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n297\n%%EOF'
        
        files = {'file': ('test.pdf', test_data, 'application/pdf')}
        response = requests.post(f"{backend_url}/file-to-text", files=files)
        
        print(f"📊 Response Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print("✅ /file-to-text endpoint works")
            print(f"📝 Response: {data}")
        else:
            print(f"❌ /file-to-text endpoint failed")
            print(f"📝 Error: {response.text}")
            
    except Exception as e:
        print(f"❌ Error testing /file-to-text: {str(e)}")
    
    # Test 2: Check if /ocr endpoint exists
    print("\n🖼️ Test 2: /ocr endpoint")
    print("-" * 30)
    
    try:
        # Create a dummy image file for testing
        test_image_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\tpHYs\x00\x00\x0b\x13\x00\x00\x0b\x13\x01\x00\x9a\x9c\x18\x00\x00\x00\x0cIDATx\x9cc```\x00\x00\x00\x04\x00\x01\xf6\x178\x00\x00\x00\x00IEND\xaeB`\x82'
        
        files = {'image': ('test.png', test_image_data, 'image/png')}
        response = requests.post(f"{backend_url}/ocr", files=files)
        
        print(f"📊 Response Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print("✅ /ocr endpoint works")
            print(f"📝 Response: {data}")
        else:
            print(f"❌ /ocr endpoint failed")
            print(f"📝 Error: {response.text}")
            
    except Exception as e:
        print(f"❌ Error testing /ocr: {str(e)}")
    
    print("\n" + "=" * 50)
    print("🧪 Existing endpoints test completed")

if __name__ == "__main__":
    test_existing_endpoints() 