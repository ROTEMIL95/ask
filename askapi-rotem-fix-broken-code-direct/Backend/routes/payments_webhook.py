import os
import hmac
import hashlib
from flask import Blueprint, request, jsonify
from repository.supabase_repo import Repo

payments_webhook_bp = Blueprint("payments_webhook", __name__)
repo = Repo()

WEBHOOK_SECRET = os.getenv("WEBHOOK_SECRET", "")

def verify_signature(raw_body: bytes, signature: str) -> bool:
    """
    Verify HMAC SHA256 signature.
    The sender must send hex signature in `X-Signature` header.
    """
    if not WEBHOOK_SECRET or not signature:
        return False
    mac = hmac.new(WEBHOOK_SECRET.encode("utf-8"), msg=raw_body, digestmod=hashlib.sha256)
    expected = mac.hexdigest()
    return hmac.compare_digest(expected, signature)

@payments_webhook_bp.post("/webhook")
def webhook():
    # 1) Verify signature
    raw = request.get_data()
    sig = request.headers.get("X-Signature", "")
    if not verify_signature(raw, sig):
        return jsonify({"success": False, "error": "invalid signature"}), 401

    # 2) Parse payload
    payload = request.get_json(silent=True) or {}
    order_id   = payload.get("order_id")
    user_id    = payload.get("user_id")
    txn_id     = payload.get("txn_id")
    amount     = float(payload.get("amount", 0))
    currency   = payload.get("currency", "USD")
    plan       = payload.get("plan", "pro")
    days       = int(payload.get("days", 30))

    if not order_id or not user_id or not txn_id:
        return jsonify({"success": False, "error": "missing required fields"}), 400

    # 3) Idempotency check
    order = repo.get_order(order_id)
    if not order:
        return jsonify({"success": False, "error": "order not found"}), 404
    if order.get("status") == "paid":
        return jsonify({"success": True, "idempotent": True}), 200

    # 4) Mark order as paid
    ok_paid = repo.mark_paid(order_id, txn_id, amount, currency)
    if not ok_paid:
        return jsonify({"success": False, "error": "failed to mark paid"}), 500

    # 5) Upgrade user
    ok_upgrade = repo.upgrade_user_to_pro(user_id, plan=plan, days=days)
    if not ok_upgrade:
        return jsonify({"success": False, "error": "failed to upgrade user"}), 500

    return jsonify({"success": True}), 200
