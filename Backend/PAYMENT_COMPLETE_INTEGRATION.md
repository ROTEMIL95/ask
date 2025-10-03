# Tranzila Payment Complete API Integration

This document explains the complete Tranzila payment integration using Hosted Fields and the Complete API.

## Overview

The integration follows a two-step process:
1. **Hosted Fields**: Collects payment information securely via iframes
2. **Complete API**: Finalizes the payment server-to-server using the payment token

## Architecture

```
Frontend (React) → Backend Token Creation → Payment Token → Backend Complete API → Tranzila Gateway
```

## Frontend Implementation (`checkout.jsx`)

### Step 1: Token Creation
- Sends payment details to `/api/payment/create-token` endpoint
- Backend creates payment token using Tranzila API with proper authentication
- Returns token for payment completion

### Step 2: Server-side Completion
- Sends payment token to `/api/payment/complete` endpoint
- Backend completes payment using Tranzila Complete API
- Handles response and redirects user accordingly

## Backend Endpoints

### 1. `/api/payment/create-token` (POST)

**Purpose**: Create payment token using Tranzila API with proper authentication

**Request Body**:
```json
{
  "terminal_name": "fxpsharon333",
  "amount": 19,
  "currency_code": "USD",
  "txn_type": "debit",
  "contact": "Jane Doe",
  "email": "jane@example.com"
}
```

**Response**:
```json
{
  "success": true,
  "token": "payment_token_12345",
  "order_id": "order_1234567890",
  "ResponseText": "Payment token created successfully"
}
```

### 2. `/api/payment/complete` (POST)

**Purpose**: Complete payment using Tranzila Complete API

**Request Body**:
```json
{
  "terminal_name": "fxpsharon333",
  "amount": 19,
  "currency_code": "USD",
  "txn_type": "debit",
  "token": "payment_token_from_hosted_fields",
  "order_id": "order_1234567890_abc123",
  "contact": "Jane Doe",
  "email": "jane@example.com",
  "callback_url": "https://domain.com/api/payment/callback"
}
```

**Response**:
```json
{
  "success": true,
  "ResponseCode": "000",
  "ResponseText": "Payment completed successfully",
  "order_id": "order_1234567890_abc123",
  "transaction_id": "tran_12345",
  "amount": 19,
  "currency": "USD"
}
```

### 3. `/api/payment/callback` (POST)

**Purpose**: Handle Tranzila webhook notifications

**Request Body** (from Tranzila):
```json
{
  "order_id": "order_1234567890_abc123",
  "transaction_id": "tran_12345",
  "status": "success",
  "amount": "19",
  "currency": "USD"
}
```

## Environment Variables

Add these to your `.env` file:

```bash
# Tranzila API Configuration
VITE_TRZ_PUBLIC_KEY=your_public_key_here
VITE_TRZ_PRIVATE_KEY=your_private_key_here
VITE_TRZ_TOKEN_URL=https://secure5.tranzila.com/api/v1/token/create
VITE_TRZ_COMPLETE_URL=https://secure5.tranzila.com/api/v1/payment/complete

# Frontend Environment Variables
VITE_TRZ_SUPPLIER=fxpsharon333
VITE_TRZ_SUM_PRO=19
VITE_TRZ_CURRENCY=USD
VITE_PUBLIC_BASE_URL=https://yourdomain.com
```

## Testing

### 1. Test the Endpoints

Run the test script:
```bash
cd Backend
python test_payment_complete.py
```

### 2. Manual Testing

Test the complete flow:
1. Start the backend: `cd Backend && python app.py`
2. Start the frontend: `cd Frontend && npm run dev`
3. Navigate to `/checkout`
4. Fill in test card details
5. Submit the form

## Security Features

1. **HTTPS Required**: Hosted Fields only work over HTTPS
2. **Server-side Processing**: Sensitive payment data never touches your server
3. **Token-based**: Uses secure tokens instead of raw card data
4. **Validation**: Comprehensive input validation and error handling

## Error Handling

### Common Errors

1. **CSP/HTTPS Issues**: Falls back to hosted payment page
2. **Invalid Token**: Returns appropriate error messages
3. **Network Issues**: Graceful fallback and user feedback
4. **Validation Errors**: Clear error messages for missing fields

### Fallback Strategy

If Hosted Fields fail:
1. Redirect to Tranzila hosted payment page
2. Process payment through standard flow
3. Handle callback notifications

## Database Integration

The endpoints include TODO comments for database integration:

```python
# TODO: Update user plan in database
# user_id = get_user_id_from_order(complete_params["order_id"])
# upgrade_user_to_pro(user_id)
```

Implement these functions to:
- Store order information
- Update user subscription status
- Track payment history

## Monitoring and Logging

All endpoints include comprehensive logging:
- Request/response logging
- Error tracking
- Payment status updates
- Performance monitoring

## Production Deployment

1. **HTTPS**: Ensure your domain uses HTTPS
2. **Domain Whitelist**: Add your domain to Tranzila's allowed list
3. **Environment Variables**: Set production values
4. **Monitoring**: Set up logging and alerting
5. **Testing**: Test with real Tranzila credentials

## Troubleshooting

### Hosted Fields Not Loading
- Check HTTPS configuration
- Verify domain whitelist with Tranzila
- Check browser console for CSP errors

### Payment Completion Fails
- Verify all required fields are present
- Check Tranzila API credentials
- Review backend logs for detailed errors

### Callback Issues
- Verify callback URL is accessible
- Check Tranzila webhook configuration
- Monitor callback endpoint logs

## Support

For issues:
1. Check backend logs for detailed error information
2. Verify Tranzila account configuration
3. Test endpoints with the provided test script
4. Review this documentation for common solutions
