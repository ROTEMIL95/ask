# Backend/routes/payment_routes.py
# ---------------------------------------------------------------------------
# Payment routes for TalkAPI
# - /payment/pay:    initial charge + create recurring (STO) + upgrade to Pro
# - /payment/cancel: cancel recurring (STO) + downgrade to Free
# - /payment/callback: synchronous callback handler (optional)
#
# Plans:
#   Pro  -> 500 code generations (convert) + 2000 API runs (execute) per month
#   Free -> 50 total (convert + run combined) per month
#
# This module relies on supabase_manager helpers that must exist:
#   - verify_token(token) -> {sub, email, ...} | None
#   - update_subscription_after_payment(user_id, sto_id, plan_type, user_email, user_token, limits: dict) -> bool
#   - update_user_profile(user_id, dict) -> bool
#   - get_user_sto_id(user_id) -> str|int|None
#   - save_api_history(user_id, user_query, generated_code, endpoint, status, execution_result: dict)
#
# Tranzila helpers:
#   - services.tranzila_service.generate_tranzila_headers(public_key, secret_key) -> dict
#   - services.payment_service.create_recurring_payment(...) -> {"sto_id": <int>} | {}
#   - services.payment_service.format_payload_initial(params) -> dict
# ---------------------------------------------------------------------------

from flask import Blueprint, request, jsonify
import os
import logging
from datetime import datetime
import requests

from services.payment_service import create_recurring_payment, format_payload_initial
from services.tranzila_service import generate_tranzila_headers
from services import billing_service, email_service
from supabase_client import supabase_manager

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

payment_bp = Blueprint("payment", __name__)

# --- Environment (Tranzila credentials) ---
TRANZILA_SUPPLIER = os.getenv("TRANZILA_SUPPLIER")
TRANZILA_TERMINAL_PASSWORD = os.getenv("TRANZILA_TERMINAL_PASSWORD")
TRANZILA_PUBLIC_API_KEY = os.getenv("TRANZILA_PUBLIC_API_KEY")
TRANZILA_SECRET_API_KEY = os.getenv("TRANZILA_SECRET_API_KEY")

# --- Currency Code Mapping ---
# Map old Tranzila numeric currency codes to ISO codes for Billing API
CURRENCY_CODE_MAP = {
    "1": "ILS",    # Israeli Shekel
    "2": "USD",    # US Dollar
    "3": "EUR",    # Euro
    "978": "EUR",  # Alternative EUR code
    "826": "GBP",  # British Pound
}

# --- Plan definitions ---
PRO_LIMITS = {"convert_limit": 500, "run_limit": 2000}  # monthly quotas
FREE_LIMITS = {"total_limit": 50}                       # combined monthly quota

# Get frontend URL for callbacks
FRONTEND_URL = os.getenv("FRONTEND_URL")
BACKEND_URL = os.getenv("BACKEND_URL")

