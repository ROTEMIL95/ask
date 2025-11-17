"""
Email Service
Handles sending beautiful HTML emails for payment confirmations, invoices, etc.
"""

import os
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from datetime import datetime

logger = logging.getLogger(__name__)

# SMTP Configuration from environment
SMTP_SERVER = os.getenv("SMTP_SERVER")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USERNAME = os.getenv("SMTP_USERNAME")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")


def send_payment_success_email(
    user_email: str,
    user_name: str,
    amount: float,
    plan_type: str,
    transaction_id: str,
    invoice_url: Optional[str] = None,
    daily_limit: int = 100,
    monthly_limit: int = 2000
) -> bool:
    """
    Send a beautiful payment confirmation email to the user

    Args:
        user_email: Customer email address
        user_name: Customer full name
        amount: Amount paid
        plan_type: Plan type (e.g., 'pro')
        transaction_id: Transaction ID from payment gateway
        invoice_url: URL to invoice PDF (optional)
        daily_limit: Daily API request limit
        monthly_limit: Monthly API request limit

    Returns:
        True if email sent successfully, False otherwise
    """
    logger.info(f"📧 Sending payment success email to {user_email}")

    # Validate SMTP configuration
    if not all([SMTP_SERVER, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD]):
        logger.error("❌ SMTP configuration incomplete - cannot send email")
        return False

    try:
        # Create email message
        msg = MIMEMultipart("alternative")
        msg["From"] = f"TalkAPI <{SMTP_USERNAME}>"
        msg["To"] = user_email
        msg["Subject"] = f"🎉 Welcome to TalkAPI {plan_type.upper()} Plan!"

        # Format date
        payment_date = datetime.now().strftime("%B %d, %Y at %I:%M %p")

        # Create beautiful HTML email
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    background-color: #f5f5f5;
                    margin: 0;
                    padding: 0;
                }}
                .email-wrapper {{
                    max-width: 600px;
                    margin: 40px auto;
                    background-color: #ffffff;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }}
                .header {{
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 40px 30px;
                    text-align: center;
                }}
                .header h1 {{
                    margin: 0;
                    font-size: 32px;
                    font-weight: 700;
                }}
                .header p {{
                    margin: 10px 0 0 0;
                    font-size: 18px;
                    opacity: 0.95;
                }}
                .content {{
                    padding: 40px 30px;
                }}
                .greeting {{
                    font-size: 20px;
                    color: #333;
                    margin-bottom: 20px;
                }}
                .message {{
                    font-size: 16px;
                    color: #666;
                    margin-bottom: 30px;
                    line-height: 1.8;
                }}
                .plan-details {{
                    background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
                    border-left: 4px solid #667eea;
                    padding: 25px;
                    margin: 30px 0;
                    border-radius: 8px;
                }}
                .plan-details h2 {{
                    margin: 0 0 20px 0;
                    color: #667eea;
                    font-size: 22px;
                }}
                .detail-row {{
                    display: flex;
                    justify-content: space-between;
                    padding: 12px 0;
                    border-bottom: 1px solid #e0e0e0;
                }}
                .detail-row:last-child {{
                    border-bottom: none;
                }}
                .detail-label {{
                    font-weight: 600;
                    color: #555;
                }}
                .detail-value {{
                    color: #667eea;
                    font-weight: 600;
                }}
                .features {{
                    margin: 30px 0;
                }}
                .features h3 {{
                    color: #333;
                    font-size: 18px;
                    margin-bottom: 15px;
                }}
                .feature-item {{
                    padding: 10px 0;
                    padding-left: 30px;
                    position: relative;
                    color: #666;
                }}
                .feature-item:before {{
                    content: "✓";
                    position: absolute;
                    left: 0;
                    color: #10b981;
                    font-weight: bold;
                    font-size: 18px;
                }}
                .cta-button {{
                    display: inline-block;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 15px 40px;
                    text-decoration: none;
                    border-radius: 8px;
                    font-weight: 600;
                    font-size: 16px;
                    margin: 20px 0;
                    text-align: center;
                }}
                .invoice-section {{
                    background-color: #f9fafb;
                    padding: 20px;
                    border-radius: 8px;
                    margin: 20px 0;
                    text-align: center;
                }}
                .invoice-button {{
                    display: inline-block;
                    background-color: #10b981;
                    color: white;
                    padding: 12px 30px;
                    text-decoration: none;
                    border-radius: 6px;
                    font-weight: 600;
                    margin-top: 10px;
                }}
                .footer {{
                    background-color: #f9fafb;
                    padding: 30px;
                    text-align: center;
                    color: #666;
                    font-size: 14px;
                    border-top: 1px solid #e5e7eb;
                }}
                .footer a {{
                    color: #667eea;
                    text-decoration: none;
                }}
                .transaction-id {{
                    font-family: 'Courier New', monospace;
                    background-color: #f3f4f6;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 14px;
                }}
            </style>
        </head>
        <body>
            <div class="email-wrapper">
                <!-- Header -->
                <div class="header">
                    <h1>🎉 Payment Successful!</h1>
                    <p>Welcome to TalkAPI {plan_type.upper()}</p>
                </div>

                <!-- Content -->
                <div class="content">
                    <div class="greeting">
                        Hi {user_name},
                    </div>

                    <div class="message">
                        Thank you for upgrading to <strong>TalkAPI {plan_type.upper()}</strong>!
                        Your payment has been processed successfully, and your account has been upgraded.
                    </div>

                    <!-- Plan Details -->
                    <div class="plan-details">
                        <h2>📋 Payment Details</h2>
                        <div class="detail-row">
                            <span class="detail-label">Plan</span>
                            <span class="detail-value">{plan_type.upper()} Plan</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Amount Paid</span>
                            <span class="detail-value">${amount:.2f}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Payment Date</span>
                            <span class="detail-value">{payment_date}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Transaction ID</span>
                            <span class="detail-value transaction-id">{transaction_id}</span>
                        </div>
                    </div>

                    <!-- Features -->
                    <div class="features">
                        <h3>✨ Your {plan_type.upper()} Features</h3>
                        <div class="feature-item">
                            <strong>{daily_limit}</strong> API requests per day
                        </div>
                        <div class="feature-item">
                            <strong>{monthly_limit}</strong> API requests per month
                        </div>
                        <div class="feature-item">
                            Advanced code generation with Claude AI
                        </div>
                        <div class="feature-item">
                            API history & favorites
                        </div>
                        <div class="feature-item">
                            Priority email support
                        </div>
                        <div class="feature-item">
                            Custom API documentation
                        </div>
                    </div>

                    {f'''
                    <!-- Invoice -->
                    <div class="invoice-section">
                        <h3 style="margin-top: 0; color: #333;">📄 Your Invoice</h3>
                        <p style="color: #666; margin-bottom: 15px;">
                            Click below to download your invoice (PDF)
                        </p>
                        <a href="{invoice_url}" class="invoice-button" target="_blank">
                            Download Invoice
                        </a>
                    </div>
                    ''' if invoice_url else ''}

                    <!-- CTA Button -->
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="https://talkapi.ai/home" class="cta-button">
                            Start Using TalkAPI →
                        </a>
                    </div>

                    <div class="message" style="margin-top: 30px;">
                        If you have any questions or need assistance, feel free to reach out to our support team.
                    </div>
                </div>

                <!-- Footer -->
                <div class="footer">
                    <p style="margin: 0 0 10px 0;">
                        <strong>TalkAPI</strong> - AI-Powered API Integration
                    </p>
                    <p style="margin: 0 0 10px 0;">
                        <a href="https://talkapi.ai">talkapi.ai</a> |
                        <a href="https://talkapi.ai/account">My Account</a> |
                        <a href="mailto:{SMTP_USERNAME}">Support</a>
                    </p>
                    <p style="margin: 10px 0 0 0; font-size: 12px; color: #999;">
                        This email was sent to {user_email} because you made a purchase on TalkAPI.
                    </p>
                </div>
            </div>
        </body>
        </html>
        """

        # Attach HTML body
        msg.attach(MIMEText(html_body, "html"))

        # Send email via SMTP
        logger.info(f"📡 Connecting to SMTP server: {SMTP_SERVER}:{SMTP_PORT}")

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)

            logger.info(f"📤 Sending payment success email to: {user_email}")
            server.send_message(msg)

        logger.info(f"✅ Payment success email sent successfully to {user_email}")
        return True

    except smtplib.SMTPAuthenticationError as e:
        logger.error(f"❌ SMTP Authentication failed: {e}")
        return False

    except smtplib.SMTPException as e:
        logger.error(f"❌ SMTP error: {e}")
        return False

    except Exception as e:
        logger.error(f"❌ Unexpected error sending email: {e}")
        return False


def send_subscription_cancelled_email(user_email: str, user_name: str) -> bool:
    """
    Send email when user cancels their subscription

    Args:
        user_email: Customer email
        user_name: Customer name

    Returns:
        True if sent successfully
    """
    logger.info(f"📧 Sending cancellation email to {user_email}")

    if not all([SMTP_SERVER, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD]):
        logger.error("❌ SMTP configuration incomplete")
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["From"] = f"TalkAPI <{SMTP_USERNAME}>"
        msg["To"] = user_email
        msg["Subject"] = "Your TalkAPI Subscription Has Been Cancelled"

        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: #667eea; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px; }}
                .footer {{ margin-top: 20px; padding-top: 20px; border-top: 2px solid #667eea; font-size: 12px; color: #666; text-align: center; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>Subscription Cancelled</h2>
                </div>
                <div class="content">
                    <p>Hi {user_name},</p>
                    <p>Your TalkAPI Pro subscription has been successfully cancelled.</p>
                    <p>You have been reverted to the <strong>Free Plan</strong> with the following limits:</p>
                    <ul>
                        <li>50 API requests per day</li>
                        <li>500 API requests per month</li>
                        <li>Basic features</li>
                    </ul>
                    <p>We're sorry to see you go! If you change your mind, you can upgrade again anytime from your account dashboard.</p>
                    <p style="text-align: center; margin-top: 30px;">
                        <a href="https://talkapi.ai/pricing" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
                            View Plans
                        </a>
                    </p>
                </div>
                <div class="footer">
                    <p><strong>TalkAPI</strong> - AI-Powered API Integration</p>
                    <p><a href="https://talkapi.ai">talkapi.ai</a> | <a href="mailto:{SMTP_USERNAME}">Support</a></p>
                </div>
            </div>
        </body>
        </html>
        """

        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)

        logger.info(f"✅ Cancellation email sent to {user_email}")
        return True

    except Exception as e:
        logger.error(f"❌ Error sending cancellation email: {e}")
        return False
