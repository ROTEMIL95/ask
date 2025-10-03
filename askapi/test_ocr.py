#!/usr/bin/env python3
"""
Test script for OCR functionality using Google Cloud Vision API
"""

import os
from ocr_service import ocr_image, ocr_image_simple

def test_ocr():
    """
    Test the OCR functionality with a sample image
    """
    print("🧪 Testing OCR with Google Cloud Vision API")
    print("=" * 50)
    
    # Check if credentials file exists
    if not os.path.exists('gcloud-key.json'):
        print("❌ gcloud-key.json file not found!")
        print("Please ensure the file is in the current directory")
        return
    
    print("✅ gcloud-key.json file found")
    
    # Test with a sample image if it exists
    test_images = ['sample.jpg', 'test.png', 'image.jpg', 'bookimage.png']
    
    for image_file in test_images:
        if os.path.exists(image_file):
            print(f"\n🔍 Testing with file: {image_file}")
            print("-" * 30)
            
            # Test document text detection
            print("📄 Testing document text detection:")
            result = ocr_image(image_file)
            
            if result:
                print(f"✅ Success! Detected {len(result)} characters")
            else:
                print("⚠️ No text detected or error occurred")
            
            # Test simple text detection
            print("\n📝 Testing simple text detection:")
            result_simple = ocr_image_simple(image_file)
            
            if result_simple:
                print(f"✅ Success! Detected {len(result_simple)} characters")
            else:
                print("⚠️ No text detected or error occurred")
            
            break
    else:
        print("\n⚠️ No image files found for testing")
        print("Please add an image file (jpg, png) to the directory for testing")

if __name__ == "__main__":
    test_ocr() 