@payment_bp.route("/payment/create-handshake", methods=["POST", "OPTIONS"])
def create_handshake():
    """
    Create Tranzila handshake token before payment (fraud prevention).
    This token must be sent with the Hosted Fields charge request.

    Handshake validates that the payment amount hasn't changed between
    initialization and charge.

    Token is valid for 20 minutes.
    """
    logger.info("🤝 /payment/create-handshake called")

    if request.method == "OPTIONS":
        return "", 200

    # 1) Authorization
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        logger.warning("Missing/invalid Authorization header")
        return jsonify({"status": "error", "message": "Authentication required"}), 401

    auth_token = auth_header.split(" ")[1]
    user_data = supabase_manager.verify_token(auth_token)
    user_id = user_data.get("sub") if user_data else None

    if not user_id:
        return jsonify({"status": "error", "message": "Invalid user token"}), 401

    # 2) Get payment amount from request
    params = request.get_json(silent=True) or {}
    sum_amount = params.get("sum")

    if not sum_amount:
        logger.warning("Missing sum parameter")
        return jsonify({"status": "error", "message": "Missing payment amount"}), 400

    # 3) Call Tranzila handshake API
    try:
        url = "https://api.tranzila.com/v1/handshake/create"
        handshake_params = {
            "supplier": TRANZILA_SUPPLIER,
            "sum": sum_amount,
            "TranzilaPW": TRANZILA_TERMINAL_PASSWORD
        }

        logger.info(f"🤝 Calling Tranzila handshake API")
        logger.info(f"   URL: {url}")
        logger.info(f"   Params: supplier={TRANZILA_SUPPLIER}, sum={sum_amount}")

        response = requests.get(url, params=handshake_params, timeout=10)
        logger.info(f"🤝 Handshake response status: {response.status_code}")
        logger.info(f"🤝 Handshake response text: {response.text}")
        logger.info(f"🤝 Handshake response headers: {dict(response.headers)}")

        response.raise_for_status()

        # Parse response - could be JSON or query string format
        try:
            data = response.json()
            logger.info(f"🤝 Parsed handshake response (JSON): {data}")
        except:
            # Parse as query string if not JSON
            from urllib.parse import parse_qs
            parsed = parse_qs(response.text)
            data = {k: v[0] if len(v) == 1 else v for k, v in parsed.items()}
            logger.info(f"🤝 Parsed handshake response (query string): {data}")

        # Check for errors in response
        if 'error' in data or 'Error' in data:
            error_msg = data.get('error') or data.get('Error')
            logger.error(f"❌ Handshake returned error: {error_msg}")
            logger.error(f"❌ Full response: {data}")
            return jsonify({"status": "error", "message": f"Handshake error: {error_msg}"}), 500

        thtk = data.get("thtk")

        if not thtk:
            logger.error(f"❌ No thtk in handshake response!")
            logger.error(f"❌ Full response data: {data}")
            logger.error(f"❌ Response keys: {list(data.keys())}")
            return jsonify({"status": "error", "message": "Failed to create handshake token"}), 500

        logger.info(f"✅ Handshake token created successfully!")
        logger.info(f"   thtk: {thtk}")
        logger.info(f"   All response data: {data}")

        return jsonify({
            "status": "success",
            "thtk": thtk,
            "valid_for": "20 minutes"
        }), 200

    except requests.exceptions.HTTPError as e:
        logger.exception(f"HTTP error creating handshake: {str(e)}")
        error_detail = response.text if 'response' in locals() else str(e)
        return jsonify({"status": "error", "message": f"Handshake failed: {error_detail}"}), 500
    except Exception as e:
        logger.exception("Unexpected error creating handshake")
        return jsonify({"status": "error", "message": str(e)}), 500


