# Tranzila Payment Integration - Complete Testing Guide

## System Status: ✅ READY FOR TESTING

### Current Configuration
- **Backend Server**: Running on http://localhost:5000
- **Frontend Server**: Running on http://localhost:5173
- **Tranzila Credentials**: Configured and verified
- **Database**: Supabase connected
- **Test Mode**: Active (using test cards)

---

## Quick Start - 3 Steps to Test

### 1. Open the Checkout Page
Navigate to: **http://localhost:5173/pricing** and click **"Upgrade to Pro"**

### 2. Enter Test Card Details
```
Card Number:  4580000000000000
Expiry:       12/26
CVV:          123
Name:         Test User
```

### 3. Click "Pay $1" and Verify
✅ Success message appears
✅ Plan upgrades to Pro
✅ Database updates with STO ID

---

## Complete Payment Flow

### Frontend Flow (Checkout.jsx)
```
User clicks "Upgrade to Pro" on Pricing page
  ↓
Redirected to /checkout?plan=pro
  ↓
Fills payment form with card details
  ↓
Clicks "Pay $1" button (test amount)
  ↓
Calls handleRecurringPayment() from payment.service.jsx
  ↓
POST /payment/pay with JWT token + card data
```

### Backend Flow (payment_routes.py)
```
Receives POST /payment/pay request
  ↓
Validates JWT token → gets user_id
  ↓
Validates card data (card_number, expiry, cvv)
  ↓
Calls Tranzila API with HMAC-SHA256 auth
  ↓
Creates recurring payment (STO)
  ↓
Updates Supabase user_profiles table
  ↓
Returns success + STO ID + plan limits
```

### Database Update (supabase_client.py)
```
update_subscription_after_payment() function updates:

plan_type              → 'pro'
sto_id                 → '123456' (from Tranzila)
subscription_status    → 'active'
subscription_start_date → current timestamp
last_payment_date      → current timestamp
payment_method         → 'credit_card'
daily_limit            → 100
```

---

## Testing Documentation

### 📄 Test Files Created

1. **test_tranzila.py** - Automated backend tests
   - Credentials verification
   - Headers generation
   - API connectivity
   - All tests PASSED ✅

2. **TRANZILA_TEST_GUIDE.md** - Comprehensive test guide
   - Test results summary
   - 3 testing methods (Frontend, Postman, Script)
   - Database verification queries
   - Troubleshooting guide

3. **FRONTEND_PAYMENT_TEST.md** - Frontend step-by-step guide
   - Detailed UI testing instructions
   - Browser console verification
   - Network tab debugging
   - Error scenario testing

4. **QUICK_TEST_REFERENCE.md** - Quick reference card
   - Test card numbers
   - Essential URLs
   - Common SQL queries
   - Curl commands

---

## Test Results Summary

### ✅ Automated Tests (test_tranzila.py)
```
[PASSED] Test 1: Credentials loaded correctly
[PASSED] Test 2: Authentication headers generated
[PASSED] Test 3: Tranzila API connection successful
[PASSED] Test 4: Test card information provided

ALL TESTS PASSED
```

### ✅ System Verification
```
✓ Backend server running on port 5000
✓ Frontend dev server running on port 5173
✓ Tranzila credentials configured
✓ HMAC-SHA256 authentication working
✓ Database connection established
✓ Payment endpoints accessible
```

---

## Test Cards Reference

### Success Card
```
Card:  4580000000000000
Exp:   12/26 (any future date)
CVV:   123
ID:    123456789
Name:  Test User

Expected: Payment approved, STO created
```

### Decline Card
```
Card:  4580000000000001
Exp:   12/26
CVV:   123

Expected: Payment declined with error
```

---

## API Endpoints

### Payment Endpoints

#### POST /payment/pay
Create payment + recurring subscription

**Headers**:
```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN",
  "Content-Type": "application/json"
}
```

**Body**:
```json
{
  "card_number": "4580000000000000",
  "expire_month": "12",
  "expire_year": "26",
  "cvv": "123",
  "full_name": "Test User"
}
```

**Success Response**:
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

#### POST /payment/cancel
Cancel recurring subscription

**Headers**: Same as above

**Success Response**:
```json
{
  "status": "success",
  "message": "Subscription cancelled, downgraded to Free",
  "plan": "free"
}
```

---

## Database Schema

### user_profiles Table (api schema)
```sql
plan_type              VARCHAR   -- 'free' or 'pro'
sto_id                 VARCHAR   -- Tranzila recurring payment ID
subscription_status    VARCHAR   -- 'active' or 'inactive'
subscription_start_date TIMESTAMP -- When subscription started
last_payment_date      TIMESTAMP -- Last successful payment
payment_method         VARCHAR   -- 'credit_card'
daily_limit            INTEGER   -- 5 (free) or 100 (pro)
monthly_limit          INTEGER   -- Optional limit
```

### Verification Query
```sql
SELECT
    email,
    plan_type,
    sto_id,
    subscription_status,
    DATE(subscription_start_date) as started,
    DATE(last_payment_date) as last_payment,
    payment_method,
    daily_limit
FROM api.user_profiles
WHERE email = 'YOUR_EMAIL';
```

