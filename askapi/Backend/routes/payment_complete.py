from flask import Blueprint, request, jsonify
from repository.supabase_repo import Repo

payment_complete_bp = Blueprint("payment_complete", __name__)
repo = Repo()

@payment_complete_bp.post("/complete")
def payment_complete():
    data = request.get_json() or {}
    order_id = data.get("order_id")
    user_id  = data.get("user_id")
    txn_id   = data.get("txn_id")
    amount   = float(data.get("amount", 0))
    currency = data.get("currency", "USD")
    plan     = data.get("plan", "pro")
    days     = int(data.get("days", 30))

    if not order_id or not user_id or not txn_id:
        return jsonify({"success": False, "error": "missing fields"}), 400

    # Idempotency: if order already paid, just return success
    order = repo.get_order(order_id)
    if not order:
        return jsonify({"success": False, "error": "order not found"}), 404
    if order.get("status") == "paid":
        return jsonify({"success": True, "idempotent": True}), 200

    ok_paid = repo.mark_paid(order_id, txn_id, amount, currency)
    if not ok_paid:
        return jsonify({"success": False, "error": "failed to mark paid"}), 500

    ok_upgrade = repo.upgrade_user_to_pro(user_id, plan=plan, days=days)
    if not ok_upgrade:
        return jsonify({"success": False, "error": "failed to upgrade user"}), 500

    return jsonify({"success": True}), 200
