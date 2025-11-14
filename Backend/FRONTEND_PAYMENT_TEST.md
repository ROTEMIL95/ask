# Frontend Payment Flow - Test Instructions

## Current System Status
- Backend Server: RUNNING on http://localhost:5000
- Frontend Server: RUNNING on http://localhost:5173
- Tranzila Credentials: CONFIGURED
- Authentication: READY

---

## Step-by-Step Test Instructions

### Step 1: Login to Your Account

1. Open your browser and navigate to: **http://localhost:5173**
2. If not logged in, go to the login page
3. Login with your test account credentials
4. You should be redirected to the home page

### Step 2: Navigate to Pricing Page

1. Click on "Pricing" in the navigation menu, or
2. Navigate directly to: **http://localhost:5173/pricing**
3. You should see two plans: Free and Pro

### Step 3: Click "Upgrade to Pro"

1. Locate the **Pro Plan** card (right side)
2. Click the **"Upgrade to Pro"** button
3. You should be redirected to: **http://localhost:5173/checkout?plan=pro**

### Step 4: Fill Payment Form

On the checkout page, fill in the following **TEST CARD** details:

```
Card Number:     4580000000000000
Expiry Month:    12
Expiry Year:     26
CVV:             123
Cardholder ID:   123456789
Cardholder Name: Test User
```

**IMPORTANT**:
- Use exactly `4580000000000000` for SUCCESS
- Use `4580000000000001` for DECLINE (to test error handling)
- Any future expiry date works (e.g., 12/26, 01/27, etc.)

### Step 5: Submit Payment

1. Review the payment amount: **19 ILS** (or test amount)
2. Click the **"Pay Now"** button
3. Watch the button change to "Processing..."

### Step 6: Expected Success Response

If payment succeeds, you should see:

```json
{
  "status": "success",
  "message": "Payment successful, upgraded to Pro",
  "sto_id": "123456",
  "plan": "pro",
  "limits": {
    "convert_limit": 500,
    "run_limit": 2000
  }
}
```

The page should:
- Show a success message
- Display your new Pro plan status
- Update your limits in the UI
- Redirect you to the home page or dashboard

---

## Verification Steps

### 1. Check Browser Console

Press **F12** to open Developer Tools and check:

```javascript
// You should see logs like:
"Payment successful!"
"User upgraded to Pro plan"
"STO ID: 123456"
"New limits: { convert_limit: 500, run_limit: 2000 }"
```

### 2. Check Network Tab

In Developer Tools → Network tab:

1. Find the **POST** request to `/payment/pay`
2. Check Request Headers:
   - `Authorization: Bearer YOUR_JWT_TOKEN`
   - `Content-Type: application/json`
3. Check Request Body:
   ```json
   {
     "card_number": "4580000000000000",
     "expire_month": "12",
     "expire_year": "26",
     "cvv": "123",
     "card_holder_id": "123456789",
     "card_holder_name": "Test User",
     "email": "your@email.com",
     "amount": 19
   }
   ```
4. Check Response Status: **200 OK**
5. Check Response Body for success data

### 3. Verify Database Update

Open your Supabase dashboard and run this SQL query:

```sql
SELECT
    email,
    plan_type,
    sto_id,
    subscription_status,
    subscription_start_date,
    last_payment_date,
    payment_method,
    daily_limit,
    monthly_limit
FROM api.user_profiles
WHERE email = 'YOUR_EMAIL_HERE';
```

**Expected Result**:
```
email: your@email.com
plan_type: pro
sto_id: 123456 (numeric ID from Tranzila)
subscription_status: active
subscription_start_date: 2025-11-13T09:28:00.000Z
last_payment_date: 2025-11-13T09:28:00.000Z
payment_method: credit_card
daily_limit: 100
monthly_limit: (null or higher value)
```

### 4. Check Tranzila Dashboard

