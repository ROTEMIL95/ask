"""
Tranzila Billing Service
Handles invoice creation and management using Tranzila Billing API
"""

import os
import logging
import requests
from typing import Dict, Optional
from .tranzila_service import generate_tranzila_headers

logger = logging.getLogger(__name__)

# Environment variables
TRANZILA_SUPPLIER = os.getenv("TRANZILA_SUPPLIER")
TRANZILA_PUBLIC_API_KEY = os.getenv("TRANZILA_PUBLIC_API_KEY")
TRANZILA_SECRET_API_KEY = os.getenv("TRANZILA_SECRET_API_KEY")


def create_invoice(
    user_email: str,
    user_name: str,
    amount: float,
    currency_code: str = "ILS",
    card_last_4: Optional[str] = None,
    transaction_id: Optional[str] = None,
    plan_name: str = "TalkAPI Pro Subscription"
) -> Dict:
    """
    Create an invoice in Tranzila Billing system

    Args:
        user_email: Customer email address
        user_name: Customer full name
        amount: Payment amount
        currency_code: Currency (default: ILS)
        card_last_4: Last 4 digits of credit card
        transaction_id: Transaction ID from payment
        plan_name: Name of the product/service

    Returns:
        Dict with invoice details including document_number and document_url (PDF)
    """
    logger.info(f"📄 Creating invoice for {user_email} - Amount: {amount} {currency_code}")

    url = "https://billing5.tranzila.com/api/documents_db/create_document"

    # Prepare payload according to Tranzila Billing API spec
    payload = {
        "terminal_name": TRANZILA_SUPPLIER,
        "document_type": "IR",  # Invoice Receipt
        "document_currency_code": currency_code,
        "vat_percent": 17,  # Default Israeli VAT
        "client_company": "TalkAPI",  # Your company name
        "client_name": user_name,
        "client_email": user_email,
        "document_language": "eng",  # English as requested
        "response_language": "eng",
        "created_by_system": "TalkAPI Payment System",

        # Items - what was purchased
        "items": [
            {
                "name": plan_name,
                "type": "I",  # Item
                "units_number": 1,
                "unit_type": 1,  # Units
                "unit_price": float(amount),
                "price_type": "G",  # Gross (including VAT)
                "currency_code": currency_code
            }
        ],

        # Payment details
        "payments": [
            {
                "payment_method": 1,  # Credit card
                "amount": float(amount),
                "currency_code": currency_code
            }
        ]
    }

    # Add optional fields if available
    if card_last_4:
        payload["payments"][0]["cc_last_4_digits"] = str(card_last_4)

    if transaction_id:
        payload["payments"][0]["txnindex"] = int(transaction_id) if str(transaction_id).isdigit() else None

    # Generate Tranzila API headers
    headers = generate_tranzila_headers(TRANZILA_PUBLIC_API_KEY, TRANZILA_SECRET_API_KEY)

    logger.info(f"📡 Sending invoice creation request to Tranzila Billing")
    logger.info(f"   URL: {url}")
    logger.info(f"   Terminal: {TRANZILA_SUPPLIER}")
    logger.info(f"   Customer: {user_name} ({user_email})")

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)

        logger.info(f"📡 Invoice API Response Status: {response.status_code}")

        # Check if request was successful
        if response.status_code != 200:
            logger.error(f"❌ Invoice creation failed with status {response.status_code}")
            logger.error(f"   Response: {response.text}")
            raise Exception(f"Invoice API returned status {response.status_code}")

        # Parse response
        data = response.json()
        logger.info(f"📄 Invoice API Response: {data}")

        # Check for errors in response
        if data.get("error_code") and data.get("error_code") != 0:
            error_message = data.get("message", "Unknown error")
            logger.error(f"❌ Invoice creation failed: {error_message}")
            raise Exception(f"Invoice creation failed: {error_message}")

        # Extract document details
        document_number = data.get("document_number")
        document_url = data.get("document_url")  # PDF URL if available

        if not document_number:
            logger.warning("⚠️ No document number returned from Tranzila")

        logger.info(f"✅ Invoice created successfully!")
        logger.info(f"   Document Number: {document_number}")
        logger.info(f"   Document URL: {document_url or 'N/A'}")

        return {
            "success": True,
            "document_number": document_number,
            "document_url": document_url,
            "raw_response": data
        }

    except requests.exceptions.Timeout:
        logger.error("❌ Invoice creation request timed out")
        raise Exception("Invoice creation timed out after 30 seconds")

    except requests.exceptions.RequestException as e:
        logger.error(f"❌ HTTP error creating invoice: {str(e)}")
        raise Exception(f"Invoice creation HTTP error: {str(e)}")

    except Exception as e:
        logger.error(f"❌ Unexpected error creating invoice: {str(e)}")
        raise


def get_invoice_pdf_url(document_number: str) -> Optional[str]:
    """
    Get PDF URL for an existing invoice

    Args:
        document_number: Invoice document number

    Returns:
        PDF URL or None if not available
    """
    logger.info(f"📄 Fetching PDF URL for invoice {document_number}")

    # This is a placeholder - implement if Tranzila provides a separate endpoint
    # for fetching invoice PDFs by document number

    # For now, return None - PDF URL is usually returned during creation
    logger.warning("⚠️ PDF URL fetch not implemented - use URL from creation response")
    return None
