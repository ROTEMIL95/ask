from datetime import date
import logging

from dateutil.relativedelta import relativedelta
from flask import jsonify, request
import requests
import os
from .tranzila_service import generate_tranzila_headers

logger = logging.getLogger(__name__)

TRANZILA_SUPPLIER = os.getenv("TRANZILA_SUPPLIER")
TRANZILA_PUBLIC_API_KEY = os.getenv("TRANZILA_PUBLIC_API_KEY")
TRANZILA_SECRET_API_KEY = os.getenv("TRANZILA_SECRET_API_KEY")

def create_recurring_payment(token, expire_month, expire_year, full_name, user_email=None, user_id=None):
    logger.info("🔄 Starting recurring payment creation")
    logger.info(f"📝 Token: {token[:10]}..." if token else "No token")
    logger.info(f"📅 Expiry: {expire_month}/{expire_year}")
    logger.info(f"👤 Full name: {full_name}")
    logger.info(f"📧 Email: {user_email}")
    logger.info(f"🆔 User ID: {user_id}")
    
    url = "https://api.tranzila.com/v2/sto/create"

    payload = format_payload_recurring(token, expire_month, expire_year, full_name, user_email, user_id)
    headers = generate_tranzila_headers(TRANZILA_PUBLIC_API_KEY, TRANZILA_SECRET_API_KEY)
    
    logger.info(f"🔍 Recurring Payment URL: {url}")
    logger.info(f"🔍 Recurring Payment Payload: {payload}")
    logger.info(f"🔍 Recurring Payment Headers: {headers}")

    try:
        logger.info("📡 Making request to Tranzila API...")
        response = requests.post(url, json=payload, headers=headers)
        logger.info(f"📡 Recurring Payment Response Status: {response.status_code}")
        
        response.raise_for_status()
        
        logger.info("📄 Parsing response JSON...")
        data = response.json()
        logger.info(f"✅ Recurring Payment Response: {data}")
        
        if data.get('sto_id'):
            logger.info(f"✨ Successfully created recurring payment with STO ID: {data.get('sto_id')}")
        
        return data
    except requests.exceptions.HTTPError as e:
        logger.error(f"❌ HTTP Error in recurring payment: {e}")
        logger.error(f"❌ Response content: {response.text if 'response' in locals() else 'No response'}")
        raise Exception(f"Recurring payment failed: {str(e)}")
    except Exception as e:
        logger.error(f"❌ Unexpected error in recurring payment: {str(e)}")
        raise Exception(f"Recurring payment failed: {str(e)}")



def format_payload_recurring(token, expire_month, expire_year, full_name, user_email=None, user_id=None):
    logger.info("🔍 Starting format_payload_recurring")
    
    try:
        today = date.today()
        logger.info(f"📅 Today: {today}")
        
        next_month_same_day = today + relativedelta(months=1)
        logger.info(f"📅 Next month: {next_month_same_day}")
    except Exception as e:
        logger.error(f"❌ Error in date calculation: {str(e)}")
        raise
    
    return {
        "terminal_name": TRANZILA_SUPPLIER,
        "sto_payments_number": 9999,
        "first_charge_date": next_month_same_day.strftime("%Y-%m-%d"),
        "charge_frequency": "monthly",
        "charge_dom": 27,
        "client": {
            "internal_id": hash(user_id) % 999999 if user_id else 123456,  # Generate numeric ID from user_id
            "id": None,
            "name": full_name,
            "phone_area_code": None,
            "phone_number": None,
            "email": user_email  # Use actual user email
        },
        "items": [{
            "name": "Monthly TalkAPI Subscription",
            "unit_price": 19,
            "units_number": 1,
            "price_currency": "ILS",
            "price_type": "G",
            "vat_percent": 17
        }],
        "card": {
            "token": token,
            "expire_month": int(expire_month),
            "expire_year": int(expire_year) + 2000 if int(expire_year) < 100 else int(expire_year),  # Convert 2-digit to 4-digit year
            "card_holder_id": None,
            "card_holder_name": None
        },
        "response_language": "english",
        "created_by_user": full_name,
    }
    
    
def format_payload_initial(params):
    # Clean and validate card number
    card_number = params["card_number"].replace(" ", "").replace("-", "")
    
    # Ensure it's digits only and proper length (13-19 digits for most cards)
    if not card_number.isdigit():
        raise ValueError("Card number must contain only digits")
    
    if len(card_number) < 13 or len(card_number) > 19:
        raise ValueError("Card number must be between 13-19 digits")
    
    return {
        "terminal_name": TRANZILA_SUPPLIER,
        "txn_currency_code": "ILS",
        "txn_type": "debit",
        "card_number": card_number,
        "expire_month": int(params["expire_month"]),
        "expire_year": int(params["expire_year"]),
        "payment_plan": 1,
        "items": [
            {
                "code": "1",
                "name": "TalkAPI Subscription",
                "unit_price": 1,
                "type": "I",
                "units_number": 1,
                "unit_type": 1,
                "price_type": "G",
                "currency_code": "ILS",
                "attributes": [],
            }
        ],
    }