---

## Recommended Testing Sequence

### Phase 1: Happy Path ✅
1. ✅ Run automated tests (test_tranzila.py)
2. 🔄 Test frontend checkout with success card
3. ⏳ Verify database update
4. ⏳ Check Tranzila dashboard

### Phase 2: Error Handling
1. ⏳ Test with declined card (4580000000000001)
2. ⏳ Test with missing fields
3. ⏳ Test with expired card
4. ⏳ Test without authentication

### Phase 3: Subscription Management
1. ⏳ Test subscription cancellation
2. ⏳ Verify downgrade to free plan
3. ⏳ Test re-upgrade to pro

### Phase 4: Integration
1. ⏳ Test complete user journey
2. ⏳ Verify limits apply correctly
3. ⏳ Test API usage tracking
4. ⏳ Monitor for edge cases

---

## Current Test Amount

**Note**: The checkout is currently set to **$1** for testing (line 30 in Checkout.jsx)

```javascript
const sum = plan === 'pro' ? 1 : 19.99;
```

This is PERFECT for testing. Change to 19 or 19.99 for production.

---

## Security Checklist

### ✅ Current Security
- [x] HMAC-SHA256 authentication with Tranzila
- [x] JWT token validation on all payment endpoints
- [x] Credentials stored in environment variables (.env)
- [x] No card data stored in database
- [x] HTTPS enforced (in production)
- [x] Test mode enabled (safe to test)
- [x] Input validation on card fields
- [x] Rate limiting (backend)

### 🔒 Before Production
- [ ] Switch to production Tranzila credentials
- [ ] Enable HTTPS/SSL certificate
- [ ] Set up webhook URL in Tranzila dashboard
- [ ] Configure production payment amounts
- [ ] Test with real small amounts
- [ ] Set up monitoring and alerts
- [ ] Review error handling
- [ ] Load testing
- [ ] PCI compliance review
- [ ] Legal terms acceptance

---

## Troubleshooting

### Common Issues

**"Authentication required"**
→ JWT token expired. Logout and login again.

**"Payment failed"**
→ Check backend logs for Tranzila API errors.

**Database not updating**
→ Verify Supabase connection and RLS policies.

**STO ID not created**
→ Check Tranzila dashboard under "STO Management".

**$1 vs $19 amount**
→ Line 30 in Checkout.jsx controls test amount.

### Debug Commands

```bash
# Check backend health
curl http://localhost:5000/health

# Check Supabase connection
cd Backend
python -c "from db.supabase_client import SupabaseClient; print('OK' if SupabaseClient().client else 'FAIL')"

# View backend logs
cd Backend
python app.py
# Look for: [SUCCESS], [ERROR], [WARNING] markers

# Check database
psql $DATABASE_URL -c "SELECT email, plan_type, sto_id FROM api.user_profiles;"
```

---

## Next Steps

### Immediate (Today)
1. **Test frontend checkout** - Use the step-by-step guide
2. **Verify database update** - Run the SQL query
3. **Check Tranzila dashboard** - Confirm transaction appears

### Short-term (This Week)
1. **Test error scenarios** - Declined card, missing fields
2. **Test cancellation flow** - Downgrade to free
3. **Test multiple payments** - Load testing
4. **Review logs** - Check for any warnings

### Before Production
1. **Update payment amount** - Change from $1 to $19
2. **Switch credentials** - Production Tranzila keys
3. **Enable webhooks** - Set up in Tranzila dashboard
4. **SSL certificate** - Ensure HTTPS
5. **Compliance review** - PCI, legal terms

---

## Support Resources

### Documentation
- **This Guide**: PAYMENT_TESTING_COMPLETE.md
- **Test Guide**: TRANZILA_TEST_GUIDE.md
- **Frontend Guide**: FRONTEND_PAYMENT_TEST.md
- **Quick Ref**: QUICK_TEST_REFERENCE.md

### URLs
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:5000
- **Tranzila Dashboard**: https://secure.tranzila.com/
- **Tranzila Docs**: https://www.tranzila.com/docs
- **Tranzila Support**: support@tranzila.com

### Code Files
- **Frontend Payment**: Frontend/src/services/payment.service.jsx
- **Frontend Checkout**: Frontend/src/pages/Checkout.jsx
- **Backend Routes**: Backend/routes/payment_routes.py
- **Backend Service**: Backend/services/payment_service.py
- **Tranzila Auth**: Backend/services/tranzila_service.py
- **Database**: Backend/db/supabase_client.py

---

## Summary

✅ **System Status**: Fully operational and ready for testing

✅ **Automated Tests**: All passed successfully

✅ **Documentation**: Complete guides available

✅ **Test Cards**: Success (4580000000000000) and Decline (4580000000000001)

✅ **Servers**: Both frontend and backend running

🚀 **Next Action**: Open http://localhost:5173/pricing and click "Upgrade to Pro"

---

**Last Updated**: 2025-11-13 09:30
**Status**: READY FOR FRONTEND TESTING
**Test Amount**: $1 (perfect for testing)
**Test Mode**: Active ✅
