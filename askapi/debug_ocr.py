#!/usr/bin/env python3
"""
Comprehensive OCR Debug Script
Tests the OCR functionality with detailed logging
"""

import requests
import os
import json
import base64
from datetime import datetime

def debug_ocr_endpoint():
    """
    Debug the OCR endpoint with comprehensive logging
    """
    print("🔍 Comprehensive OCR Debug Test")
    print("=" * 60)
    print(f"🕐 Test started at: {datetime.now()}")
    
    # Backend configuration
    backend_url = "https://askapi-tuir.onrender.com"
    ocr_endpoint = f"{backend_url}/ocr"
    
    print(f"🔍 Backend URL: {backend_url}")
    print(f"🔍 OCR Endpoint: {ocr_endpoint}")
    
    # Test 1: Check backend health
    print("\n" + "="*40)
    print("🧪 Test 1: Backend Health Check")
    print("="*40)
    
    try:
        response = requests.get(backend_url, timeout=10)
        print(f"✅ Backend health check: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"🔍 Backend info: {data.get('message', 'Unknown')}")
            print(f"🔍 Available endpoints: {list(data.get('endpoints', {}).keys())}")
        else:
            print(f"❌ Backend health check failed: {response.status_code}")
            return
    except Exception as e:
        print(f"❌ Cannot connect to backend: {e}")
        return
    
    # Test 2: Check for test images
    print("\n" + "="*40)
    print("🧪 Test 2: Image File Check")
    print("="*40)
    
    test_images = ['sample.jpg', 'test.png', 'image.jpg', 'bookimage.png', 'ocr_test.png']
    found_images = []
    
    for image_file in test_images:
        if os.path.exists(image_file):
            file_size = os.path.getsize(image_file)
            print(f"✅ Found image: {image_file} ({file_size} bytes)")
            found_images.append(image_file)
        else:
            print(f"⚠️ Not found: {image_file}")
    
    if not found_images:
        print("❌ No test images found!")
        print("Please add an image file to test OCR functionality")
        return
    
    # Test 3: OCR Processing
    print("\n" + "="*40)
    print("🧪 Test 3: OCR Processing")
    print("="*40)
    
    for image_file in found_images:
        print(f"\n🔍 Testing OCR with: {image_file}")
        print("-" * 30)
        
        try:
            # Read file details
            file_size = os.path.getsize(image_file)
            file_extension = image_file.split('.')[-1].lower()
            
            print(f"📁 File details:")
            print(f"   - Name: {image_file}")
            print(f"   - Size: {file_size} bytes")
            print(f"   - Extension: {file_extension}")
            
            # Prepare request
            with open(image_file, 'rb') as f:
                files = {'image': (image_file, f, f'image/{file_extension}')}
                
                print(f"📤 Sending OCR request...")
                response = requests.post(ocr_endpoint, files=files, timeout=30)
            
            print(f"📥 Response received:")
            print(f"   - Status: {response.status_code}")
            print(f"   - Headers: {dict(response.headers)}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ OCR successful!")
                print(f"   - Success: {result.get('success', False)}")
                print(f"   - Message: {result.get('message', 'N/A')}")
                
                if result.get('success'):
                    text = result.get('text', '')
                    print(f"   - Text length: {len(text)} characters")
                    print(f"   - First 200 chars: {text[:200]}...")
                    
                    # Save extracted text to file
                    output_file = f"ocr_output_{image_file}.txt"
                    with open(output_file, 'w', encoding='utf-8') as f:
                        f.write(text)
                    print(f"   - Text saved to: {output_file}")
                else:
                    print(f"❌ OCR failed: {result.get('error', 'Unknown error')}")
                    
            else:
                print(f"❌ HTTP error: {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   - Error details: {error_data}")
                except:
                    print(f"   - Response text: {response.text[:500]}...")
                    
        except requests.exceptions.Timeout:
            print(f"❌ Request timeout - OCR processing took too long")
        except requests.exceptions.ConnectionError:
            print(f"❌ Connection error - Cannot reach the backend")
        except Exception as e:
            print(f"❌ Unexpected error: {e}")
            print(f"   - Error type: {type(e).__name__}")
    
    # Test 4: Error cases
    print("\n" + "="*40)
    print("🧪 Test 4: Error Case Testing")
    print("="*40)
    
    # Test with invalid file
    print("\n🔍 Testing with invalid file type...")
    try:
        # Create a dummy text file
        with open('test.txt', 'w') as f:
            f.write('This is not an image file')
        
        with open('test.txt', 'rb') as f:
            files = {'image': ('test.txt', f, 'text/plain')}
            response = requests.post(ocr_endpoint, files=files, timeout=10)
        
        print(f"   - Status: {response.status_code}")
        if response.status_code == 400:
            result = response.json()
            print(f"   - Expected error: {result.get('error', 'N/A')}")
        else:
            print(f"   - Unexpected response: {response.status_code}")
            
        # Clean up
        os.remove('test.txt')
        
    except Exception as e:
        print(f"   - Error testing invalid file: {e}")
    
    print("\n" + "="*60)
    print("✅ OCR Debug Test Completed")
    print(f"🕐 Test finished at: {datetime.now()}")
    print("="*60)

if __name__ == "__main__":
    debug_ocr_endpoint() 