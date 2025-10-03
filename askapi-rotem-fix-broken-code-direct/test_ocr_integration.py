#!/usr/bin/env python3
"""
Test script for OCR integration with the backend
"""

import requests
import os

def test_ocr_endpoint():
    """
    Test the OCR endpoint with a sample image
    """
    print("🧪 Testing OCR endpoint integration")
    print("=" * 50)
    
    # Check if backend is running
    backend_url = "https://askapi-tuir.onrender.com"
    
    try:
        # Test backend health
        response = requests.get(f"{backend_url}/")
        if response.status_code == 200:
            print("✅ Backend is running")
        else:
            print(f"❌ Backend health check failed: {response.status_code}")
            return
    except Exception as e:
        print(f"❌ Cannot connect to backend: {e}")
        return
    
    # Test with a sample image if it exists
    test_images = ['sample.jpg', 'test.png', 'image.jpg', 'bookimage.png']
    
    for image_file in test_images:
        if os.path.exists(image_file):
            print(f"\n🔍 Testing OCR with file: {image_file}")
            print("-" * 30)
            
            try:
                with open(image_file, 'rb') as f:
                    files = {'image': f}
                    response = requests.post(f"{backend_url}/ocr", files=files)
                
                if response.status_code == 200:
                    result = response.json()
                    if result.get('success'):
                        text = result.get('text', '')
                        print(f"✅ OCR successful! Extracted {len(text)} characters")
                        print(f"📄 First 100 characters: {text[:100]}...")
                    else:
                        print(f"❌ OCR failed: {result.get('error', 'Unknown error')}")
                else:
                    print(f"❌ HTTP error: {response.status_code}")
                    print(f"Response: {response.text}")
                    
            except Exception as e:
                print(f"❌ Error testing OCR: {e}")
            
            break
    else:
        print("\n⚠️ No test images found")
        print("Please add an image file to test the OCR functionality")

if __name__ == "__main__":
    test_ocr_endpoint() 