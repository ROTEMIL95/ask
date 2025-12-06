"""
Tranzila Billing Service
Handles invoice creation and management using Tranzila Billing API
"""

import os
import logging
import requests
from datetime import datetime
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
        "document_date": datetime.now().strftime("%Y-%m-%d"),  # Current date
        "document_type": "RE",  # Receipt (simpler than IR, doesn't require tax invoice settings)
        "document_currency_code": currency_code,
        "vat_percent": 17,  # Israeli VAT
        "action": 1,  # 1 = create document

        # Client details (removed client_company - it's for customer's company, not ours)
        "client_name": user_name,
        "client_email": user_email,
        "client_country_code": "IL",  # Israel

        "document_language": "eng",  # English as requested
        "response_language": "eng",
        "created_by_system": "TalkAPI Payment System",

        # Items - what was purchased
        # ALL fields must be strings per Invoice-items documentation
        "items": [
            {
                "name": plan_name,  # Required: string
                "unit_price": str(amount),  # Required: string (not float!)
                "type": "I",  # Optional: string - I=Item, S=Shipping, C=Coupon
                "price_type": "G",  # Optional: string - G=Gross (VAT extracted)
                "units_number": "1",  # Optional: string (not int!)
                "units_type": "1",  # Optional: string - 1=Unit (per Unit types table)
                "currency_code": currency_code,  # Optional: string
                "to_doc_currency_exchange_rate": "1"  # Optional: string (not int!)
            }
        ],

        # Payment details
        # ALL fields must be strings per Tranzila docs
        "payments": [
            {
                "payment_method": 1,  # Credit card (per Payment methods table: 1=CC, 3=Cheque, etc)
                "payment_date": datetime.now().strftime("%Y-%m-%d"),  # Current date (string format)
                "amount": str(amount),  # Must be string!
                "currency_code": currency_code,  # String
                "to_doc_currency_exchange_rate": "1",  # Must be string!

                # Credit Card required fields (per Params-Table documentation)
                "credit_term": "1",  # 1=Regular, 6=Credit plan, 8=Payments
                "installments_number": "1",  # Single payment (string!)
                "credit_card_brand": "2",  # Default to 2=Visa (will override if available)
            }
        ]
    }

    # Add optional Credit Card fields if available
    if card_last_4:
        payload["payments"][0]["cc_last_4_digits"] = str(card_last_4)

    if transaction_id:
        # txnindex must be integer (per documentation)
        if str(transaction_id).isdigit():
            payload["payments"][0]["txnindex"] = int(transaction_id)

    # Generate Tranzila API headers
    headers = generate_tranzila_headers(TRANZILA_PUBLIC_API_KEY, TRANZILA_SECRET_API_KEY)

    logger.info("=" * 80)
    logger.info("📄 INVOICE CREATION - FULL PAYLOAD DEBUG")
    logger.info("=" * 80)
    logger.info(f"URL: {url}")
    logger.info(f"Terminal: {TRANZILA_SUPPLIER}")
    logger.info(f"Customer: {user_name} ({user_email})")
    logger.info("-" * 80)
    logger.info("PAYLOAD STRUCTURE:")
    logger.info(f"  document_type: {payload['document_type']}")
    logger.info(f"  document_date: {payload['document_date']}")
    logger.info(f"  document_currency_code: {payload['document_currency_code']}")
    logger.info(f"  vat_percent: {payload['vat_percent']}")
    logger.info(f"  action: {payload['action']}")
    logger.info(f"  client_name: {payload['client_name']}")
    logger.info(f"  client_email: {payload['client_email']}")
    logger.info(f"  client_country_code: {payload['client_country_code']}")
    logger.info("-" * 80)
    logger.info("ITEMS:")
    for idx, item in enumerate(payload['items']):
        logger.info(f"  Item {idx + 1}:")
        logger.info(f"    name: {item['name']}")
        logger.info(f"    unit_price: {item['unit_price']} (type: {type(item['unit_price']).__name__})")
        logger.info(f"    units_number: {item['units_number']} (type: {type(item['units_number']).__name__})")
        logger.info(f"    units_type: {item['units_type']} (type: {type(item['units_type']).__name__})")
        logger.info(f"    type: {item['type']}")
        logger.info(f"    price_type: {item['price_type']}")
        logger.info(f"    currency_code: {item['currency_code']}")
        logger.info(f"    to_doc_currency_exchange_rate: {item['to_doc_currency_exchange_rate']}")
    logger.info("-" * 80)
    logger.info("PAYMENTS:")
    for idx, payment in enumerate(payload['payments']):
        logger.info(f"  Payment {idx + 1}:")
        logger.info(f"    payment_method: {payment['payment_method']}")
        logger.info(f"    payment_date: {payment['payment_date']}")
        logger.info(f"    amount: {payment['amount']} (type: {type(payment['amount']).__name__})")
        logger.info(f"    currency_code: {payment['currency_code']}")
        logger.info(f"    to_doc_currency_exchange_rate: {payment['to_doc_currency_exchange_rate']} (type: {type(payment['to_doc_currency_exchange_rate']).__name__})")
        logger.info(f"    credit_term: {payment['credit_term']}")
        logger.info(f"    installments_number: {payment['installments_number']}")
        logger.info(f"    credit_card_brand: {payment['credit_card_brand']}")
        if 'cc_last_4_digits' in payment:
            logger.info(f"    cc_last_4_digits: {payment['cc_last_4_digits']}")
        if 'txnindex' in payment:
            logger.info(f"    txnindex: {payment['txnindex']} (type: {type(payment['txnindex']).__name__})")
    logger.info("=" * 80)
    logger.info("📡 Sending invoice creation request to Tranzila Billing")
    logger.info("=" * 80)

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
        # Tranzila returns 'status_code' (not 'error_code')
        # 0 = Success, anything else = Error
        status_code = data.get("status_code")
        if status_code is None or status_code != 0:
            error_message = data.get("status_msg") or data.get("message", "Unknown error")
            logger.error(f"❌ Invoice creation failed: {error_message}")
            logger.error(f"   Status Code: {status_code}")
            logger.error(f"   Full Response: {data}")
            raise Exception(f"Invoice creation failed: {error_message}")

        # Extract document details from 'document' object
        document_data = data.get("document", {})
        document_number = document_data.get("number")
        document_id = document_data.get("id")
        retrieval_key = document_data.get("retrieval_key")
        created_at = document_data.get("created_at")
        total_amount = document_data.get("total_charge_amount")
        currency = document_data.get("currency")

        # Build PDF URL using our proxy endpoint
        # This allows users to download from email without authentication issues
        # Format: https://your-backend.com/payment/invoice/{retrieval_key}
        document_url = None
        if retrieval_key:
            # Always use production URL for invoice links
            # This ensures invoice links work even when emails are sent from dev environment
            # The BACKEND_URL env var will override this in production
            backend_url = os.getenv("BACKEND_URL", "https://askapi-0vze.onrender.com")
            document_url = f"{backend_url}/payment/invoice/{retrieval_key}"

        if not document_number:
            logger.warning("⚠️ No document number returned from Tranzila")
            logger.warning(f"⚠️ Full response: {data}")

        logger.info(f"✅ Invoice created successfully!")
        logger.info(f"   Document ID: {document_id}")
        logger.info(f"   Document Number: {document_number}")
        logger.info(f"   Amount: {total_amount} {currency}")
        logger.info(f"   Created At: {created_at}")
        logger.info(f"   Retrieval Key: {retrieval_key[:20]}..." if retrieval_key else "   Retrieval Key: N/A")
        logger.info(f"   Document URL (proxy): {document_url or 'N/A'}")

        return {
            "success": True,
            "document_id": document_id,
            "document_number": document_number,
            "document_url": document_url,
            "retrieval_key": retrieval_key,
            "total_amount": total_amount,
            "currency": currency,
            "created_at": created_at,
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


def download_invoice_pdf(retrieval_key: str) -> Optional[bytes]:
    """
    Download invoice PDF from Tranzila using retrieval_key

    This function downloads the PDF with proper authentication headers.
    The retrieval_key is obtained from the invoice creation response.

    Args:
        retrieval_key: Retrieval key from invoice creation response

    Returns:
        PDF binary content or None if download fails
    """
    logger.info(f"📥 Downloading invoice PDF with retrieval_key: {retrieval_key[:20]}...")

    # Build Tranzila get_document URL
    url = f"https://billing5.tranzila.com/api/documents_db/get_document?retrieval_key={retrieval_key}"

    # Generate authentication headers
    headers = generate_tranzila_headers(TRANZILA_PUBLIC_API_KEY, TRANZILA_SECRET_API_KEY)

    try:
        # Make authenticated request to Tranzila
        logger.info(f"📡 Requesting PDF from Tranzila: {url[:80]}...")
        response = requests.get(url, headers=headers, timeout=30)

        # Check response status
        if response.status_code != 200:
            logger.error(f"❌ Failed to download PDF: HTTP {response.status_code}")
            logger.error(f"   Response: {response.text[:200]}")
            return None

        # Check if response is PDF
        content_type = response.headers.get('Content-Type', '')
        if 'pdf' not in content_type.lower():
            logger.error(f"❌ Response is not a PDF (Content-Type: {content_type})")
            logger.error(f"   Response preview: {response.text[:200]}")
            return None

        # Return PDF binary content
        pdf_size = len(response.content)
        logger.info(f"✅ PDF downloaded successfully ({pdf_size} bytes)")
        return response.content

    except requests.exceptions.Timeout:
        logger.error("❌ PDF download timed out after 30 seconds")
        return None

    except requests.exceptions.RequestException as e:
        logger.error(f"❌ HTTP error downloading PDF: {str(e)}")
        return None

    except Exception as e:
        logger.error(f"❌ Unexpected error downloading PDF: {str(e)}")
        return None


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
