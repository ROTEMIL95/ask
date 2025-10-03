# Tranzila Payment Gateway Integration

This Flask backend includes integration with the Tranzila payment gateway for processing credit card transactions.

## Endpoint

**POST** `/pay`

Process a payment through Tranzila gateway.

### Request Format

```json
{
  "amount": 100.50,
  "ccno": "4580458045804580",
  "expdate": "1225",
  "cvv": "123",
  "myid": "ORDER_12345"
}
```

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `amount` | number | Yes | Amount to charge (in ILS) |
| `ccno` | string | Yes | Credit card number |
| `expdate` | string | Yes | Expiration date in MMYY format |
| `cvv` | string | Yes | Card verification value |
| `myid` | string | No | Optional order/transaction ID |

### Response Format

#### Success Response
```json
{
  "status": "success",
  "transaction_id": "12345678",
  "response_code": "000",
  "response_message": "Transaction approved",
  "amount": 100.50,
  "currency": "ILS",
  "timestamp": "2024-01-15T10:30:00",
  "tranzila_response": {
    "Response": "000",
    "ConfirmationCode": "12345678",
    "ResponseText": "Transaction approved"
  }
}
```

#### Failure Response
```json
{
  "status": "failure",
  "transaction_id": "",
  "response_code": "001",
  "response_message": "Card declined",
  "amount": 100.50,
  "currency": "ILS",
  "timestamp": "2024-01-15T10:30:00",
  "tranzila_response": {
    "Response": "001",
    "ResponseText": "Card declined"
  }
}
```

#### Error Response
```json
{
  "status": "error",
  "message": "Missing required fields: ccno, expdate"
}
```

## Tranzila Configuration

The integration is configured with the following parameters:

- **Supplier**: `fxpsharon333tok`
- **Currency**: `1` (ILS - Israeli Shekel)
- **Transaction Mode**: `A` (Regular charge)
- **Endpoint**: `https://secure5.tranzila.com/cgi-bin/tranzila31.cgi`

## Testing

Use the provided test script to test the integration:

```bash
python test_payment.py
```

### Test Credit Card Numbers

For testing purposes, you can use these test card numbers:

- **Visa**: `4580458045804580`
- **MasterCard**: `5326542347581234`
- **American Express**: `374245455400126`

**Note**: These are test numbers and will not process real transactions.

## Security Considerations

### ⚠️ Important Security Notes

1. **Authentication**: This endpoint should be protected with proper authentication in production
2. **HTTPS Only**: Always use HTTPS in production to protect sensitive data
3. **Input Validation**: All input is validated, but additional sanitization may be needed
4. **Logging**: Credit card numbers are masked in logs (only last 4 digits shown)
5. **Rate Limiting**: The endpoint is rate-limited to 10 requests per minute
6. **PCI Compliance**: Ensure your application meets PCI DSS requirements

### Production Checklist

- [ ] Enable HTTPS/SSL
- [ ] Implement proper authentication
- [ ] Set up proper logging (without sensitive data)
- [ ] Configure rate limiting appropriately
- [ ] Test with real Tranzila merchant account
- [ ] Implement proper error handling
- [ ] Set up monitoring and alerts
- [ ] Ensure PCI DSS compliance

## Error Codes

Common Tranzila response codes:

| Code | Description |
|------|-------------|
| 000 | Transaction approved |
| 001 | Card declined |
| 002 | Insufficient funds |
| 003 | Invalid card number |
| 004 | Expired card |
| 005 | Invalid CVV |

## Rate Limiting

The payment endpoint is rate-limited to **10 requests per minute** per IP address to prevent abuse.

## Environment Variables

No additional environment variables are required for basic functionality. The Tranzila supplier ID is hardcoded in the implementation.

## Support

For Tranzila-specific issues, contact Tranzila support:
- Website: https://www.tranzila.com/
- Documentation: Available through Tranzila merchant portal

## Testing the Integration

1. Start your Flask backend:
   ```bash
   python app.py
   ```

2. Run the test script:
   ```bash
   python test_payment.py
   ```

3. Or test manually with curl:
   ```bash
   curl -X POST http://localhost:5000/pay \
     -H "Content-Type: application/json" \
     -d '{
       "amount": 50.00,
       "ccno": "4580458045804580",
       "expdate": "1225",
       "cvv": "123",
       "myid": "TEST_001"
     }'
   ```