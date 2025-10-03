#!/usr/bin/env python3
"""
Test script for the /file-to-text endpoint
Tests both PDF and image file processing
"""

import requests
import os
import sys

def test_file_to_text_endpoint():
    """Test the /file-to-text endpoint with different file types"""
    
    # Backend URL
    backend_url = "http://localhost:5000"  # Change this to your backend URL
    
    print("🧪 Testing /file-to-text endpoint")
    print("=" * 50)
    
    # Test 1: PDF file
    print("\n📄 Test 1: PDF file processing")
    print("-" * 30)
    
    # Check if we have a test PDF file
    test_pdf_path = "test_document.pdf"
    if not os.path.exists(test_pdf_path):
        print(f"❌ Test PDF file not found: {test_pdf_path}")
        print("   Please create a test PDF file or update the path")
    else:
        try:
            with open(test_pdf_path, 'rb') as f:
                files = {'file': (test_pdf_path, f, 'application/pdf')}
                response = requests.post(f"{backend_url}/file-to-text", files=files)
            
            print(f"📊 Response Status: {response.status_code}")
            print(f"📊 Response Headers: {dict(response.headers)}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ PDF processing successful")
                print(f"📝 Extracted text length: {len(data.get('text', ''))} characters")
                print(f"📝 First 200 characters: {data.get('text', '')[:200]}...")
            else:
                print(f"❌ PDF processing failed")
                print(f"📝 Error: {response.text}")
                
        except Exception as e:
            print(f"❌ Error testing PDF: {str(e)}")
    
    # Test 2: Image file
    print("\n🖼️ Test 2: Image file processing")
    print("-" * 30)
    
    # Check if we have a test image file
    test_image_path = "test_image.png"
    if not os.path.exists(test_image_path):
        print(f"❌ Test image file not found: {test_image_path}")
        print("   Please create a test image file or update the path")
    else:
        try:
            with open(test_image_path, 'rb') as f:
                files = {'file': (test_image_path, f, 'image/png')}
                response = requests.post(f"{backend_url}/file-to-text", files=files)
            
            print(f"📊 Response Status: {response.status_code}")
            print(f"📊 Response Headers: {dict(response.headers)}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Image processing successful")
                print(f"📝 Extracted text length: {len(data.get('text', ''))} characters")
                print(f"📝 First 200 characters: {data.get('text', '')[:200]}...")
            else:
                print(f"❌ Image processing failed")
                print(f"📝 Error: {response.text}")
                
        except Exception as e:
            print(f"❌ Error testing image: {str(e)}")
    
    # Test 3: Invalid file type
    print("\n❌ Test 3: Invalid file type")
    print("-" * 30)
    
    try:
        # Create a dummy text file
        test_invalid_path = "test_invalid.txt"
        with open(test_invalid_path, 'w') as f:
            f.write("This is a test file")
        
        with open(test_invalid_path, 'rb') as f:
            files = {'file': (test_invalid_path, f, 'text/plain')}
            response = requests.post(f"{backend_url}/file-to-text", files=files)
        
        print(f"📊 Response Status: {response.status_code}")
        
        if response.status_code == 400:
            data = response.json()
            print(f"✅ Invalid file type correctly rejected")
            print(f"📝 Error message: {data.get('error', '')}")
        else:
            print(f"❌ Invalid file type not properly rejected")
            print(f"📝 Response: {response.text}")
            
        # Clean up
        os.remove(test_invalid_path)
        
    except Exception as e:
        print(f"❌ Error testing invalid file: {str(e)}")
    
    print("\n" + "=" * 50)
    print("🧪 File-to-text endpoint testing completed")

if __name__ == "__main__":
    test_file_to_text_endpoint() 