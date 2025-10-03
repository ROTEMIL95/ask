import time
import hmac
import hashlib
import secrets
import binascii

def generate_tranzila_headers(app_key: str, secret: str) -> dict:
    """
    Generate Tranzila API headers for authentication
    Based on official Tranzila documentation
    """
    # Generate timestamp (Unix timestamp)
    timestamp = int(time.time())
    
    # Generate nonce (40 bytes = 80 hex chars)
    nonce = str(binascii.hexlify(secrets.token_bytes(40)), 'utf-8')
    
    # Create access key using HMAC-SHA256
    # key = (private_key + timestamp + nonce)
    # message = public_key (app_key)
    key = (secret + str(timestamp) + nonce).encode('utf-8')
    msg = app_key.encode('utf-8')
    access_key = hmac.new(key, msg, hashlib.sha256).hexdigest()

    return {
        "X-tranzila-api-app-key": app_key,
        "X-tranzila-api-request-time": str(timestamp),
        "X-tranzila-api-nonce": nonce,
        "X-tranzila-api-access-token": access_key,
        "Content-Type": "application/json",
    }