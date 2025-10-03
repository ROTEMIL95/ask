#!/usr/bin/env python3
"""
Simple test to check if monthly_quota module can be imported
"""

try:
    print("Testing import...")
    from utils.monthly_quota import check_and_decrement, get_remaining_quota, reset_daily_quota
    print("✅ All imports successful!")
    print("✅ Syntax is correct!")
except Exception as e:
    print(f"❌ Import failed: {e}")
    import traceback
    traceback.print_exc()