1. Login to Tranzila: https://secure.tranzila.com/
2. Navigate to **Transactions** or **Reports**
3. Find your test transaction by:
   - Amount: 19 ILS
   - Card: ****0000
   - Time: Current timestamp
4. Verify:
   - Status: **Approved** (Response code: 000)
   - STO ID: Created successfully
   - Transaction ID: Matches your response

---

## Testing Error Scenarios

### Test 1: Declined Card

Use card: `4580000000000001` (will be declined)

**Expected Response**:
```json
{
  "status": "error",
  "message": "Payment declined by bank",
  "error_code": "001"
}
```

The UI should:
- Show error message
- Keep you on checkout page
- NOT update your plan
- Allow you to retry with different card

### Test 2: Missing Fields

Try submitting without CVV or other fields.

**Expected Response**:
```json
{
  "status": "error",
  "message": "Missing required field: cvv",
  "error_code": "VALIDATION_ERROR"
}
```

### Test 3: Expired Card

Use expiry: 01/20 (past date)

**Expected Response**:
```json
{
  "status": "error",
  "message": "Card expired",
  "error_code": "EXPIRED_CARD"
}
```

---

## Troubleshooting

### Issue: "Authentication required" error

**Solution**: Your JWT token expired. Logout and login again.

```bash
# Clear browser localStorage
localStorage.clear()
# Then login again
```

### Issue: "Backend server not responding"

**Solution**: Restart the backend server:

```bash
cd Backend
python app.py
```

### Issue: "Payment failed" without error message

**Solution**: Check backend logs:

```bash
# In Backend terminal, look for:
[ERROR] Tranzila API error: ...
[ERROR] Database update failed: ...
```

### Issue: Database not updating

**Solution**: Check Supabase connection:

```bash
cd Backend
python -c "from db.supabase_client import SupabaseClient; client = SupabaseClient(); print('Connected:', client.client is not None)"
```

### Issue: STO ID not created

**Cause**: Tranzila might not have created recurring payment token.

**Check**: Look in Tranzila dashboard under "STO Management"

---

## Post-Test Cleanup

### Reset to Free Plan

If you want to test again, cancel subscription:

```bash
curl -X POST http://localhost:5000/payment/cancel \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

Expected Response:
```json
{
  "status": "success",
  "message": "Subscription cancelled, downgraded to Free",
  "plan": "free"
}
```

### Clear Test Data from Database

```sql
UPDATE api.user_profiles
SET
    plan_type = 'free',
    sto_id = NULL,
    subscription_status = 'inactive',
    subscription_start_date = NULL,
    last_payment_date = NULL,
    payment_method = NULL,
    daily_limit = 5
WHERE email = 'YOUR_EMAIL_HERE';
```

---

## Success Checklist

- [ ] Successfully navigated to Pricing page
- [ ] Clicked "Upgrade to Pro" button
- [ ] Redirected to Checkout page
- [ ] Filled in test card details
- [ ] Submitted payment form
- [ ] Received success response
- [ ] Saw success message in UI
- [ ] Plan status updated to "Pro"
- [ ] Database record updated correctly
- [ ] STO ID created in Tranzila
- [ ] Transaction appears in Tranzila dashboard

---

## Next Steps After Successful Test

1. **Test Error Scenarios**: Try declined card, missing fields, etc.
2. **Test Subscription Cancellation**: Use the cancel endpoint
3. **Test Recurring Payment**: Wait for next billing cycle (or manually trigger)
4. **Load Testing**: Try multiple payments in sequence
5. **Production Switch**: When ready, update to production Tranzila credentials

---

## Support

- **Backend Logs**: Check `Backend/` terminal for detailed logs
- **Frontend Console**: Press F12 → Console tab
- **Network Requests**: F12 → Network tab
- **Tranzila Support**: support@tranzila.com
- **Tranzila Docs**: https://www.tranzila.com/docs

---

**Test Status**: Ready to begin testing

**Last Updated**: 2025-11-13 09:28
