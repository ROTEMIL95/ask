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
    
    url = "https://api.tranzila.com/v2/sto/create"

    payload = format_payload_recurring(token, expire_month, expire_year, full_name, user_email, user_id)
    headers = generate_tranzila_headers(TRANZILA_PUBLIC_API_KEY, TRANZILA_SECRET_API_KEY)
    

    try:
        response = requests.post(url, json=payload, headers=headers)
        
        response.raise_for_status()
        
        data = response.json()
        
        if data.get('sto_id'):
        
        return data
    except requests.exceptions.HTTPError as e:
        logger.error(f"❌ HTTP Error in recurring payment: {e}")
        logger.error(f"❌ Response content: {response.text if 'response' in locals() else 'No response'}")
        raise Exception(f"Recurring payment failed: {str(e)}")
    except Exception as e:
        logger.error(f"❌ Unexpected error in recurring payment: {str(e)}")
        raise Exception(f"Recurring payment failed: {str(e)}")



def format_payload_recurring(token, expire_month, expire_year, full_name, user_email=None, user_id=None):
    """
    יצירת payload ל-STO (Standing Order) לפי תיעוד Tranzila STOV2.

    התיעוד המלא: Backend/services/STOV2

    Args:
        token: Credit card token from Tranzila
        expire_month: Card expiry month (1-12)
        expire_year: Card expiry year (2-digit or 4-digit, will be validated)
        full_name: Cardholder name
        user_email: User email (optional)
        user_id: Internal user ID (optional, not sent to Tranzila)

    Returns:
        dict: Payload ready for STOV2 API

    Raises:
        ValueError: If expire_year is outside valid range (2020-2030)
    """

    # Debug: Input parameters

    try:
        today = date.today()
        # חישוב תאריך החיוב הראשון (חודש הבא)
        next_month_same_day = today + relativedelta(months=1)

        # יום החיוב בחודש (מוגבל ל-28 לפי STOV2 lines 38-42)
        charge_day_of_month = min(today.day, 28)

        # Debug: Date calculations
    except Exception as e:
        logger.error(f"❌ Error in date calculation: {str(e)}")
        raise

    # 1. בניית אובייקט ה-Client [STOV2: lines 75-108]
    # שדה id הוא לתעודת זהות ישראלית בלבד (9 ספרות) - STOV2 lines 84-87, 109-114
    # אם אין לנו ת"ז, לא שולחים את השדה (לא null!)
    client_obj = {
        "name": full_name,  # Required [STOV2: lines 80-83]
        "email": user_email  # Optional [STOV2: lines 88-91, 115-121]
        # אין שדה internal_id בסכמה של STOV2!
        # phone_number, address - אופציונליים, לא שולחים אם ריקים
    }

    # Debug: Client object
    
    # 2. בניית אובייקט ה-Card [STOV2: lines 185-219]
    # המרת שנה ל-4 ספרות ו-validation

    year = int(expire_year)

    if year < 100:
        year = year + 2000

    # בדיקה שהשנה בטווח סביר (2020-2099)
    # הערה: STOV2 line 201-202 מציין 2030 כדוגמה, לא כהגבלה קשיחה
    # מאפשרים עד 2099 כדי לא לחסום כרטיסים תקפים
    if year < 2020 or year > 2099:
        logger.error(f"❌ Invalid expire_year: {year}. Must be between 2020-2099")
        raise ValueError(f"Expiry year must be between 2020-2099, got {year}")


    card_obj = {
        "token": token,
        "expire_month": int(expire_month),
        "expire_year": year,
    }

    # Debug: Card object

    # 3. בניית ה-Payload הראשי [STOV2: lines 1-62]
    payload = {
        "terminal_name": TRANZILA_SUPPLIER,  # Required [STOV2: line 11-12]
        "sto_payments_number": 99,  # Required, max 9999 [STOV2: lines 13-17]
        "first_charge_date": next_month_same_day.strftime("%Y-%m-%d"),  # Optional [STOV2: lines 27-28]
        "charge_frequency": "monthly",  # Required, enum value [STOV2: lines 18-26]
        "charge_dom": charge_day_of_month,  # Required, 1-28 [STOV2: lines 38-42]
        "currency_code": "USD",  # Optional, default USD [STOV2: lines 29-37]

        # אובייקט Client (אופציונלי) [STOV2: lines 50-51, 75-108]
        "client": client_obj,

        # אובייקט Item (חובה!) - לפי השגיאה של טרנזילה צריך להיות 'items' ברבים!
        # התיעוד STOV2 אומר 'item' ביחיד, אבל ה-API דורש 'items' ברשימה
        "items": [{
            "name": "Monthly TalkAPI Subscription",  # Required [STOV2: line 160]
            "unit_price": 19.00,  # Required, min 0.01 max 99999 [STOV2: lines 135-140]
            "units_number": 1,  # Optional, default 1 [STOV2: lines 141-146]
            "price_currency": "USD",  # Optional, enum ILS/USD/EUR [STOV2: lines 147-150, 162-171]
            "price_type": "G",  # Optional, G=Gross/N=Net [STOV2: lines 151-152, 172-184]
            "vat_percent": 0  # Optional, no VAT for USD [STOV2: lines 153-158]
        }],

        # אובייקט Card (חובה אם לא msv) [STOV2: lines 54-55, 185-219]
        "card": card_obj,

        # שפת תגובה (אופציונלי) [STOV2: lines 58-59, 242-251]
        "response_language": "english",

        # שם המשתמש שיצר (אופציונלי) [STOV2: lines 60-62]
        "created_by_user": full_name,
    }

    # Debug: Final payload overview

    return payload
    
    
def format_payload_initial(params):
    # Clean and validate card number
    card_number = params["card_number"].replace(" ", "").replace("-", "")

    # Ensure it's digits only and proper length (13-19 digits for most cards)
    if not card_number.isdigit():
        raise ValueError("Card number must contain only digits")

    if len(card_number) < 13 or len(card_number) > 19:
        raise ValueError("Card number must be between 13-19 digits")

    # Validate CVV if provided
    cvv = params.get("cvv", "").strip()
    if cvv and (not cvv.isdigit() or len(cvv) < 3 or len(cvv) > 4):
        raise ValueError("CVV must be 3 or 4 digits")

    # Convert expire_year to 4-digit format if needed
    expire_year = int(params["expire_year"])
    if expire_year < 100:
        expire_year = expire_year + 2000

    # Build base payload without any null values
    payload = {
        "terminal_name": TRANZILA_SUPPLIER,
        "txn_currency_code": "USD",
        "txn_type": "debit",
        "card_number": card_number,
        "expire_month": int(params["expire_month"]),
        "expire_year": expire_year,
        "payment_plan": 1,
    }

    # Add CVV if provided (before items to maintain order)
    if cvv:
        payload["cvv"] = cvv

    # Add cardholder name if provided
    if params.get("full_name"):
        payload["card_holder_name"] = params["full_name"]

    # Add cardholder ID if provided
    if params.get("card_holder_id"):
        payload["card_holder_id"] = params["card_holder_id"]

    # Add items - only include fields that are not None
    payload["items"] = [
        {
            "code": "1",
            "name": "TalkAPI Subscription",
            "unit_price": 19.00,
            "type": "I",
            "units_number": 1,
            "unit_type": 1,
            "price_type": "G",
            "currency_code": "USD",
            # Don't include 'attributes' if it's empty - Tranzila doesn't like empty arrays
        }
    ]

    return payload