@payment_bp.route("/payment/upgrade-after-hosted-payment", methods=["POST", "OPTIONS"])
def upgrade_after_hosted_payment():
    """
    Upgrade user to Pro after successful Hosted Fields payment.

    This endpoint is called by the frontend immediately after a successful
    Hosted Fields payment to:
    1. Create STO (Standing Order) for monthly recurring billing
    2. Update user's profile in the database to Pro plan
    3. Create invoice via Tranzila Billing API
    4. Send payment confirmation email

    The STO ensures automatic monthly charges on the same day each month.
    """
    logger.info("🎉 /payment/upgrade-after-hosted-payment called")

    if request.method == "OPTIONS":
        return "", 200

    # 1) Authorization
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        logger.warning("Missing/invalid Authorization header")
        return jsonify({"status": "error", "message": "Authentication required"}), 401

    token = auth_header.split(" ")[1]
    user_data = supabase_manager.verify_token(token)
    user_id = user_data.get("sub") if user_data else None
    user_email = user_data.get("email") if user_data else None

    if not user_id:
        logger.error("Invalid user token")
        return jsonify({"status": "error", "message": "Invalid user token"}), 401

    # 2) Get payment details from request
    params = request.get_json(silent=True) or {}
    transaction_id = params.get("transaction_id")
    amount = params.get("amount")
    currency_code = params.get("currency_code")
    card_last_4 = params.get("card_last_4")
    card_token = params.get("card_token")  # For STO creation
    expire_month = params.get("expire_month")  # For STO creation
    expire_year = params.get("expire_year")  # For STO creation
    full_name = params.get("full_name") or user_data.get('full_name')  # For STO creation

    logger.info(f"💳 Upgrading user {user_id} ({user_email}) to Pro")
    logger.info(f"   Transaction ID: {transaction_id}")
    logger.info(f"   Amount: {amount} {currency_code}")
    logger.info(f"   Card: ****{card_last_4}")
    logger.info(f"   Card token: {card_token[:10]}..." if card_token else "   No card token")
    logger.info(f"   Expiry: {expire_month}/{expire_year}" if expire_month and expire_year else "   No expiry")

    # 3) Create STO (Standing Order) for monthly recurring billing (non-critical - don't fail if this errors)
    sto_id = None
    if card_token and expire_month and expire_year and full_name:
        try:
            logger.info(f"🔄 Creating STO for monthly recurring billing...")
            recurring_result = create_recurring_payment(
                token=card_token,
                expire_month=expire_month,
                expire_year=expire_year,
                full_name=full_name,
                user_email=user_email,
                user_id=user_id,
            )
            sto_id = (recurring_result or {}).get("sto_id")
            if sto_id:
                logger.info(f"✅ STO created successfully! STO ID: {sto_id}")
            else:
                logger.warning(f"⚠️ STO creation returned no STO ID")
        except Exception as sto_error:
            logger.warning(f"⚠️ Failed to create STO (non-critical): {str(sto_error)}")
    else:
        logger.info(f"ℹ️ Skipping STO creation - missing required data (token, expiry, or name)")

    # 4) Update user_profiles in Supabase
    try:
        updated = supabase_manager.update_subscription_after_payment(
            user_id=user_id,
            sto_id=sto_id,  # Save STO ID if created
            plan_type="pro",
            user_email=user_email,
            user_token=token,
            limits=PRO_LIMITS,  # 500/2000 monthly
        )

        # 5) Log to API history (non-critical, don't fail if this errors)
        try:
            supabase_manager.save_api_history(
                user_id=user_id,
                user_query="Hosted Fields Payment: upgrade to Pro with STO",
                generated_code=None,
                endpoint="/payment/upgrade-after-hosted-payment",
                status="Success" if updated else "Failed",
                execution_result={
                    "transaction_id": transaction_id,
                    "amount": amount,
                    "currency_code": currency_code,
                    "plan": "pro",
                    "limits": PRO_LIMITS,
                    "payment_method": "hosted_fields",
                    "sto_id": sto_id,
                    "recurring_billing": "enabled" if sto_id else "disabled"
                },
            )
        except Exception as history_error:
            # Log the error but don't fail the payment upgrade
            logger.warning(f"⚠️ Failed to save API history (non-critical): {str(history_error)}")

        if updated:
            logger.info(f"✅ User {user_id} upgraded to Pro successfully")
            if sto_id:
                logger.info(f"✅ Recurring billing enabled with STO ID: {sto_id}")

            # 6) Create invoice (non-critical - don't fail if this errors)
            invoice_url = None
            try:
                logger.info(f"📄 Creating invoice for user {user_id}")

                # Convert numeric currency code to ISO code for Billing API
                # Tranzila Hosted Fields returns "1" for ILS, but Billing API needs "ILS"
                currency_code_raw = currency_code or "1"
                currency_code_iso = CURRENCY_CODE_MAP.get(str(currency_code_raw), "ILS")
                logger.info(f"   Currency conversion: {currency_code_raw} -> {currency_code_iso}")

                invoice = billing_service.create_invoice(
                    user_email=user_email,
                    user_name=user_data.get('full_name') or user_email,
                    amount=amount or 19.00,  # Default to $19 if not provided
                    currency_code=currency_code_iso,  # Use ISO code instead of numeric
                    card_last_4=card_last_4,
                    transaction_id=transaction_id,
                    plan_name="TalkAPI Pro Monthly Subscription"
                )
                invoice_url = invoice.get('document_url')
                logger.info(f"✅ Invoice created: {invoice.get('document_number')}")
                if invoice_url:
                    logger.info(f"   PDF URL: {invoice_url}")
            except Exception as invoice_error:
                logger.warning(f"⚠️ Failed to create invoice (non-critical): {str(invoice_error)}")

            # 7) Send payment confirmation email (non-critical - don't fail if this errors)
            try:
                logger.info(f"📧 Sending payment confirmation email to {user_email}")
                email_sent = email_service.send_payment_success_email(
                    user_email=user_email,
                    user_name=user_data.get('full_name') or full_name or user_email,
                    amount=float(amount) if amount else 19.00,
                    plan_type="pro",
                    transaction_id=transaction_id or "N/A",
                    invoice_url=invoice_url,
                    daily_limit=100,
                    monthly_limit=2000
                )
                if email_sent:
                    logger.info(f"✅ Payment confirmation email sent successfully")
                else:
                    logger.warning(f"⚠️ Failed to send payment confirmation email")
            except Exception as email_error:
                logger.warning(f"⚠️ Failed to send email (non-critical): {str(email_error)}")

            return jsonify({
                "status": "success",
                "message": "Account upgraded to Pro" + (" with monthly recurring billing" if sto_id else ""),
                "plan_type": "pro",
                "limits": PRO_LIMITS,
                "sto_id": sto_id,  # Include STO ID in response
                "recurring_billing": "enabled" if sto_id else "disabled",
                "invoice_url": invoice_url  # Optional: frontend can display this
            }), 200
        else:
            logger.error(f"❌ Failed to update user {user_id} profile")
            return jsonify({
                "status": "error",
                "message": "Failed to upgrade account. Please contact support."
            }), 500

    except Exception as e:
        logger.exception(f"❌ Error upgrading user {user_id} to Pro: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "Internal server error. Please contact support."
        }), 500


