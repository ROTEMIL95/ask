from typing import Optional, Any, Dict
from datetime import datetime, timedelta
from supabase_client import SupabaseManager

ORDERS_TABLE = "orders"
PROFILES_TABLE = "profiles"
SUBSCRIPTION_DAYS = 30

class Repo:
    def __init__(self):
        self.sb = SupabaseManager()

    def get_order(self, order_id: str) -> Optional[Dict[str, Any]]:
        res = self.sb.client.table(ORDERS_TABLE).select("*").eq("id", order_id).limit(1).execute()
        if res.data:
            return res.data[0]
        return None

    def mark_paid(self, order_id: str, txn_id: str, amount: float, currency: str = "USD") -> bool:
        update = {
            "status": "paid",
            "transaction_id": txn_id,
            "paid_at": datetime.utcnow().isoformat() + "Z",
            "currency": currency,
            "amount": amount,
        }
        res = self.sb.client.table(ORDERS_TABLE).update(update).eq("id", order_id).execute()
        return bool(res.data)

    def upgrade_user_to_pro(self, user_id: str, plan: str = "pro", days: int = SUBSCRIPTION_DAYS) -> bool:
        expires_at = (datetime.utcnow() + timedelta(days=days)).isoformat() + "Z"
        update = {"plan": plan, "plan_expires_at": expires_at}
        res = self.sb.client.table(PROFILES_TABLE).update(update).eq("id", user_id).execute()
        return bool(res.data)
