#!/usr/bin/env python3
"""
Simple test to check backend startup
"""

import sys
import os

# Add the Backend directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'Backend'))

try:
    print("🔍 Testing backend imports...")
    
    # Test basic imports
    print("📝 Testing Flask import...")
    from flask import Flask
    print("✅ Flask imported successfully")
    
    print("📝 Testing other imports...")
    from flask_cors import CORS
    from dotenv import load_dotenv
    print("✅ CORS and dotenv imported successfully")
    
    print("📝 Testing Google Cloud imports...")
    from google.cloud import vision
    from google.oauth2 import service_account
    print("✅ Google Cloud imports successful")
    
    print("📝 Testing pdfplumber import...")
    import pdfplumber
    print("✅ pdfplumber imported successfully")
    
    print("📝 Testing app.py import...")
    from Backend.app import app
    print("✅ app.py imported successfully")
    
    print("🎉 All imports successful! Backend should work.")
    
except Exception as e:
    print(f"❌ Import error: {e}")
    print(f"🔍 Error type: {type(e).__name__}")
    import traceback
    traceback.print_exc() 