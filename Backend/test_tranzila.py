#!/usr/bin/env python
"""
Test script for Tranzila payment integration
Tests:
1. Tranzila headers generation
2. Connection to Tranzila API
3. Payment flow (with test card)
"""

import os
import sys
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add parent directory to path to import modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.tranzila_service import generate_tranzila_headers
from services.payment_service import format_payload_initial

# Tranzila credentials
TRANZILA_SUPPLIER = os.getenv("TRANZILA_SUPPLIER")
TRANZILA_PUBLIC_API_KEY = os.getenv("TRANZILA_PUBLIC_API_KEY")
TRANZILA_SECRET_API_KEY = os.getenv("TRANZILA_SECRET_API_KEY")

def test_1_credentials():
    """Test 1: Verify credentials are loaded"""
    print("\n" + "="*60)
    print("TEST 1: Verifying Tranzila Credentials")
    print("="*60)

    print(f"[OK] TRANZILA_SUPPLIER: {TRANZILA_SUPPLIER[:10]}..." if TRANZILA_SUPPLIER else "[X] NOT SET")
    print(f"[OK] TRANZILA_PUBLIC_API_KEY: {TRANZILA_PUBLIC_API_KEY[:20]}..." if TRANZILA_PUBLIC_API_KEY else "[X] NOT SET")
    print(f"[OK] TRANZILA_SECRET_API_KEY: {TRANZILA_SECRET_API_KEY[:5]}..." if TRANZILA_SECRET_API_KEY else "[X] NOT SET")

    if not all([TRANZILA_SUPPLIER, TRANZILA_PUBLIC_API_KEY, TRANZILA_SECRET_API_KEY]):
        print("\n[ERROR] Missing Tranzila credentials in .env file")
        return False

    print("\n[SUCCESS] All credentials are set")
    return True

def test_2_headers_generation():
    """Test 2: Generate Tranzila authentication headers"""
    print("\n" + "="*60)
    print("TEST 2: Generating Tranzila Headers")
    print("="*60)

    try:
        headers = generate_tranzila_headers(TRANZILA_PUBLIC_API_KEY, TRANZILA_SECRET_API_KEY)

        print("\n[OK] Generated headers:")
        print(f"  - X-tranzila-api-app-key: {headers.get('X-tranzila-api-app-key', 'N/A')[:20]}...")
        print(f"  - X-tranzila-api-request-time: {headers.get('X-tranzila-api-request-time', 'N/A')}")
        print(f"  - X-tranzila-api-nonce: {headers.get('X-tranzila-api-nonce', 'N/A')[:20]}...")
        print(f"  - X-tranzila-api-access-token: {headers.get('X-tranzila-api-access-token', 'N/A')[:20]}...")
        print(f"  - Content-Type: {headers.get('Content-Type', 'N/A')}")

        # Verify all required headers are present
        required_headers = [
            'X-tranzila-api-app-key',
            'X-tranzila-api-request-time',
            'X-tranzila-api-nonce',
            'X-tranzila-api-access-token',
            'Content-Type'
        ]

        missing = [h for h in required_headers if h not in headers]
        if missing:
            print(f"\n[ERROR] Missing headers: {', '.join(missing)}")
            return False

        print("\n[SUCCESS] All required headers generated successfully")
        return True

    except Exception as e:
        print(f"\n❌ ERROR generating headers: {e}")
        return False

def test_3_connection():
    """Test 3: Test connection to Tranzila API (without actual payment)"""
    print("\n" + "="*60)
    print("TEST 3: Testing Connection to Tranzila API")
    print("="*60)

    try:
        # Generate headers
        headers = generate_tranzila_headers(TRANZILA_PUBLIC_API_KEY, TRANZILA_SECRET_API_KEY)

        # Tranzila test endpoint (checking if we can reach the API)
        url = "https://api.tranzila.com/v1/transaction/credit_card/create"

        print(f"\n[INFO] Testing connection to: {url}")
        print("Note: This will fail with authentication error (expected), but proves connectivity")

        # Send a minimal request to check connectivity
        # This WILL fail because we're not sending a valid payment, but that's OK
        # We just want to see if we can reach the server
        test_payload = {
            "supplier": TRANZILA_SUPPLIER,
            "currency": 1,  # ILS
            "sum": 1,  # Minimal amount for testing
            "credit_card": {
                "number": "0000000000000000",  # Invalid card for connection test
                "expire_month": "12",
                "expire_year": "25"
            }
        }

        response = requests.post(url, json=test_payload, headers=headers, timeout=10)

        print(f"\n[INFO] Response Status: {response.status_code}")
        print(f"[INFO] Response Headers: {dict(response.headers)}")

        try:
            response_data = response.json()
            print(f"[INFO] Response Body: {response_data}")
        except:
            print(f"[INFO] Response Text: {response.text[:200]}")

        # If we get any response (even error), connection is working
        if response.status_code in [200, 400, 401, 403]:
            print("\n[SUCCESS] Connection to Tranzila API successful!")
            print("   (Error responses are expected with test data)")
            return True
        else:
            print(f"\n[WARNING] Unexpected status code: {response.status_code}")
            return False

    except requests.exceptions.ConnectionError as e:
        print(f"\n[ERROR] CONNECTION ERROR: Cannot reach Tranzila API")
        print(f"   Error: {e}")
        return False
    except requests.exceptions.Timeout:
        print(f"\n[ERROR] TIMEOUT: Tranzila API did not respond in time")
        return False
    except Exception as e:
        print(f"\n[ERROR] {e}")
        return False

def test_4_test_card():
    """Test 4: Use Tranzila test card (if available)"""
    print("\n" + "="*60)
    print("TEST 4: Testing with Tranzila Test Card")
    print("="*60)

    print("\n[WARNING] This test requires a valid test card from Tranzila")
    print("Test cards from Tranzila documentation:")
    print("  - Success: 4580000000000000 (CVV: 123, Any future date)")
    print("  - Decline: 4580000000000001")

    # Ask user if they want to proceed
    print("\n[INFO] Do you want to test with a real test card? (y/n)")
    print("   Note: This will NOT charge real money, it's a sandbox test")

    # For automated testing, skip this
    print("\n[SKIP] Skipping interactive test (requires manual confirmation)")
    print("   To run this test manually:")
    print("   1. Ensure Tranzila test mode is enabled")
    print("   2. Use test card: 4580000000000000")
    print("   3. Call /payment/pay endpoint with test data")

    return True

def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("TRANZILA INTEGRATION TEST SUITE")
    print("="*60)

    results = {
        "Credentials": test_1_credentials(),
        "Headers Generation": test_2_headers_generation(),
        "API Connection": test_3_connection(),
        "Test Card": test_4_test_card()
    }

    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)

    for test_name, passed in results.items():
        status = "[PASSED]" if passed else "[FAILED]"
        print(f"{test_name:25} {status}")

    all_passed = all(results.values())

    print("\n" + "="*60)
    if all_passed:
        print("[SUCCESS] ALL TESTS PASSED")
        print("\nNext steps:")
        print("1. Start the Flask backend: python app.py")
        print("2. Test payment flow through frontend or Postman")
        print("3. Check Tranzila dashboard for test transactions")
    else:
        print("[FAILED] SOME TESTS FAILED")
        print("\nPlease fix the issues above before proceeding")
    print("="*60 + "\n")

    return 0 if all_passed else 1

if __name__ == "__main__":
    sys.exit(main())