@payment_bp.route("/payment/pay", methods=["POST", "OPTIONS"])
def make_initial_payment():
    """
    Initial payment flow:
      1) Validate Authorization (JWT).
      2) Charge the card once via Tranzila.
      3) Create recurring payment (STO) in Tranzila.
      4) Update the user's subscription to Pro (500/2000) in Supabase.
      5) Log to API history.
    """
    logger.info("💳 /payment/pay called")

    # Handle CORS preflight
    if request.method == "OPTIONS":
        return "", 200

    # 1) Authorization
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        logger.warning("Missing/invalid Authorization header")
        return jsonify({"status": "error", "message": "Authentication required"}), 401

    auth_token = auth_header.split(" ")[1]
    user_data = supabase_manager.verify_token(auth_token)
    user_id = user_data.get("sub") if user_data else None
    user_email = user_data.get("email") if user_data else None

    if not user_id:
        return jsonify({"status": "error", "message": "Invalid user token"}), 401

    # 2) Validate client payload
    params = request.get_json(silent=True) or {}
    logger.info(f"[Payment] Received params: {params}")

    for field in ["card_number", "expire_month", "expire_year"]:
        if not params.get(field):
            logger.warning(f"[Payment] Missing field: {field}")
            return jsonify({"status": "error", "message": f"Missing field: {field}"}), 400

    # 3) One-time charge using Tranzila REST API v1
    try:
        url = "https://api.tranzila.com/v1/transaction/credit_card/create"
        payload = format_payload_initial(params)
        headers = generate_tranzila_headers(TRANZILA_PUBLIC_API_KEY, TRANZILA_SECRET_API_KEY)

        logger.info(f"[Charge] URL: {url}")
        logger.info(f"[Charge] Payload: {payload}")
        logger.info(f"[Charge] Headers keys: {list(headers.keys())}")

        resp = requests.post(url, json=payload, headers=headers, timeout=30)
        logger.info(f"[Charge] Response status: {resp.status_code}")
        logger.info(f"[Charge] Response text: {resp.text[:500]}")

        resp.raise_for_status()
        data = resp.json()

        trx = data.get("transaction_result") or {}
        if trx.get("processor_response_code") != "000":
            error_msg = trx.get("processor_response_text", "Payment failed")
            logger.error(f"[Charge] Payment failed with code {trx.get('processor_response_code')}: {error_msg}")
            logger.error(f"[Charge] Full response: {data}")
            return jsonify({
                "status": "error",
                "message": error_msg,
                "error_code": trx.get("processor_response_code")
            }), 400

        logger.info(f"✅ [Charge] Payment successful! Transaction: {trx}")

    except ValueError as e:
        logger.error(f"[Charge] Validation error: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 400
    except requests.exceptions.HTTPError as e:
        logger.exception(f"[Charge] HTTP error: {str(e)}")
        error_detail = resp.text if 'resp' in locals() else str(e)
        return jsonify({"status": "error", "message": f"Payment gateway error: {error_detail}"}), 500
    except Exception as e:
        logger.exception("[Charge] Unexpected error in initial payment")
        return jsonify({"status": "error", "message": str(e)}), 500

    # 4) Create recurring (STO)
    try:
        recurring_result = create_recurring_payment(
            token=trx.get("token"),
            expire_month=params.get("expire_month"),
            expire_year=params.get("expire_year"),
            full_name=params.get("full_name"),
            user_email=user_email,
            user_id=user_id,
        )
        sto_id = (recurring_result or {}).get("sto_id")
        if not sto_id:
            logger.warning("Recurring created without STO ID; proceeding")

    except Exception as e:
        logger.exception("Error creating recurring (STO)")
        sto_id = None  # proceed with subscription upgrade even if STO failed

    # 5) Update subscription in Supabase
    try:
        updated = supabase_manager.update_subscription_after_payment(
            user_id=user_id,
            sto_id=sto_id,
            plan_type="pro",
            user_email=user_email,
            user_token=auth_token,
            limits=PRO_LIMITS,  # 500/2000 monthly
        )

        # Log history
        supabase_manager.save_api_history(
            user_id=user_id,
            user_query="Payment: upgrade to Pro",
            generated_code=None,
            endpoint="/payment/pay",
            status="Success" if updated else "Partial",
            execution_result={"sto_id": sto_id, "plan": "pro", "limits": PRO_LIMITS},
        )

        if not updated:
            return jsonify({
                "status": "success",
                "message": "Payment successful, but failed to update subscription. Please contact support.",
                "sto_id": sto_id,
            }), 200

        return jsonify({
            "status": "success",
            "message": "Payment successful! Your account has been upgraded to Pro.",
            "sto_id": sto_id,
        }), 200

    except Exception as e:
        logger.exception("Error updating subscription after payment")
        return jsonify({
            "status": "success",
            "message": "Payment successful, but account update failed. Please contact support.",
        }), 200


@payment_bp.route("/payment/cancel", methods=["POST"])
def cancel_payment():
    """
    Cancellation flow:
      1) Validate Authorization (JWT).
      2) Deactivate the user's STO in Tranzila (if exists).
      3) Downgrade user to Free (50 total/month) in Supabase.
      4) Log to API history.

    Note: OPTIONS requests are handled automatically by flask_cors in app.py
    """
    logger.info("🚫 /payment/cancel called")

    # 1) Authorization
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return jsonify({"status": "error", "message": "Authentication required"}), 401

    token = auth_header.split(" ")[1]
    user_data = supabase_manager.verify_token(token)
    if not user_data or not user_data.get("sub"):
        return jsonify({"status": "error", "message": "Invalid authentication"}), 401

    user_id = user_data["sub"]
    user_email = user_data.get("email", "Unknown User")

    # 2) Find STO
    sto_id = supabase_manager.get_user_sto_id(user_id)
    if not sto_id:
        logger.warning(f"User {user_id} has no STO; skipping remote cancel")
        sto_cancelled = True
    else:
        # Deactivate STO in Tranzila
        try:
            url = "https://api.tranzila.com/v1/sto/update"
            payload = {
                "terminal_name": TRANZILA_SUPPLIER,
                "sto_id": int(sto_id),
                "sto_status": "inactive",
                "response_language": "english",
                "updated_by_user": user_email,
            }
            headers = generate_tranzila_headers(TRANZILA_PUBLIC_API_KEY, TRANZILA_SECRET_API_KEY)

            resp = requests.post(url, json=payload, headers=headers, timeout=30)
            resp.raise_for_status()
            data = resp.json()
            sto_cancelled = (resp.status_code == 200 and data.get("error_code") == 0)

            if not sto_cancelled:
                logger.error(f"Tranzila cancellation failed: {data}")

        except Exception as e:
            logger.exception("HTTP error cancelling STO")
            return jsonify({"status": "error", "message": f"Cancel failed: {str(e)}"}), 500

    # 3) Downgrade to Free in Supabase
    try:
        downgraded = supabase_manager.cancel_user_subscription(
            user_id=user_id
        )

        # Log history
        supabase_manager.save_api_history(
            user_id=user_id,
            user_query="Cancel subscription (to Free)",
            generated_code=None,
            endpoint="/payment/cancel",
            status="Success" if downgraded else "Partial",
            execution_result={"sto_cancelled": sto_cancelled, "plan": "free", "limits": FREE_LIMITS},
        )

        if not downgraded:
            return jsonify({
                "status": "success",
                "message": "Subscription cancelled, but account update failed. Please contact support.",
            }), 200

        # Send cancellation confirmation email (non-critical)
        try:
            logger.info(f"📧 Sending cancellation confirmation email to {user_email}")
            # Get user name from token (try full_name from user_metadata, fallback to email)
            user_name = user_data.get('full_name') or user_data.get('user_metadata', {}).get('full_name') or user_email.split('@')[0]
            logger.info(f"   Sending to: {user_email}, Name: {user_name}")

            email_service.send_subscription_cancelled_email(
                user_email=user_email,
                user_name=user_name
            )
            logger.info(f"✅ Cancellation email sent successfully")
        except Exception as email_error:
            logger.warning(f"⚠️ Failed to send cancellation email (non-critical): {str(email_error)}")
            logger.exception(f"   Full error details:")

        return jsonify({
            "status": "success",
            "message": "Subscription cancelled. Your account was reverted to the Free plan.",
        }), 200

    except Exception as e:
        logger.exception("Error updating subscription after cancellation")
        return jsonify({"status": "error", "message": str(e)}), 500


@payment_bp.route("/payment/invoice/<retrieval_key>", methods=["GET", "OPTIONS"])
def download_invoice(retrieval_key):
    """
    Download invoice PDF using retrieval_key.

    This endpoint acts as a proxy between the user and Tranzila.
    It downloads the PDF from Tranzila with proper authentication headers
    and returns it to the user.

    The retrieval_key is obtained from the invoice creation response
    and sent to the user in the payment confirmation email.

    Security: The retrieval_key itself acts as authentication - it's a long,
    unguessable token generated by Tranzila. No additional JWT auth required
    since users access this from email links.

    Args:
        retrieval_key: Retrieval key from invoice creation (acts as auth token)

    Returns:
        PDF file or error message
    """
    logger.info(f"📥 /payment/invoice/<retrieval_key> called")
    logger.info(f"   Retrieval key: {retrieval_key[:20]}...")

    # Handle CORS preflight
    if request.method == "OPTIONS":
        return "", 200

    # Validate retrieval_key format (basic sanity check)
    if not retrieval_key or len(retrieval_key) < 20:
        logger.warning(f"Invalid retrieval_key format: {retrieval_key}")
        return jsonify({
            "status": "error",
            "message": "Invalid retrieval key"
        }), 400

    # Download PDF from Tranzila with authentication
    try:
        pdf_content = billing_service.download_invoice_pdf(retrieval_key)

        if not pdf_content:
            logger.error(f"❌ Failed to download invoice PDF")
            return jsonify({
                "status": "error",
                "message": "Failed to download invoice. The link may have expired or is invalid."
            }), 404

        # Return PDF to user
        from flask import Response
        logger.info(f"✅ Returning PDF ({len(pdf_content)} bytes)")

        return Response(
            pdf_content,
            mimetype='application/pdf',
            headers={
                'Content-Disposition': f'inline; filename=TalkAPI_Invoice.pdf',
                'Content-Type': 'application/pdf',
                'Cache-Control': 'private, max-age=3600'  # Cache for 1 hour
            }
        )

    except Exception as e:
        logger.exception(f"❌ Error downloading invoice")
        return jsonify({
            "status": "error",
            "message": "An error occurred while downloading the invoice"
        }), 500


@payment_bp.route("/payment/callback", methods=["POST", "GET", "OPTIONS"])
def payment_callback():
    """
    Synchronous callback (if configured at Tranzila).
    On success (Response == '000'), we mark the user as paid (Pro).
    On failure, we just log it to history.
    """
    if request.method == "OPTIONS":
        return "", 204

    try:
        # Log ALL parameters received from Tranzila
        logger.info(f"🔔 Payment callback received!")
        logger.info(f"🔔 Method: {request.method}")
        logger.info(f"🔔 All request.values: {dict(request.values)}")
        logger.info(f"🔔 Form data: {dict(request.form)}")
        logger.info(f"🔔 Query params: {dict(request.args)}")

        transaction_id = request.values.get("transaction_id") or request.values.get("index")
        status_code = request.values.get("Response")
        user_id = request.values.get("user_id") or request.values.get("u1")
        plan = (request.values.get("plan") or request.values.get("u2") or "pro").lower()
        amount = request.values.get("sum")
        order_id = request.values.get("order_id")

        logger.info(f"🔔 Parsed - trx={transaction_id} status={status_code} user={user_id} plan={plan} order={order_id}")

        if status_code == "000":
            # Mark as Pro with updated limits
            if user_id:
                try:
                    supabase_manager.update_user_profile(
                        user_id,
                        {
                            "plan_type": "pro",
                            "daily_limit": 100,  # Pro plan daily limit
                            "last_payment_date": datetime.now().isoformat(),
                            "payment_status": "active",
                            "subscription_status": "active",
                        },
                    )
                    supabase_manager.save_api_history(
                        user_id=user_id,
                        user_query="Payment callback: upgrade to Pro",
                        generated_code=None,
                        endpoint="/payment/callback",
                        status="Success",
                        execution_result={
                            "transaction_id": transaction_id,
                            "amount": amount,
                            "plan": "pro",
                            "limits": PRO_LIMITS,
                        },
                    )
                except Exception as e:
                    logger.error(f"Callback profile update error: {e}")

            return jsonify({
                "status": "success",
                "message": "Payment successful! Plan upgraded to Pro.",
                "transaction_id": transaction_id,
            }), 200

        # Failure case
        if user_id:
            try:
                supabase_manager.save_api_history(
                    user_id=user_id,
                    user_query=f"Failed payment for {plan} plan",
                    generated_code=None,
                    endpoint="/payment/callback",
                    status="Failed",
                    execution_result={
                        "transaction_id": transaction_id,
                        "error_code": status_code,
                        "plan": plan,
                    },
                )
            except Exception as e:
                logger.error(f"Callback failure log error: {e}")

        return jsonify({"status": "error", "message": "Payment failed", "error_code": status_code}), 400

    except Exception as e:
        logger.exception("Error in payment_callback")
        return jsonify({"status": "error", "message": "Internal server error processing payment"}), 500
