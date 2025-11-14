# Quick Payment Test Reference

## Test Card - SUCCESS
```
Card Number:     4580000000000000
Expiry:          12/26
CVV:             123
ID:              123456789
Name:            Test User
```

## Test Card - DECLINE
```
Card Number:     4580000000000001
Expiry:          12/26
CVV:             123
```

## URLs
- **Frontend**: http://localhost:5173
- **Pricing**: http://localhost:5173/pricing
- **Checkout**: http://localhost:5173/checkout?plan=pro
- **Backend**: http://localhost:5000
- **Tranzila Dashboard**: https://secure.tranzila.com/

## Quick Database Check
```sql
SELECT email, plan_type, sto_id, subscription_status, daily_limit
FROM api.user_profiles
WHERE email = 'YOUR_EMAIL';
```

## Reset to Free Plan
```bash
curl -X POST http://localhost:5000/payment/cancel \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Expected Success Response
```json
{
  "status": "success",
  "message": "Payment successful, upgraded to Pro",
  "sto_id": "123456",
  "plan": "pro"
}
```

## Servers Running?
```bash
# Check backend
curl http://localhost:5000/health

# Check frontend
curl http://localhost:5173
```
