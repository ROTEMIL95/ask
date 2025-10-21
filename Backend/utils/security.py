"""
Security Utilities
SSRF protection and request validation functions
"""
import re
from urllib.parse import urlparse
from typing import Tuple


class SSRFProtection:
    """
    Server-Side Request Forgery (SSRF) protection
    Prevents malicious requests to internal services while allowing legitimate public APIs
    """

    # Dangerous hostnames that should always be blocked
    DANGEROUS_HOSTS = [
        'localhost',
        '127.0.0.1',
        '0.0.0.0',
        '[::1]',
        '::1',
        '169.254.169.254',  # AWS EC2 metadata service
        'metadata.google.internal',  # GCP metadata service
        'metadata',
        'metadata.azure.com',  # Azure metadata service
    ]

    # Private IP address patterns (RFC 1918, RFC 4193)
    PRIVATE_IP_PATTERNS = [
        # IPv4 private ranges
        r'^10\.',                           # 10.0.0.0/8
        r'^172\.(1[6-9]|2[0-9]|3[01])\.',  # 172.16.0.0/12
        r'^192\.168\.',                     # 192.168.0.0/16
        # IPv6 private ranges
        r'^fc00:',  # Unique local addresses
        r'^fe80:',  # Link-local addresses
        r'^::1$',   # Loopback
        # Additional dangerous patterns
        r'^0\.0\.0\.0',
        r'^127\.',  # All 127.x.x.x loopback
    ]

    @classmethod
    def is_safe_url(cls, url: str) -> Tuple[bool, str]:
        """
        Check if a URL is safe to proxy (not an SSRF risk)

        Args:
            url: The URL to validate

        Returns:
            Tuple of (is_safe: bool, message: str)
        """
        if not url:
            return False, "URL is required"

        # 1. Protocol validation - only allow http/https
        if not url.startswith(('http://', 'https://')):
            return False, "Only HTTP and HTTPS protocols are allowed"

        try:
            parsed = urlparse(url)
        except Exception as e:
            return False, f"Invalid URL format: {str(e)}"

        hostname = (parsed.hostname or '').lower()

        if not hostname:
            return False, "URL must contain a valid hostname"

        # 2. Check for dangerous hostnames
        if hostname in cls.DANGEROUS_HOSTS:
            return False, f"Access to {hostname} is blocked for security reasons"

        # 3. Check for localhost variants with different cases
        if 'localhost' in hostname:
            return False, "Access to localhost is blocked for security reasons"

        # 4. Check for metadata service keywords
        metadata_keywords = ['metadata', 'meta-data', 'instance-data']
        if any(keyword in hostname for keyword in metadata_keywords):
            return False, "Access to metadata services is blocked for security reasons"

        # 5. Check for private IP addresses
        for pattern in cls.PRIVATE_IP_PATTERNS:
            if re.match(pattern, hostname):
                return False, f"Access to private IP addresses is blocked for security reasons"

        # 6. Check for IP addresses that might be obfuscated
        # Block hex, octal, and decimal representations of localhost
        suspicious_patterns = [
            r'^0x7f',  # Hex representation of 127.x
            r'^0177',  # Octal representation of 127.x
            r'^2130706433',  # Decimal representation of 127.0.0.1
        ]
        for pattern in suspicious_patterns:
            if re.match(pattern, hostname):
                return False, "Suspicious IP address format blocked"

        # 7. Check for DNS rebinding attempts (multiple IPs in hostname)
        if hostname.count('.') > 3 and hostname.replace('.', '').isdigit():
            # Looks like an IP but has too many octets
            return False, "Invalid IP address format"

        # URL is safe
        return True, "URL passed security validation"

    @classmethod
    def validate_request_size(cls, body: any, max_size: int = 10 * 1024 * 1024) -> Tuple[bool, str]:
        """
        Validate request body size to prevent abuse

        Args:
            body: Request body (string, dict, or bytes)
            max_size: Maximum allowed size in bytes (default: 10MB)

        Returns:
            Tuple of (is_valid: bool, message: str)
        """
        if body is None:
            return True, "No body to validate"

        try:
            # Calculate size based on type
            if isinstance(body, str):
                size = len(body.encode('utf-8'))
            elif isinstance(body, bytes):
                size = len(body)
            elif isinstance(body, dict):
                import json
                size = len(json.dumps(body).encode('utf-8'))
            else:
                size = len(str(body).encode('utf-8'))

            if size > max_size:
                max_mb = max_size / (1024 * 1024)
                actual_mb = size / (1024 * 1024)
                return False, f"Request body too large: {actual_mb:.2f}MB (max: {max_mb:.0f}MB)"

            return True, f"Request size OK: {size} bytes"

        except Exception as e:
            return False, f"Error validating request size: {str(e)}"

    @classmethod
    def validate_headers(cls, headers: dict) -> Tuple[bool, str]:
        """
        Validate request headers for security issues

        Args:
            headers: Dictionary of headers

        Returns:
            Tuple of (is_valid: bool, message: str)
        """
        if not isinstance(headers, dict):
            return False, "Headers must be a dictionary"

        # Check for suspicious header injection attempts
        for key, value in headers.items():
            # Check for newline characters (header injection)
            if '\n' in str(key) or '\r' in str(key):
                return False, "Invalid characters in header name"

            if '\n' in str(value) or '\r' in str(value):
                return False, "Invalid characters in header value"

            # Check for excessively long headers
            if len(str(key)) > 1000 or len(str(value)) > 10000:
                return False, "Header name or value too long"

        return True, "Headers validated successfully"


# Convenience functions
def is_safe_url(url: str) -> Tuple[bool, str]:
    """
    Check if URL is safe to proxy

    Args:
        url: URL to validate

    Returns:
        Tuple of (is_safe: bool, message: str)
    """
    return SSRFProtection.is_safe_url(url)


def validate_request_size(body: any, max_size: int = 10 * 1024 * 1024) -> Tuple[bool, str]:
    """
    Validate request body size

    Args:
        body: Request body
        max_size: Maximum size in bytes (default: 10MB)

    Returns:
        Tuple of (is_valid: bool, message: str)
    """
    return SSRFProtection.validate_request_size(body, max_size)


def validate_headers(headers: dict) -> Tuple[bool, str]:
    """
    Validate request headers

    Args:
        headers: Headers dictionary

    Returns:
        Tuple of (is_valid: bool, message: str)
    """
    return SSRFProtection.validate_headers(headers)
